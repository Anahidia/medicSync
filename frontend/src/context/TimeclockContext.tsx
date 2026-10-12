'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

export interface TimeClockUser {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
}

export interface TimeClockEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  durationHours: number | null;
  deviceOrIp?: string | null;
  shiftType: string;
  notes?: string | null;
  user?: TimeClockUser;
}

export interface TimeclockContextType {
  isClockedIn: boolean;
  activeEntry: TimeClockEntry | null;
  recentEntries: TimeClockEntry[];
  activeStaff: TimeClockEntry[];
  loading: boolean;
  clockLoading: boolean;
  elapsedSeconds: number;
  formattedElapsed: string;
  clockIn: (shiftType?: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  clockOut: (notes?: string) => Promise<{ success: boolean; error?: string }>;
  refreshClock: () => Promise<void>;
}

export function formatElapsedDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

const defaultContext: TimeclockContextType = {
  isClockedIn: false,
  activeEntry: null,
  recentEntries: [],
  activeStaff: [],
  loading: false,
  clockLoading: false,
  elapsedSeconds: 0,
  formattedElapsed: '0h 00m 00s',
  clockIn: async () => ({ success: false, error: 'Context not initialized' }),
  clockOut: async () => ({ success: false, error: 'Context not initialized' }),
  refreshClock: async () => {},
};

const TimeclockContext = createContext<TimeclockContextType>(defaultContext);

export function TimeclockProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeClockEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<TimeClockEntry[]>([]);
  const [activeStaff, setActiveStaff] = useState<TimeClockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Broadcast sync helper
  const notifyBroadcast = () => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('medisync_timeclock_sync');
        channel.postMessage({ type: 'CLOCK_UPDATE', timestamp: Date.now() });
        channel.close();
      }
    } catch {
      // Ignorar si no está soportado
    }
  };

  const fetchClockData = useCallback(async (showLoading = false) => {
    if (!user) {
      setIsClockedIn(false);
      setActiveEntry(null);
      setRecentEntries([]);
      setActiveStaff([]);
      setElapsedSeconds(0);
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/timeclock');
      if (res.ok) {
        const data = await res.json();
        setIsClockedIn(Boolean(data.isClockedIn));
        setActiveEntry(data.activeEntry || null);
        setRecentEntries(data.recentEntries || []);
        setActiveStaff(data.activeStaff || []);
      }
    } catch (e) {
      console.error('Error al obtener datos de fichaje:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  // Cargar estado al montar o cambiar usuario (ej. cambio de rol en demo)
  useEffect(() => {
    fetchClockData(true);
  }, [fetchClockData]);

  // Polling periódico cada 30 segundos para mantener el listado sincronizado
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchClockData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [user, fetchClockData]);

  // Escuchar eventos cross-tab (BroadcastChannel)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('medisync_timeclock_sync');
    channel.onmessage = () => {
      fetchClockData(false);
    };
    return () => {
      channel.close();
    };
  }, [fetchClockData]);

  // Cronómetro en tiempo real: cálculo por segundo exacto
  useEffect(() => {
    if (!isClockedIn || !activeEntry?.clockIn) {
      setElapsedSeconds(0);
      return;
    }

    const clockInTime = new Date(activeEntry.clockIn).getTime();
    if (isNaN(clockInTime)) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - clockInTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    // Actualización inmediata para no esperar el primer segundo en 0s estático
    updateTimer();

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn, activeEntry?.clockIn]);

  // Iniciar turno / Fichar entrada
  const clockIn = async (customShiftType?: string, notes?: string) => {
    setClockLoading(true);
    try {
      const targetShiftType =
        customShiftType || (role === 'MEDICO' || role === 'ENFERMERO' ? 'GUARDIA' : 'CONSULTORIO');

      const res = await fetch('/api/timeclock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOCK_IN',
          shiftType: targetShiftType,
          notes: notes?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Actualización inmediata del estado
        setIsClockedIn(true);
        if (data.entry) {
          setActiveEntry(data.entry);
          const initialDiffSec = Math.max(
            0,
            Math.floor((Date.now() - new Date(data.entry.clockIn).getTime()) / 1000)
          );
          setElapsedSeconds(initialDiffSec);
        }
        await fetchClockData(false);
        notifyBroadcast();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al iniciar turno' };
      }
    } catch (e) {
      console.error('Error al fichar entrada:', e);
      return { success: false, error: 'Error de red o servidor' };
    } finally {
      setClockLoading(false);
    }
  };

  // Finalizar turno / Fichar salida
  const clockOut = async (notes?: string) => {
    setClockLoading(true);
    try {
      const res = await fetch('/api/timeclock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOCK_OUT',
          notes: notes?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsClockedIn(false);
        setActiveEntry(null);
        setElapsedSeconds(0);
        await fetchClockData(false);
        notifyBroadcast();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al finalizar turno' };
      }
    } catch (e) {
      console.error('Error al fichar salida:', e);
      return { success: false, error: 'Error de red o servidor' };
    } finally {
      setClockLoading(false);
    }
  };

  const formattedElapsed = useMemo(() => {
    return formatElapsedDuration(elapsedSeconds);
  }, [elapsedSeconds]);

  return (
    <TimeclockContext.Provider
      value={{
        isClockedIn,
        activeEntry,
        recentEntries,
        activeStaff,
        loading,
        clockLoading,
        elapsedSeconds,
        formattedElapsed,
        clockIn,
        clockOut,
        refreshClock: () => fetchClockData(false),
      }}
    >
      {children}
    </TimeclockContext.Provider>
  );
}

export function useTimeclock() {
  return useContext(TimeclockContext);
}
