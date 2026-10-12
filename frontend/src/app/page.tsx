'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Calendar,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Activity,
  CheckCircle2,
  FileText,
  Bot,
} from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';

export default function Dashboard() {
  const { user, role, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    waitingPatients: 0,
    activeStaffCount: 0,
    criticalStockCount: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [activeStaff, setActiveStaff] = useState<any[]>([]);
  const [criticalItems, setCriticalItems] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Obtener turnos de hoy
      const resApt = await fetch(`/api/appointments?date=${todayStr}`);
      const dataApt = await resApt.json();
      const aptList = dataApt.appointments || [];
      setTodayAppointments(aptList);

      const waiting = aptList.filter((a: any) => a.status === 'EN_ESPERA').length;

      // 2. Obtener estado de fichaje y personal activo
      const resClock = await fetch('/api/timeclock');
      const dataClock = await resClock.json();
      const staffList = dataClock.activeStaff || [];
      setActiveStaff(staffList);

      // 3. Obtener alertas de inventario
      const resInv = await fetch('/api/inventory?alertOnly=true');
      const dataInv = await resInv.json();
      const invList = dataInv.items || [];
      setCriticalItems(invList);

      setStats({
        appointmentsToday: aptList.length,
        waitingPatients: waiting,
        activeStaffCount: staffList.length,
        criticalStockCount: invList.length,
      });
    } catch (e) {
      console.error('Error dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ESPERA':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded text-xs animate-pulse">En Sala de Espera</span>;
      case 'EN_CONSULTA':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 font-semibold px-2 py-0.5 rounded text-xs">En Consulta</span>;
      case 'COMPLETADO':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded text-xs">Completado</span>;
      case 'CONFIRMADO':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold px-2 py-0.5 rounded text-xs">Confirmado</span>;
      case 'CANCELADO':
        return <span className="bg-red-100 text-red-800 border border-red-300 font-semibold px-2 py-0.5 rounded text-xs">Cancelado</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">Reservado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Saludo y bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-800 to-sky-950 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-sky-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-sky-300" />
            <span>Centro Clínico Operativo</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bienvenido/a, {user?.name || 'Profesional'}
          </h1>
          <p className="text-sm text-sky-200 mt-1">
            Rol actual: <span className="font-semibold text-white">{user?.role}</span>
            {user?.specialty ? ` — Especialidad: ${user.specialty}` : ''}
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap gap-2">
          {permissions.canManageAppointments && (
            <Link
              href="/turnos"
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition shadow-xs flex items-center space-x-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Nuevo Turno</span>
            </Link>
          )}

          {permissions.canViewMedicalRecords && (
            <Link
              href="/ehr"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition shadow-xs flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Historias Clínicas</span>
            </Link>
          )}

          <Link
            href="/automatizacion"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition shadow-xs flex items-center space-x-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Simulador Bot n8n</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pacientes en Espera */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Sala de Espera</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.waitingPatients}</span>
            <span className="text-xs text-amber-700 font-semibold">aguardando atención</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link href="/recepcion" className="text-xs text-sky-600 font-semibold hover:underline flex items-center">
              <span>Ir al llamador de sala</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Turnos de Hoy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Turnos de Hoy</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.appointmentsToday}</span>
            <span className="text-xs text-slate-500">agendados para la fecha</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link href="/turnos" className="text-xs text-sky-600 font-semibold hover:underline flex items-center">
              <span>Ver agenda interactiva</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Personal de Guardia / En Turno */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal en Turno</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.activeStaffCount}</span>
            <span className="text-xs text-emerald-700 font-semibold">con fichada activa</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link href="/guardias" className="text-xs text-sky-600 font-semibold hover:underline flex items-center">
              <span>Ver guardias y fichajes</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Alertas de Insumos Críticos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alertas Insumos</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600">{stats.criticalStockCount}</span>
            <span className="text-xs text-slate-500">requieren reposición</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link href="/inventario" className="text-xs text-rose-600 font-semibold hover:underline flex items-center">
              <span>Ver farmacia y stock</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grilla Central: Turnos de Hoy y Estado de la Clínica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda / Central: Agenda de Pacientes de Hoy */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Agenda de Turnos del Día</h2>
              <p className="text-xs text-slate-500">Pacientes programados, en atención y completados</p>
            </div>
            <Link
              href="/turnos"
              className="text-xs text-sky-600 font-semibold hover:underline flex items-center"
            >
              <span>Ver todo</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {todayAppointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay turnos registrados para hoy.
              </div>
            ) : (
              todayAppointments.map((apt) => (
                <div key={apt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2.5 py-1 min-w-[58px]">
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {formatTime(apt.dateTime)}
                      </span>
                      <span className="text-[10px] text-slate-500">{apt.durationMinutes}m</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {apt.patient.lastName}, {apt.patient.firstName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          DNI {apt.patient.documentId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        <span className="font-medium text-sky-700">{apt.doctor.name}</span> ({apt.doctor.specialty}) • {apt.consultingRoom || 'Consultorio'}
                      </div>
                      {apt.receptionNotes && (
                        <p className="text-[10px] text-amber-700 mt-0.5 italic">
                          Nota: {apt.receptionNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(apt.status)}

                    {permissions.canViewMedicalRecords && (
                      <Link
                        href={`/ehr/${apt.patient.id}`}
                        className="p-1 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded"
                        title="Ver Historia Clínica"
                      >
                        <FileText className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna Derecha: Personal en Turno y Alertas de Farmacia */}
        <div className="space-y-6">
          {/* Personal Fichado en Turno Activo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <Clock className="w-4 h-4 text-emerald-600 mr-2" />
                <span>Personal en Turno Activo</span>
              </h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                {activeStaff.length} activos
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {activeStaff.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No hay personal con fichada abierta actualmente.
                </p>
              ) : (
                activeStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{staff.user.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {staff.user.specialty || staff.user.role} • {staff.shiftType}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                        Desde {formatTime(staff.clockIn)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alertas Críticas de Insumos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 text-rose-600 mr-2" />
                <span>Alertas de Reposición</span>
              </h2>
              <Link href="/inventario" className="text-xs text-rose-600 font-semibold hover:underline">
                Gestionar
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {criticalItems.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium py-3 text-center">
                  ✓ Todos los insumos cuentan con stock adecuado.
                </p>
              ) : (
                criticalItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-rose-700">
                        Código: {item.code} • Mínimo: {item.minStockAlert} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-rose-700 font-mono">
                        {item.currentStock} {item.unit}
                      </span>
                      <p className="text-[9px] uppercase font-bold text-rose-600">Crítico</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
