'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Activity,
  Calendar,
  FileText,
  Users,
  Clock,
  Package,
  Bot,
  LayoutDashboard,
  Lock,
  HeartPulse,
  Ambulance,
  UserPlus,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, permissions } = useAuth();

  const isHeadOrAdmin = user?.isDepartmentHead || role === 'ADMIN';

  const navItems = [
    {
      name: 'Panel General',
      href: '/',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      name: 'Historias Clínicas (EHR)',
      href: '/ehr',
      icon: FileText,
      allowed: permissions.canViewMedicalRecords,
      badge: !permissions.canViewMedicalRecords ? 'Restringido' : undefined,
    },
    {
      name: 'Gestión de Turnos',
      href: '/turnos',
      icon: Calendar,
      allowed: permissions.canManageAppointments,
      badge: !permissions.canManageAppointments ? 'Restringido' : undefined,
    },
    {
      name: 'Recepción & Sala',
      href: '/recepcion',
      icon: Users,
      allowed: permissions.canReceptionCheckIn,
      badge: !permissions.canReceptionCheckIn ? 'Restringido' : undefined,
    },
    {
      name: 'Guardias & Fichaje',
      href: '/guardias',
      icon: Clock,
      allowed: true,
    },
    {
      name: 'Derivaciones & Interconsultas',
      href: '/derivaciones',
      icon: Ambulance,
      allowed: permissions.canManageReferrals || role === 'MEDICO' || role === 'ADMIN',
      badge: !(permissions.canManageReferrals || role === 'MEDICO' || role === 'ADMIN') ? 'Restringido' : undefined,
    },
    {
      name: 'Equipo & Invitaciones',
      href: '/equipo',
      icon: UserPlus,
      allowed: isHeadOrAdmin,
      badge: !isHeadOrAdmin ? 'Jefaturas' : undefined,
    },
    {
      name: 'Inventario & Farmacia',
      href: '/inventario',
      icon: Package,
      allowed: role === 'ADMIN' || role === 'FARMACIA' || role === 'ENFERMERO',
      badge: !(role === 'ADMIN' || role === 'FARMACIA' || role === 'ENFERMERO') ? 'Restringido' : undefined,
    },
    {
      name: 'Automatización & Bot',
      href: '/automatizacion',
      icon: Bot,
      allowed: true,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-all">
      {/* Logotipo MediSync */}
      <div className="flex h-16 items-center px-5 border-b border-slate-100 bg-sky-900 text-white">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/30 border border-sky-400 flex items-center justify-center text-white shadow-inner">
            <HeartPulse className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center">
              MediSync
              <span className="ml-1.5 text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-sky-500 font-extrabold tracking-widest text-white">
                PRO
              </span>
            </span>
            <p className="text-[10px] text-sky-300 font-medium">Gestión Clínica Integral</p>
          </div>
        </div>
      </div>

      {/* Menú de Navegación */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos Clínicos
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (!item.allowed) {
            return (
              <div
                key={item.name}
                className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 cursor-not-allowed opacity-75"
                title={`Acceso restringido para el rol ${role}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <span className="flex items-center space-x-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{item.badge || 'Bloqueado'}</span>
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-sky-50 text-sky-700 font-bold border-l-4 border-sky-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer de la barra lateral con detalles de la institución */}
      <div className="border-t border-slate-200 p-3 bg-slate-50">
        <div className="rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">
              {user?.clinicName || 'Policonsultorio Central'}
            </span>
            <span className="text-[9px] bg-sky-100 text-sky-700 font-semibold px-1.5 py-0.2 rounded shrink-0">
              Sede 01
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Av. San Martín 1420 • Buenos Aires</p>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Versión 2.5-EHR</span>
            <span className="text-emerald-600 font-medium">● Activo</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
