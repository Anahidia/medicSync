'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Ambulance,
  Hospital,
  Building2,
  Stethoscope,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Printer,
  Search,
  Filter,
  User,
  ArrowRight,
  ShieldAlert,
  Inbox,
  Send,
  UserCheck,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

function DerivacionesContent() {
  const { user, role, permissions } = useAuth();
  const searchParams = useSearchParams();

  const [referrals, setReferrals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [typeFilter, setTypeFilter] = useState<'all' | 'INTERNA' | 'EXTERNA'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Modal para nueva derivación / interconsulta
  const [showModal, setShowModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [selectedReferralToPrint, setSelectedReferralToPrint] = useState<any>(null);

  const [formReferral, setFormReferral] = useState({
    patientId: '',
    type: 'INTERNA', // 'INTERNA' | 'EXTERNA'
    targetDoctorId: '',
    destinationFacility: '',
    destinationDepartment: '',
    specialistName: '',
    reason: '',
    clinicalSummary: '',
    urgency: 'PRIORITARIA',
    transportType: 'CONSULTORIO_INTERNO',
    notes: '',
  });

  // Pre-carga si viene de la Historia Clínica (?patientId=...&new=true)
  useEffect(() => {
    const qPatientId = searchParams.get('patientId');
    const qNew = searchParams.get('new');
    if (qPatientId) {
      setFormReferral((prev) => ({ ...prev, patientId: qPatientId }));
      if (qNew === 'true') {
        setShowModal(true);
      }
    }
  }, [searchParams]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (scopeFilter !== 'all') params.append('scope', scopeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (urgencyFilter !== 'all') params.append('urgency', urgencyFilter);

      const res = await fetch(`/api/referrals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
        if (data.doctors) {
          setDoctors(data.doctors);
        }
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
    fetchReferrals();
  }, [typeFilter, scopeFilter, statusFilter, urgencyFilter]);

  useEffect(() => {
    fetchPatientsList();
  }, []);

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

  const handleSelectTargetDoctor = (docId: string) => {
    const foundDoc = doctors.find((d) => d.id === docId);
    if (foundDoc) {
      setFormReferral((prev) => ({
        ...prev,
        targetDoctorId: docId,
        specialistName: foundDoc.name,
        destinationDepartment: foundDoc.department || foundDoc.specialty || '',
      }));
    } else {
      setFormReferral((prev) => ({
        ...prev,
        targetDoctorId: '',
        specialistName: '',
      }));
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formReferral),
      });

      if (res.ok) {
        setShowModal(false);
        setFormReferral({
          patientId: '',
          type: 'INTERNA',
          targetDoctorId: '',
          destinationFacility: '',
          destinationDepartment: '',
          specialistName: '',
          reason: '',
          clinicalSummary: '',
          urgency: 'PRIORITARIA',
          transportType: 'CONSULTORIO_INTERNO',
          notes: '',
        });
        fetchReferrals();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al emitir derivación médica');
      }
    } catch {
      alert('Error de conexión al guardar derivación');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchReferrals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'URGENTE':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 font-extrabold px-2.5 py-0.5 rounded text-[10px] animate-pulse flex items-center gap-1">
            🚨 URGENTE
          </span>
        );
      case 'PRIORITARIA':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-0.5 rounded text-[10px] flex items-center gap-1">
            ⚡ PRIORITARIA
          </span>
        );
      default:
        return (
          <span className="bg-sky-100 text-sky-800 border border-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] flex items-center gap-1">
            📅 PROGRAMADA
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACEPTADA':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">Aceptada</span>;
      case 'EN_ATENCION':
        return <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">En Consulta</span>;
      case 'EN_TRASLADO':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">En Traslado</span>;
      case 'COMPLETADA':
        return <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">Completada</span>;
      case 'RECHAZADA':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">Rechazada</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">Pendiente</span>;
    }
  };

  const getTransportLabel = (transportType: string) => {
    switch (transportType) {
      case 'CONSULTORIO_INTERNO':
        return 'Consultorio Externo / Ambulatorio';
      case 'INTERCONSULTA_GUARDIA':
        return 'Guardia Médica / Shockroom';
      case 'PASE_SALA':
        return 'Internación / Sala de Piso';
      case 'AMBULANCIA_UTIM':
        return 'Ambulancia UTIM (Terapia Intensiva)';
      case 'AMBULANCIA_COMUN':
        return 'Ambulancia Simple';
      default:
        return 'Por sus propios medios';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Stethoscope className="w-6 h-6 text-sky-600 mr-2" />
            Derivaciones e Interconsultas Médicas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión integral de interconsultas internas entre doctores de la clínica y derivaciones a hospitales externos
          </p>
        </div>

        {permissions.canManageReferrals && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-2 self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Derivación / Interconsulta</span>
          </button>
        )}
      </div>

      {/* Pestañas de Alcance y Tipo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Selector de Tipo (Interna / Externa) */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({referrals.length})
          </button>
          <button
            onClick={() => setTypeFilter('INTERNA')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
              typeFilter === 'INTERNA'
                ? 'bg-sky-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Interconsultas Internas (Clínica)</span>
          </button>
          <button
            onClick={() => setTypeFilter('EXTERNA')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
              typeFilter === 'EXTERNA'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ambulance className="w-3.5 h-3.5" />
            <span>Derivaciones Externas (Hospitales)</span>
          </button>
        </div>

        {/* Filtro de rol / dirección médica: Asignadas a mí vs Emitidas */}
        {user && (
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                scopeFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Todos los casos
            </button>
            <button
              onClick={() => setScopeFilter('received')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer ${
                scopeFilter === 'received' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Inbox className="w-3 h-3" />
              <span>Derivadas a mí</span>
            </button>
            <button
              onClick={() => setScopeFilter('sent')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer ${
                scopeFilter === 'sent' ? 'bg-white text-sky-700 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>Emitidas por mí</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra de Filtros Secundarios */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="ACEPTADA">Aceptadas</option>
              <option value="EN_ATENCION">En Consulta / Atención</option>
              <option value="EN_TRASLADO">En Traslado</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Prioridad:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Todas las prioridades</option>
              <option value="URGENTE">🚨 Urgente</option>
              <option value="PRIORITARIA">⚡ Prioritaria</option>
              <option value="PROGRAMADA">📅 Programada</option>
            </select>
          </div>
        </div>

        <span className="text-slate-500 font-mono text-[11px] font-semibold">
          Mostrando {referrals.length} caso{referrals.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Lista de Derivaciones e Interconsultas */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Cargando derivaciones e interconsultas...
          </div>
        ) : referrals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            No se encontraron casos con los filtros seleccionados.
          </div>
        ) : (
          referrals.map((ref) => {
            const isInternal = ref.type === 'INTERNA';
            const isMyTarget = user?.id === ref.targetDoctorId;

            return (
              <div
                key={ref.id}
                className={`bg-white rounded-2xl border transition p-5 space-y-3.5 text-xs shadow-2xs ${
                  isMyTarget
                    ? 'border-indigo-400 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Cabecera del Caso: Tipo + Paciente + Prioridad + Estado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isInternal
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isInternal ? <Building2 className="w-5 h-5" /> : <Ambulance className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {ref.patient.lastName}, {ref.patient.firstName}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          DNI {ref.patient.documentId}
                        </span>

                        {isInternal ? (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold px-2 py-0.5 rounded text-[10px]">
                            🏢 INTERCONSULTA INTERNA
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-extrabold px-2 py-0.5 rounded text-[10px]">
                            🚑 DERIVACIÓN EXTERNA
                          </span>
                        )}

                        {isMyTarget && (
                          <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-2 py-0.5 rounded text-[10px] animate-pulse">
                            ⭐ Asignada a vos
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cobertura: {ref.patient.healthInsurance || 'Particular'} • Grupo: {ref.patient.bloodType || 'S/D'} • Tel: {ref.patient.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    {getUrgencyBadge(ref.urgency)}
                    {getStatusBadge(ref.status)}
                  </div>
                </div>

                {/* Datos de Origen y Destino */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl border ${
                    isInternal
                      ? 'bg-indigo-50/40 border-indigo-100'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {/* Destino */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {isInternal ? 'Doctor / Especialista Destino (Clínica):' : 'Hospital / Centro de Destino:'}
                    </span>

                    {isInternal ? (
                      <div className="mt-0.5">
                        <span className="font-bold text-indigo-950 text-sm flex items-center">
                          <UserCheck className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
                          {ref.targetDoctor?.name || ref.specialistName || 'Especialista en Guardia'}
                        </span>
                        <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
                          Servicio: <strong>{ref.destinationDepartment}</strong>
                          {ref.targetDoctor?.positionTitle ? ` • ${ref.targetDoctor.positionTitle}` : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-0.5">
                        <span className="font-bold text-sky-950 text-sm flex items-center">
                          <Hospital className="w-4 h-4 text-sky-700 mr-1.5 shrink-0" />
                          {ref.destinationFacility}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Servicio Requerido: <strong>{ref.destinationDepartment}</strong>
                          {ref.specialistName ? ` • Especialista: ${ref.specialistName}` : ''}
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 mt-1">
                      Modalidad / Traslado: <strong className="text-slate-700">{getTransportLabel(ref.transportType)}</strong>
                    </p>
                  </div>

                  {/* Origen */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Médico Solicitante / Origen:
                    </span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {ref.referringDoctor.name}
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Departamento: <strong>{ref.referringDoctor.department || 'Dirección Médica'}</strong>
                      {ref.referringDoctor.licenseNumber ? ` • M.N. ${ref.referringDoctor.licenseNumber}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Emitida: {formatDateTime(ref.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Motivo y Resumen Clínico */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">
                    {isInternal ? 'Motivo de la Interconsulta:' : 'Motivo de la Derivación:'}
                  </span>
                  <p className="text-slate-800 font-medium">{ref.reason}</p>
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                    <strong>Resumen Cuadro Clínico y Estudios:</strong> {ref.clinicalSummary}
                  </div>
                </div>

                {ref.notes && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <strong>Coordinación / Notas Médicas:</strong> {ref.notes}
                  </p>
                )}

                {/* Acciones del Caso */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedReferralToPrint(ref)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer"
                      title="Ver e imprimir volante oficial"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{isInternal ? 'Ficha de Interconsulta' : 'Volante Oficial'}</span>
                    </button>

                    <Link
                      href={`/ehr/${ref.patient.id}`}
                      className="text-sky-600 hover:underline font-semibold flex items-center space-x-1"
                    >
                      <span>Abrir Historia Clínica</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Botones de flujo según estado y tipo */}
                  <div className="flex items-center space-x-2">
                    {ref.status === 'PENDIENTE' && (
                      <button
                        onClick={() => handleUpdateStatus(ref.id, 'ACEPTADA')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
                      >
                        {isInternal ? 'Aceptar Interconsulta' : 'Aceptar Traslado'}
                      </button>
                    )}

                    {isInternal && ref.status === 'ACEPTADA' && (
                      <button
                        onClick={() => handleUpdateStatus(ref.id, 'EN_ATENCION')}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer"
                      >
                        Iniciar Consulta
                      </button>
                    )}

                    {!isInternal && ref.status === 'ACEPTADA' && (
                      <button
                        onClick={() => handleUpdateStatus(ref.id, 'EN_TRASLADO')}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold px-3 py-1.5 rounded-lg border border-purple-200 cursor-pointer"
                      >
                        Marcar en Traslado
                      </button>
                    )}

                    {(ref.status === 'EN_ATENCION' || ref.status === 'EN_TRASLADO' || (isInternal && ref.status === 'ACEPTADA')) && (
                      <button
                        onClick={() => handleUpdateStatus(ref.id, 'COMPLETADA')}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Completar Caso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para Crear Nueva Derivación / Interconsulta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Encabezado del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center">
                  <Stethoscope className="w-5 h-5 text-sky-600 mr-2" />
                  Nueva Derivación / Interconsulta
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Elige si la derivación es a otro doctor de la clínica o a un centro hospitalario externo.
                </p>
              </div>
            </div>

            {/* Selector Central: INTERNA vs EXTERNA */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() =>
                  setFormReferral((prev) => ({
                    ...prev,
                    type: 'INTERNA',
                    transportType: 'CONSULTORIO_INTERNO',
                    destinationFacility: '',
                  }))
                }
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                  formReferral.type === 'INTERNA'
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Interna (Otro Doctor de la Clínica)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormReferral((prev) => ({
                    ...prev,
                    type: 'EXTERNA',
                    transportType: 'POR_SUS_MEDIOS',
                    targetDoctorId: '',
                  }))
                }
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                  formReferral.type === 'EXTERNA'
                    ? 'bg-white text-amber-700 shadow-sm border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ambulance className="w-4 h-4" />
                <span>Externa (Otro Hospital / Sanatorio)</span>
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3.5 text-xs">
              {/* Paciente */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Buscar y Seleccionar Paciente *</label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Filtrar paciente por nombre o DNI..."
                    className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <select
                  required
                  value={formReferral.patientId}
                  onChange={(e) => setFormReferral({ ...formReferral, patientId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Seleccionar paciente --</option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} (DNI: {p.documentId}) - {p.healthInsurance || 'Particular'}
                    </option>
                  ))}
                </select>
              </div>

              {/* CAMPOS ESPECÍFICOS SEGÚN SI ES INTERNA O EXTERNA */}
              {formReferral.type === 'INTERNA' ? (
                <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Interconsulta Médica Interna</span>
                  </div>

                  {/* Selección del Doctor Colega */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Doctor / Colega de la Clínica al que se deriva *
                    </label>
                    <select
                      required
                      value={formReferral.targetDoctorId}
                      onChange={(e) => handleSelectTargetDoctor(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                    >
                      <option value="">-- Seleccionar médico especialista de la clínica --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} • {d.department || d.specialty || 'General'} {d.positionTitle ? `(${d.positionTitle})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Servicio / Departamento Interno</label>
                      <input
                        type="text"
                        value={formReferral.destinationDepartment}
                        onChange={(e) => setFormReferral({ ...formReferral, destinationDepartment: e.target.value })}
                        placeholder="Ej: Cardiología, Pediatría..."
                        className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Modalidad de Atención Interna</label>
                      <select
                        value={formReferral.transportType}
                        onChange={(e) => setFormReferral({ ...formReferral, transportType: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                      >
                        <option value="CONSULTORIO_INTERNO">Consultorio Externo / Ambulatorio</option>
                        <option value="INTERCONSULTA_GUARDIA">Interconsulta en Guardia / Shockroom</option>
                        <option value="PASE_SALA">Pase de Cama / Internación</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <Hospital className="w-4 h-4 text-amber-600" />
                    <span>Derivación a Centro Hospitalario Externo</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hospital / Centro de Destino *</label>
                      <input
                        type="text"
                        required
                        value={formReferral.destinationFacility}
                        onChange={(e) => setFormReferral({ ...formReferral, destinationFacility: e.target.value })}
                        placeholder="Ej: Fundación Favaloro, Hospital Garrahan..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Servicio / Especialidad Requerida *</label>
                      <input
                        type="text"
                        required
                        value={formReferral.destinationDepartment}
                        onChange={(e) => setFormReferral({ ...formReferral, destinationDepartment: e.target.value })}
                        placeholder="Ej: Hemodinamia, UCI Pediátrica..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Especialista Externo (Opcional)</label>
                      <input
                        type="text"
                        value={formReferral.specialistName}
                        onChange={(e) => setFormReferral({ ...formReferral, specialistName: e.target.value })}
                        placeholder="Dr. Apellido..."
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Medio de Traslado Sanitario</label>
                      <select
                        value={formReferral.transportType}
                        onChange={(e) => setFormReferral({ ...formReferral, transportType: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="POR_SUS_MEDIOS">Por sus propios medios (Ambulatorio)</option>
                        <option value="AMBULANCIA_COMUN">Ambulancia Simple de Traslado</option>
                        <option value="AMBULANCIA_UTIM">Ambulancia UTIM (Terapia Intensiva Móvil)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Nivel de Urgencia */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nivel de Prioridad Médica *</label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`border p-2.5 rounded-xl cursor-pointer text-center font-bold flex flex-col items-center transition ${
                      formReferral.urgency === 'PROGRAMADA'
                        ? 'border-sky-500 bg-sky-50 text-sky-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value="PROGRAMADA"
                      checked={formReferral.urgency === 'PROGRAMADA'}
                      onChange={() => setFormReferral({ ...formReferral, urgency: 'PROGRAMADA' })}
                      className="sr-only"
                    />
                    <span>📅 Programada</span>
                    <span className="text-[10px] font-normal text-slate-500">Consulta de rutina</span>
                  </label>

                  <label
                    className={`border p-2.5 rounded-xl cursor-pointer text-center font-bold flex flex-col items-center transition ${
                      formReferral.urgency === 'PRIORITARIA'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value="PRIORITARIA"
                      checked={formReferral.urgency === 'PRIORITARIA'}
                      onChange={() => setFormReferral({ ...formReferral, urgency: 'PRIORITARIA' })}
                      className="sr-only"
                    />
                    <span>⚡ Prioritaria</span>
                    <span className="text-[10px] font-normal text-slate-500">Dentro de 24-48 hs</span>
                  </label>

                  <label
                    className={`border p-2.5 rounded-xl cursor-pointer text-center font-bold flex flex-col items-center transition ${
                      formReferral.urgency === 'URGENTE'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 animate-pulse'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value="URGENTE"
                      checked={formReferral.urgency === 'URGENTE'}
                      onChange={() => setFormReferral({ ...formReferral, urgency: 'URGENTE' })}
                      className="sr-only"
                    />
                    <span>🚨 Urgente</span>
                    <span className="text-[10px] font-normal text-slate-500">Atención inmediata</span>
                  </label>
                </div>
              </div>

              {/* Motivo de derivación */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo Clínico de {formReferral.type === 'INTERNA' ? 'la Interconsulta' : 'la Derivación'} *
                </label>
                <input
                  type="text"
                  required
                  value={formReferral.reason}
                  onChange={(e) => setFormReferral({ ...formReferral, reason: e.target.value })}
                  placeholder={
                    formReferral.type === 'INTERNA'
                      ? 'Ej: Valoración cardiológica prequirúrgica y ajuste de dosis'
                      : 'Ej: Cateterismo cardíaco por síndrome coronario agudo'
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Resumen clínico */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Resumen Clínico, Diagnóstico y Antecedentes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formReferral.clinicalSummary}
                  onChange={(e) => setFormReferral({ ...formReferral, clinicalSummary: e.target.value })}
                  placeholder="Detalla cuadro actual, signos vitales, medicación actual, estudios realizados y objetivo de la consulta..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Coordinación</label>
                <input
                  type="text"
                  value={formReferral.notes}
                  onChange={(e) => setFormReferral({ ...formReferral, notes: e.target.value })}
                  placeholder="Instrucciones al colega, consultorio, piso o código de autorización..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {formReferral.type === 'INTERNA' ? 'Emitir Interconsulta Interna' : 'Emitir Orden de Derivación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Vista de Impresión del Volante Oficial / Ficha */}
      {selectedReferralToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto print:p-0 print:border-none">
            {/* Cabecera del Volante */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {selectedReferralToPrint.type === 'INTERNA'
                    ? 'Ficha Oficial de Interconsulta Médica'
                    : 'Volante Oficial de Derivación Hospitalaria'}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedReferralToPrint.destinationFacility || 'Policonsultorios Central MediSync'} • Red Médica Asistencial
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">
                  ID: {selectedReferralToPrint.id.slice(0, 8)}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {formatDate(selectedReferralToPrint.createdAt)}
                </span>
              </div>
            </div>

            {/* Datos del Paciente */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-4 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Paciente:</span>
                <strong className="text-slate-900 text-sm">
                  {selectedReferralToPrint.patient.lastName}, {selectedReferralToPrint.patient.firstName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">DNI / Documento:</span>
                <strong className="text-slate-900 font-mono">{selectedReferralToPrint.patient.documentId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cobertura Médica:</span>
                <span>{selectedReferralToPrint.patient.healthInsurance || 'Particular'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Grupo Sanguíneo:</span>
                <strong className="text-rose-700">{selectedReferralToPrint.patient.bloodType || 'S/D'}</strong>
              </div>
            </div>

            {/* Datos del Destino */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 text-xs mb-4 space-y-1.5">
              <div className="flex justify-between">
                <div>
                  <span className="text-sky-800 font-bold block text-sm">
                    {selectedReferralToPrint.type === 'INTERNA'
                      ? `Interconsulta para: ${selectedReferralToPrint.targetDoctor?.name || selectedReferralToPrint.specialistName}`
                      : `Centro Receptor: ${selectedReferralToPrint.destinationFacility}`}
                  </span>
                  <p className="text-slate-600">
                    Servicio Requerido: <strong>{selectedReferralToPrint.destinationDepartment}</strong>
                  </p>
                </div>
                <div>{getUrgencyBadge(selectedReferralToPrint.urgency)}</div>
              </div>
              <p className="text-slate-600">
                Modalidad: <strong>{getTransportLabel(selectedReferralToPrint.transportType)}</strong>
              </p>
            </div>

            {/* Cuadro Clínico */}
            <div className="text-xs space-y-2 mb-6">
              <div>
                <strong className="text-slate-900 block">Motivo:</strong>
                <p className="text-slate-700">{selectedReferralToPrint.reason}</p>
              </div>
              <div>
                <strong className="text-slate-900 block">Resumen de Cuadro Clínico:</strong>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedReferralToPrint.clinicalSummary}
                </p>
              </div>
            </div>

            {/* Firma del Médico */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
              <div>
                <p>Médico Solicitante: <strong>{selectedReferralToPrint.referringDoctor.name}</strong></p>
                <p>Especialidad: {selectedReferralToPrint.referringDoctor.specialty || selectedReferralToPrint.referringDoctor.department}</p>
                <p>Matrícula: {selectedReferralToPrint.referringDoctor.licenseNumber || 'S/D'}</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-center w-48 text-[11px]">
                Firma y Sello del Profesional
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ficha</span>
              </button>
              <button
                onClick={() => setSelectedReferralToPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DerivacionesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando módulo de derivaciones...</div>}>
      <DerivacionesContent />
    </Suspense>
  );
}
