'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimeclock } from '@/context/TimeclockContext';
import {
  Clock,
  ShieldCheck,
  UserCheck,
  Play,
  Square,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { formatDateTime, formatTime, formatDate } from '@/lib/utils';

export default function GuardiasPage() {
  const { user, role } = useAuth();
  const {
    isClockedIn,
    activeEntry,
    recentEntries,
    activeStaff,
    clockLoading,
    formattedElapsed,
    clockIn,
    clockOut,
  } = useTimeclock();
  const [shifts, setShifts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [clockNotes, setClockNotes] = useState('');
  const [shiftType, setShiftType] = useState('GUARDIA');

  // Modal para Programar Guardia
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [formShift, setFormShift] = useState({
    userId: '',
    serviceArea: 'Guardia Médica Adultos',
    startDateTime: '',
    endDateTime: '',
    notes: '',
  });

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/shifts');
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
        setStaff(data.staff || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [user]);

  const handleToggleClock = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (action === 'CLOCK_IN') {
      const res = await clockIn(shiftType, clockNotes);
      if (res.success) {
        setClockNotes('');
      } else if (res.error) {
        alert(res.error);
      }
    } else {
      const res = await clockOut(clockNotes);
      if (res.success) {
        setClockNotes('');
      } else if (res.error) {
        alert(res.error);
      }
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formShift),
      });

      if (res.ok) {
        setShowShiftModal(false);
        setFormShift({
          userId: '',
          serviceArea: 'Guardia Médica Adultos',
          startDateTime: '',
          endDateTime: '',
          notes: '',
        });
        fetchShifts();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al programar guardia');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Clock className="w-6 h-6 text-sky-600 mr-2" />
            Guardias Médicas y Fichaje de Asistencia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Programación de turnos de guardia, cobertura de shockroom y fichaje biométrico/digital
          </p>
        </div>

        <button
          onClick={() => setShowShiftModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-1.5 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Guardia</span>
        </button>
      </div>

      {/* SECCIÓN 1: TERMINAL DE FICHAJE PERSONAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Terminal de Control de Asistencia
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Fichaje Personal — {user?.name}
            </h2>
          </div>

          <div>
            {isClockedIn ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2 animate-ping"></span>
                  Jornada Activa (Fichado)
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold px-2.5 py-1 rounded-full text-xs flex items-center shadow-2xs">
                  ⏱️ {formattedElapsed}
                </span>
              </div>
            ) : (
              <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs">
                Fuera de Turno
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Tarjeta de Acción */}
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Servicio / Destino</label>
                <select
                  disabled={isClockedIn}
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                >
                  <option value="GUARDIA">Guardia de Emergencias (12/24 hs)</option>
                  <option value="CONSULTORIO">Consultorio Externo Programado</option>
                  <option value="ENFERMERIA">Enfermería y Cuidados Centrales</option>
                  <option value="ADMINISTRACION">Admisión y Facturación</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones / Reemplazo</label>
                <input
                  type="text"
                  value={clockNotes}
                  onChange={(e) => setClockNotes(e.target.value)}
                  placeholder="Ej: Cobertura de guardia, box 3..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              {isClockedIn ? (
                <button
                  onClick={() => handleToggleClock('CLOCK_OUT')}
                  disabled={clockLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{clockLoading ? 'Procesando...' : 'Fichar SALIDA de Turno'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleClock('CLOCK_IN')}
                  disabled={clockLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{clockLoading ? 'Procesando...' : 'Fichar ENTRADA al Turno'}</span>
                </button>
              )}

              {activeEntry && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>Ingreso registrado: {formatDateTime(activeEntry.clockIn)}</span>
                  <span className="bg-slate-100 text-emerald-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                    Tiempo en turno: {formattedElapsed}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Presencia Actual en Clínica */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs">
            <span className="font-bold text-slate-800 flex items-center mb-2">
              <Users className="w-4 h-4 text-sky-600 mr-1.5" />
              Personal en Turno ({activeStaff?.length || 0})
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {activeStaff && activeStaff.length > 0 ? (
                activeStaff.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-semibold text-slate-800 block">{s.user.name}</span>
                      <span className="text-[10px] text-slate-500">{s.shiftType}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">
                      {formatTime(s.clockIn)} hs
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-2">Sin personal activo</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CRONOGRAMA DE GUARDIAS PROGRAMADAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Cronograma de Guardias</h2>
            <p className="text-xs text-slate-500">Servicios asistenciales cubiertos por profesionales</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {shifts.length} asignaciones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {shift.user.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {shift.user.specialty || shift.user.role} {shift.user.licenseNumber ? `• ${shift.user.licenseNumber}` : ''}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  shift.status === 'EN_CURSO'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse'
                    : 'bg-sky-50 text-sky-700 border-sky-100'
                }`}>
                  {shift.status}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-sky-800 block text-xs">
                  {shift.serviceArea}
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  <strong>Desde:</strong> {formatDateTime(shift.startDateTime)}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Hasta:</strong> {formatDateTime(shift.endDateTime)}
                </p>
              </div>

              {shift.notes && (
                <p className="text-[11px] text-slate-500 italic">
                  Nota: {shift.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 3: HISTORIAL RECIENTE DE FICHADAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Historial Reciente de Fichadas y Asistencia
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Profesional / Personal</th>
                <th className="py-2.5 px-3">Servicio</th>
                <th className="py-2.5 px-3">Entrada</th>
                <th className="py-2.5 px-3">Salida</th>
                <th className="py-2.5 px-3">Total Horas</th>
                <th className="py-2.5 px-3">Estación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEntries && recentEntries.length > 0 ? (
                recentEntries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {entry.user.name} ({entry.user.role})
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{entry.shiftType}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                      {formatDateTime(entry.clockIn)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {entry.clockOut ? formatDateTime(entry.clockOut) : (
                        <span className="text-emerald-600 font-bold">● En curso</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-800">
                      {entry.durationHours ? `${entry.durationHours} hs` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{entry.deviceOrIp || 'MediSync Web'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay registros de asistencia guardados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Programar Guardia */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 text-sky-600 mr-2" />
              Programar Turno de Guardia
            </h2>

            <form onSubmit={handleCreateShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Profesional de Salud *</label>
                <select
                  required
                  value={formShift.userId}
                  onChange={(e) => setFormShift({ ...formShift, userId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Seleccionar personal --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role} - {s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Servicio / Área Asignada *</label>
                <select
                  value={formShift.serviceArea}
                  onChange={(e) => setFormShift({ ...formShift, serviceArea: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="Guardia Médica Adultos">Guardia Médica Adultos</option>
                  <option value="Guardia Pediátrica">Guardia Pediátrica</option>
                  <option value="Enfermería Central & Shockroom">Enfermería Central & Shockroom</option>
                  <option value="Traumatología de Urgencia">Traumatología de Urgencia</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha y Hora Inicio *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formShift.startDateTime}
                    onChange={(e) => setFormShift({ ...formShift, startDateTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha y Hora Fin *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formShift.endDateTime}
                    onChange={(e) => setFormShift({ ...formShift, endDateTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formShift.notes}
                  onChange={(e) => setFormShift({ ...formShift, notes: e.target.value })}
                  placeholder="Guardia pasiva, responsable de piso..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Guardar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
