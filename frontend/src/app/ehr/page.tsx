'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Search,
  UserPlus,
  ShieldAlert,
  AlertCircle,
  Heart,
  Calendar,
  Activity,
  ArrowRight,
  Phone,
  Plus,
} from 'lucide-react';
import { calculateAge, formatDate } from '@/lib/utils';

export default function EHRListPage() {
  const { user, role, permissions } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({
    documentId: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'M',
    phone: '',
    email: '',
    bloodType: 'A+',
    healthInsurance: '',
    insuranceNumber: '',
    allergies: '',
    chronicConditions: '',
  });

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canViewMedicalRecords) {
      fetchPatients();
    }
  }, [permissions.canViewMedicalRecords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowNewModal(false);
        setFormData({
          documentId: '',
          firstName: '',
          lastName: '',
          birthDate: '',
          gender: 'M',
          phone: '',
          email: '',
          bloodType: 'A+',
          healthInsurance: '',
          insuranceNumber: '',
          allergies: '',
          chronicConditions: '',
        });
        fetchPatients();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al crear paciente');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Verificación estricta de RBAC en interfaz
  if (!permissions.canViewMedicalRecords) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acceso Restringido a Historias Clínicas</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          El rol actual (<span className="font-bold text-rose-600">{role}</span>) no posee autorización
          para acceder al módulo de Historias Clínicas Electrónicas (EHR).
        </p>
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 text-left">
          <strong>Normativa de Protección de Datos de Salud:</strong> El acceso a diagnósticos y evoluciones
          médicas está restringido al personal de salud habilitado (médicos y enfermeros en funciones).
          Los roles administrativos y de farmacia tienen el acceso bloqueado para salvaguardar el secreto médico.
        </div>
        <p className="text-xs text-slate-500 mt-4">
          💡 Puedes cambiar al rol <strong>Médico</strong> o <strong>Director Médico</strong> desde el selector superior para explorar este módulo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileText className="w-6 h-6 text-sky-600 mr-2" />
            Historias Clínicas Electrónicas (EHR)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro unificado de evoluciones, diagnósticos CIE-10, recetas y signos vitales
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-1.5 self-start cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Paciente</span>
        </button>
      </div>

      {/* Buscador de Pacientes */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por DNI, Nombre, Apellido u Obra Social..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchPatients('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-2"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Listado de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Cargando pacientes...
          </div>
        ) : patients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No se encontraron pacientes que coincidan con la búsqueda.
          </div>
        ) : (
          patients.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {p.lastName}, {p.firstName}
                    </h3>
                    <p className="text-xs font-mono text-slate-500">
                      DNI: {p.documentId} • {calculateAge(p.birthDate)} años
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                    {p.bloodType || 'S/D'}
                  </span>
                </div>

                {/* Cobertura / Obra Social */}
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Cobertura:</span>{' '}
                  {p.healthInsurance || 'Particular / Sin Obra Social'}
                  {p.insuranceNumber ? ` (N° ${p.insuranceNumber})` : ''}
                </div>

                {/* Alertas Médicas (Alergias o Crónicas) */}
                <div className="mt-2.5 space-y-1">
                  {p.allergies && (
                    <div className="flex items-center text-[11px] text-rose-700 font-medium">
                      <Heart className="w-3.5 h-3.5 mr-1 text-rose-500 fill-rose-100 shrink-0" />
                      <span className="truncate">Alergias: {p.allergies}</span>
                    </div>
                  )}
                  {p.chronicConditions && (
                    <div className="flex items-center text-[11px] text-amber-700 font-medium">
                      <Activity className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
                      <span className="truncate">Crónico: {p.chronicConditions}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de acceso a la HCE */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {p._count?.appointments || 0} turnos • {p._count?.vitalSigns || 0} triajes
                </span>
                <Link
                  href={`/ehr/${p.id}`}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                >
                  <span>Ver Historia Clínica</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Crear Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 text-sky-600 mr-2" />
              Alta de Paciente en MediSync
            </h2>

            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DNI / Documento *</label>
                  <input
                    type="text"
                    required
                    value={formData.documentId}
                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grupo Sanguíneo</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Obra Social / Prepaga</label>
                  <input
                    type="text"
                    value={formData.healthInsurance}
                    onChange={(e) => setFormData({ ...formData, healthInsurance: e.target.value })}
                    placeholder="OSDE, Swiss Medical, PAMI..."
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° de Afiliado</label>
                  <input
                    type="text"
                    value={formData.insuranceNumber}
                    onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                    placeholder="SM-12345"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alergias Conocidas</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ej: Penicilina, AINEs, Látex..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 text-rose-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Condiciones Crónicas</label>
                <input
                  type="text"
                  value={formData.chronicConditions}
                  onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                  placeholder="Ej: Hipertensión, Diabetes Tipo 2..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Registrar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
