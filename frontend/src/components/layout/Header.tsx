'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTimeclock } from '@/context/TimeclockContext';
import { UserRole } from '@/types/auth';
import { Clock, ShieldCheck, UserCheck, Play, Square, AlertCircle, LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user, role, switchRole, logout, permissions } = useAuth();
  const {
    isClockedIn,
    formattedElapsed,
    clockLoading,
    clockIn,
    clockOut,
  } = useTimeclock();
  const [time, setTime] = useState<string>('');

  // Reloj en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleClock = async () => {
    if (isClockedIn) {
      await clockOut();
    } else {
      const shiftType = role === 'MEDICO' || role === 'ENFERMERO' ? 'GUARDIA' : 'CONSULTORIO';
      await clockIn(shiftType);
    }
  };

  const roleColors: Record<UserRole, { badge: string; text: string }> = {
    ADMIN: { badge: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Director Médico' },
    MEDICO: { badge: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Médico' },
    ENFERMERO: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'Enfermero' },
    RECEPCION: { badge: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Recepción' },
    FARMACIA: { badge: 'bg-rose-100 text-rose-800 border-rose-200', text: 'Farmacia & Stock' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 shadow-xs">
      {/* Información izquierda: Hora actual y estado operativo */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-slate-100 py-1 px-3 rounded-full border border-slate-200">
          <Clock className="w-4 h-4 text-sky-600" />
          <span className="font-mono text-xs md:text-sm font-semibold text-slate-800">{time || '00:00:00'}</span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Sistema Online</span>
        </div>
      </div>

      {/* Controles centrales y derechos: Fichaje, Selector de rol y Usuario */}
      <div className="flex items-center space-x-3">
        {/* Fichaje de Personal (Clock-in / Clock-out) */}
        <div className="flex items-center">
          {isClockedIn ? (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-300 rounded-lg p-1 px-2.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-ping"></span>
                  En Turno
                </span>
                <span className="text-xs font-semibold text-emerald-900 font-mono">
                  {formattedElapsed}
                </span>
              </div>
              <button
                onClick={handleToggleClock}
                disabled={clockLoading}
                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition shadow-xs cursor-pointer disabled:opacity-50"
                title="Registrar salida de turno"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden md:inline">{clockLoading ? 'Procesando...' : 'Fichar Salida'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleToggleClock}
              disabled={clockLoading}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Registrar ingreso de guardia o consultorio"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{clockLoading ? 'Procesando...' : 'Fichar Entrada'}</span>
            </button>
          )}
        </div>

        {/* Selector Rápido de Rol para Demostración y Pruebas RBAC */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <ShieldCheck className="w-4 h-4 text-slate-500 ml-1.5 hidden md:block" />
          <span className="text-xs text-slate-500 font-medium hidden lg:inline">Rol Activo:</span>
          <select
            value={role || 'ADMIN'}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-md py-1 px-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ADMIN">Director Médico (Admin)</option>
            <option value="MEDICO">Médico (Cardiología)</option>
            <option value="ENFERMERO">Enfermero (Triaje)</option>
            <option value="RECEPCION">Recepción (Admisión)</option>
            <option value="FARMACIA">Farmacia & Stock</option>
          </select>
        </div>

        {/* Perfil del usuario */}
        {user && (
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                {user.isDepartmentHead && (
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-extrabold px-1 rounded">
                    Jefe
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                {user.positionTitle || user.specialty || user.role} {user.department ? `• ${user.department}` : ''}
              </span>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              title="Cerrar Sesión"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
