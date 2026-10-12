'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Search,
} from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';

export default function AppointmentsPage() {
  const { user, role, permissions } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal para Nuevo Turno
  const [showModal, setShowModal] = useState(false);
  const [formAppointment, setFormAppointment] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    durationMinutes: '20',
    reason: '',
    consultingRoom: 'Consultorio 1',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedDoctor && selectedDoctor !== 'all') params.append('doctorId', selectedDoctor);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
        setDoctors(data.doctors || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsList = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        setFilteredPatients(data.patients || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatientsList();
  }, [selectedDate, selectedDoctor, selectedStatus]);

  useEffect(() => {
    if (patientSearch.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const q = patientSearch.toLowerCase();
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.documentId.includes(q)
        )
      );
    }
  }, [patientSearch, patients]);

  const handleDateChange = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = `${formAppointment.date}T${formAppointment.time}:00`;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formAppointment.patientId,
          doctorId: formAppointment.doctorId,
          dateTime,
          durationMinutes: formAppointment.durationMinutes,
          reason: formAppointment.reason,
          consultingRoom: formAppointment.consultingRoom,
          bookedVia: 'RECEPCION',
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormAppointment({
          patientId: '',
          doctorId: '',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          durationMinutes: '20',
          reason: '',
          consultingRoom: 'Consultorio 1',
        });
        fetchAppointments();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al agendar turno');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ESPERA':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded text-[11px] animate-pulse">
            En Espera
          </span>
        );
      case 'EN_CONSULTA':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-300 font-semibold px-2 py-0.5 rounded text-[11px]">
            En Consulta
          </span>
        );
      case 'COMPLETADO':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded text-[11px]">
            Completado
          </span>
        );
      case 'CONFIRMADO':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold px-2 py-0.5 rounded text-[11px]">
            Confirmado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 font-semibold px-2 py-0.5 rounded text-[11px]">
            Cancelado
          </span>
        );
      case 'AUSENTE':
        return (
          <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
            Ausente
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
            Reservado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <CalendarIcon className="w-6 h-6 text-sky-600 mr-2" />
            Gestión y Agenda de Turnos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Programación de citas médicas, control de consultorios y estados de atención
          </p>
        </div>

        {permissions.canManageAppointments && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-1.5 self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Turno</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros y Navegación de Fecha */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Navegación de Fecha */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            title="Día anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
          />

          <button
            onClick={() => handleDateChange(1)}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            title="Día siguiente"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg hover:bg-sky-100 cursor-pointer"
          >
            Hoy
          </button>
        </div>

        {/* Filtros por Profesional y Estado */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Médico:</span>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Todos los profesionales</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="RESERVADO">Reservado</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EN_ESPERA">En Espera</option>
              <option value="EN_CONSULTA">En Consulta</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grilla / Lista de Turnos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Agenda del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {appointments.length} turnos agendados
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Cargando turnos...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No hay turnos registrados para los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Horario y Paciente */}
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center justify-center bg-slate-100 rounded-xl px-3 py-1.5 min-w-[65px] border border-slate-200 text-center">
                    <span className="text-sm font-black text-slate-800 font-mono">
                      {formatTime(apt.dateTime)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{apt.durationMinutes} min</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">
                        {apt.patient.lastName}, {apt.patient.firstName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        DNI {apt.patient.documentId}
                      </span>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4">
                      <span>
                        Médico: <strong className="text-sky-700">{apt.doctor.name}</strong> ({apt.doctor.specialty})
                      </span>
                      <span>
                        Consultorio: <strong className="text-slate-700">{apt.consultingRoom || 'Asignado'}</strong>
                      </span>
                      <span>
                        Obra Social: <strong className="text-slate-700">{apt.patient.healthInsurance || 'Particular'}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      <strong>Motivo:</strong> {apt.reason}
                    </p>

                    {apt.receptionNotes && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block border border-amber-200">
                        Nota recepción: {apt.receptionNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones de cambio de estado */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {apt.status === 'RESERVADO' || apt.status === 'CONFIRMADO' ? (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'EN_ESPERA')}
                      className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-lg border border-amber-200 transition cursor-pointer"
                      title="Recepcionar al paciente en sala"
                    >
                      Recepcionar (En Espera)
                    </button>
                  ) : null}

                  {apt.status === 'EN_ESPERA' ? (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'EN_CONSULTA')}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold px-3 py-1.5 rounded-lg border border-purple-200 transition cursor-pointer"
                    >
                      Llamar a Consulta
                    </button>
                  ) : null}

                  {apt.status === 'EN_CONSULTA' ? (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'COMPLETADO')}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                    >
                      Finalizar Atención
                    </button>
                  ) : null}

                  {apt.status !== 'CANCELADO' && apt.status !== 'COMPLETADO' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'CANCELADO')}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1.5 rounded transition cursor-pointer"
                      title="Cancelar turno"
                    >
                      Cancelar
                    </button>
                  )}

                  {permissions.canViewMedicalRecords && (
                    <Link
                      href={`/ehr/${apt.patient.id}`}
                      className="text-xs text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-2 rounded transition"
                      title="Abrir Historia Clínica"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Agendar Nuevo Turno */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 text-sky-600 mr-2" />
              Agendar Nuevo Turno Médico
            </h2>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              {/* Buscador de Paciente */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Buscar y Seleccionar Paciente *</label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Filtrar por nombre o DNI..."
                    className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <select
                  required
                  value={formAppointment.patientId}
                  onChange={(e) => setFormAppointment({ ...formAppointment, patientId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Seleccione un paciente --</option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} (DNI: {p.documentId}) - {p.healthInsurance || 'Particular'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Médico / Especialidad */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Profesional Médico *</label>
                <select
                  required
                  value={formAppointment.doctorId}
                  onChange={(e) => setFormAppointment({ ...formAppointment, doctorId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Seleccione un profesional --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={formAppointment.date}
                    onChange={(e) => setFormAppointment({ ...formAppointment, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={formAppointment.time}
                    onChange={(e) => setFormAppointment({ ...formAppointment, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Duración y Consultorio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duración (min)</label>
                  <select
                    value={formAppointment.durationMinutes}
                    onChange={(e) => setFormAppointment({ ...formAppointment, durationMinutes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultorio Asignado</label>
                  <input
                    type="text"
                    value={formAppointment.consultingRoom}
                    onChange={(e) => setFormAppointment({ ...formAppointment, consultingRoom: e.target.value })}
                    placeholder="Consultorio 1, Box 2..."
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo de Consulta *</label>
                <input
                  type="text"
                  required
                  value={formAppointment.reason}
                  onChange={(e) => setFormAppointment({ ...formAppointment, reason: e.target.value })}
                  placeholder="Control clínico, primera vez, estudios..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirmar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
