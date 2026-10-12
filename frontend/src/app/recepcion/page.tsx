'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  CheckCircle,
  Clock,
  Volume2,
  Tv,
  ArrowRight,
  UserCheck,
  AlertCircle,
  FileText,
  Search,
  BellRing,
} from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';

export default function ReceptionPage() {
  const { user, permissions } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCalled, setLastCalled] = useState<{
    patientName: string;
    room: string;
    doctorName: string;
    time: string;
  } | null>(null);
  const [tvMode, setTvMode] = useState(false);

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/appointments?date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();
    const interval = setInterval(fetchTodayAppointments, 15000); // Polling cada 15s para recepción en vivo
    return () => clearInterval(interval);
  }, []);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Re5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // La5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, aptData?: any) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (newStatus === 'EN_CONSULTA' && aptData) {
          playChime();
          setLastCalled({
            patientName: `${aptData.patient.lastName}, ${aptData.patient.firstName}`,
            room: aptData.consultingRoom || 'Consultorio 1',
            doctorName: aptData.doctor.name,
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          });
        }
        await fetchTodayAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtros por grupo de sala de espera
  const waitingPatients = appointments.filter((a) => a.status === 'EN_ESPERA');
  const inConsultationPatients = appointments.filter((a) => a.status === 'EN_CONSULTA');
  const pendingArrival = appointments.filter((a) => a.status === 'RESERVADO' || a.status === 'CONFIRMADO');
  const completedToday = appointments.filter((a) => a.status === 'COMPLETADO');

  // MODO PANTALLA DE SALA DE ESPERA (TV / TÓTEM)
  if (tvMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white p-8 flex flex-col justify-between">
        {/* Cabecera TV */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center font-black text-2xl text-white">
              +
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">MediSync Policonsultorios</h1>
              <p className="text-sm text-sky-400 font-medium">Llamador de Pacientes en Pantalla</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-2xl font-mono font-bold text-slate-300">
              {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => setTvMode(false)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
            >
              Salir de Pantalla Completa
            </button>
          </div>
        </div>

        {/* Zona Central: Último Llamado Destacado */}
        <div className="my-auto">
          {lastCalled ? (
            <div className="bg-gradient-to-r from-sky-900 to-indigo-950 border-2 border-sky-400 rounded-3xl p-10 text-center shadow-2xl animate-fade-in">
              <span className="text-sm font-extrabold uppercase tracking-widest text-sky-300 flex items-center justify-center mb-2">
                <BellRing className="w-5 h-5 mr-2 animate-bounce" />
                PACIENTE LLAMADO A CONSULTORIO
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight my-4">
                {lastCalled.patientName}
              </h2>
              <div className="mt-6 inline-block bg-sky-500 text-white font-black text-3xl px-8 py-3 rounded-2xl shadow-lg">
                PASAR A: {lastCalled.room.toUpperCase()}
              </div>
              <p className="text-xl text-sky-200 mt-4">
                Atiende: <span className="font-bold text-white">{lastCalled.doctorName}</span>
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-800">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-400">Sala de Espera Operativa</h2>
              <p className="text-slate-500 mt-2">Aguarde a que su nombre y consultorio aparezcan en esta pantalla.</p>
            </div>
          )}
        </div>

        {/* Barra Inferior: Pacientes en espera actual */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-sm text-slate-400">
          <div>
            Pacientes en sala de espera: <strong className="text-sky-400">{waitingPatients.length}</strong>
          </div>
          <div>
            Por favor, tenga su DNI y credencial médica a mano.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 text-sky-600 mr-2" />
            Recepción y Sala de Espera
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Recepción en 1-click, llamada a consultorio y proyección en televisores de sala
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTvMode(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <Tv className="w-4 h-4 text-sky-400" />
            <span>Modo Pantalla TV / Tótem</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estado de la Sala */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* En Sala de Espera */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">En Sala de Espera</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-950">{waitingPatients.length}</span>
            <span className="text-xs font-semibold text-amber-800">aguardando llamado</span>
          </div>
        </div>

        {/* En Consulta Actual */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">En Consulta Ahora</span>
            <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-purple-950">{inConsultationPatients.length}</span>
            <span className="text-xs font-semibold text-purple-800">siendo atendidos</span>
          </div>
        </div>

        {/* Pendientes de Arribo */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Pendientes de Llegada</span>
            <div className="p-2 rounded-lg bg-sky-100 text-sky-800">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-sky-950">{pendingArrival.length}</span>
            <span className="text-xs font-semibold text-sky-800">turnos restantes hoy</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: PACIENTES EN SALA DE ESPERA (PRIORIDAD DE LLAMADO) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 animate-ping"></span>
              Pacientes en Sala de Espera (Listos para Llamar)
            </h2>
            <p className="text-xs text-slate-500">Pacientes recepcionados esperando ser llamados a consultorio</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {waitingPatients.length} en espera
          </span>
        </div>

        {waitingPatients.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No hay pacientes aguardando en sala de espera en este momento.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {waitingPatients.map((apt) => (
              <div key={apt.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center justify-center bg-amber-50 rounded-xl px-3 py-1.5 border border-amber-200 text-center min-w-[65px]">
                    <span className="text-xs font-bold text-amber-900 font-mono">
                      {formatTime(apt.dateTime)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">{apt.durationMinutes}m</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">
                        {apt.patient.lastName}, {apt.patient.firstName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        DNI {apt.patient.documentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Destino: <strong className="text-sky-700">{apt.consultingRoom || 'Consultorio'}</strong> • Atiende: <strong className="text-slate-800">{apt.doctor.name}</strong> ({apt.doctor.specialty})
                    </p>
                    {apt.receptionNotes && (
                      <p className="text-[11px] text-amber-700 mt-0.5 italic">
                        {apt.receptionNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    onClick={() => handleStatusChange(apt.id, 'EN_CONSULTA', apt)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Llamar a Consultorio (Timbre TV)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: PENDIENTES DE RECEPCIÓN (1-CLICK CHECK-IN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Turnos Pendientes de Recepción (Check-In)
            </h2>
            <p className="text-xs text-slate-500">
              Valida la llegada del paciente con 1 click para pasarlo a la sala de espera
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {pendingArrival.length} pendientes
          </span>
        </div>

        {pendingArrival.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No hay pacientes pendientes de arribo para el día de hoy.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingArrival.map((apt) => (
              <div key={apt.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 text-center min-w-[65px]">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {formatTime(apt.dateTime)}
                    </span>
                    <span className="text-[10px] text-slate-500">{apt.durationMinutes}m</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">
                        {apt.patient.lastName}, {apt.patient.firstName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        DNI {apt.patient.documentId}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {apt.patient.healthInsurance || 'Particular'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Médico: <strong className="text-sky-700">{apt.doctor.name}</strong> • Motivo: {apt.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    onClick={() => handleStatusChange(apt.id, 'EN_ESPERA')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar Llegada (1-Click)</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(apt.id, 'AUSENTE')}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-2"
                  >
                    Ausente
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: ATENCIONES COMPLETADAS DEL DÍA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Atenciones Finalizadas del Día ({completedToday.length})
        </h2>

        {completedToday.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Aún no se han completado atenciones en el día de la fecha.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedToday.map((apt) => (
              <div
                key={apt.id}
                className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {apt.patient.lastName}, {apt.patient.firstName}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Atendido</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {apt.doctor.name} ({apt.doctor.specialty})
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Horario: {formatTime(apt.dateTime)} hs
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
