'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Activity,
  Heart,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Stethoscope,
  ArrowLeft,
  ShieldAlert,
  User,
  Clock,
  Send,
} from 'lucide-react';
import { calculateAge, formatDate, formatDateTime, formatTime } from '@/lib/utils';

function PatientEHRContent() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const { user, role, permissions } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<'evoluciones' | 'nueva_evolucion' | 'signos_vitales' | 'recetas'>('evoluciones');

  // Formulario de Nueva Evolución
  const [evolutionForm, setEvolutionForm] = useState({
    reason: '',
    anamnesis: '',
    physicalExam: '',
    diagnosis: '',
    diagnosisCode: '',
    treatmentPlan: '',
  });

  // Lista dinámica de recetas dentro de la evolución
  const [prescriptions, setPrescriptions] = useState<Array<{
    medication: string;
    dosage: string;
    quantity: string;
    instructions: string;
  }>>([]);

  // Formulario de Signos Vitales (Triaje)
  const [vitalForm, setVitalForm] = useState({
    systolicPressure: '',
    diastolicPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    glucose: '',
    weight: '',
    height: '',
    nursingNotes: '',
  });

  const [savingEvolution, setSavingEvolution] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ehr/${patientId}`);
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchRecord();
    }
  }, [patientId, role]);

  const handleAddPrescriptionField = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: '', dosage: '', quantity: '', instructions: '' },
    ]);
  };

  const handleRemovePrescriptionField = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const handleSubmitEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.clinicalRecord?.id) return;

    try {
      setSavingEvolution(true);
      const res = await fetch('/api/ehr/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: data.clinicalRecord.id,
          reason: evolutionForm.reason,
          anamnesis: evolutionForm.anamnesis,
          physicalExam: evolutionForm.physicalExam,
          diagnosis: evolutionForm.diagnosis,
          diagnosisCode: evolutionForm.diagnosisCode,
          treatmentPlan: evolutionForm.treatmentPlan,
          prescriptions: prescriptions.filter((p) => p.medication.trim() !== ''),
        }),
      });

      if (res.ok) {
        setEvolutionForm({
          reason: '',
          anamnesis: '',
          physicalExam: '',
          diagnosis: '',
          diagnosisCode: '',
          treatmentPlan: '',
        });
        setPrescriptions([]);
        await fetchRecord();
        setActiveTab('evoluciones');
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar evolución médica');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEvolution(false);
    }
  };

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingVitals(true);
      const res = await fetch('/api/ehr/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          ...vitalForm,
        }),
      });

      if (res.ok) {
        setVitalForm({
          systolicPressure: '',
          diastolicPressure: '',
          heartRate: '',
          temperature: '',
          oxygenSaturation: '',
          glucose: '',
          weight: '',
          height: '',
          nursingNotes: '',
        });
        await fetchRecord();
        alert('Signos vitales registrados con éxito.');
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar signos vitales');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingVitals(false);
    }
  };

  if (accessDenied || !permissions.canViewMedicalRecords) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Acceso Denegado por Secreto Médico</h2>
        <p className="text-xs text-slate-600 mt-2">
          El rol <span className="font-bold text-rose-600">{role}</span> no tiene permisos para inspeccionar la historia clínica confidencial de este paciente.
        </p>
        <div className="mt-4">
          <Link
            href="/ehr"
            className="text-xs font-semibold text-sky-600 hover:underline flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al listado</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-400">Cargando historia clínica...</div>;
  }

  const patient = data?.patient;
  const record = data?.clinicalRecord;
  const entries = record?.entries || [];
  const vitals = patient?.vitalSigns || [];

  // Recolectar todas las recetas del paciente
  const allPrescriptions = entries.flatMap((e: any) =>
    e.prescriptions.map((p: any) => ({
      ...p,
      doctorName: e.doctor.name,
      doctorSpecialty: e.doctor.specialty,
      date: e.createdAt,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Barra Superior con botón Volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/ehr"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de pacientes</span>
        </Link>
        <span className="text-[11px] text-slate-500 font-mono">
          ID Ficha: {record?.id?.slice(0, 8)}...
        </span>
      </div>

      {/* Banner Principal del Paciente (Ficha Médica) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-lg border border-sky-200 shrink-0">
              {patient?.firstName?.[0]}
              {patient?.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900">
                  {patient?.lastName}, {patient?.firstName}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                  {patient?.bloodType || 'Grupo S/D'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>DNI: <strong className="text-slate-700">{patient?.documentId}</strong></span>
                <span>Edad: <strong className="text-slate-700">{calculateAge(patient?.birthDate)} años</strong></span>
                <span>Nacimiento: <strong className="text-slate-700">{formatDate(patient?.birthDate)}</strong></span>
                <span>Teléfono: <strong className="text-slate-700">{patient?.phone}</strong></span>
              </p>
              <div className="text-xs text-slate-600 mt-1.5">
                Cobertura: <strong className="text-slate-800">{patient?.healthInsurance || 'Particular'}</strong>
                {patient?.insuranceNumber ? ` • Credencial: ${patient.insuranceNumber}` : ''}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {patient?.emergencyContact && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs max-w-sm">
                <span className="font-bold text-slate-700 block">Contacto de Emergencia:</span>
                <p className="text-slate-600 mt-0.5">{patient.emergencyContact}</p>
              </div>
            )}
            <Link
              href={`/derivaciones?patientId=${patient?.id}&new=true`}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition self-start cursor-pointer"
            >
              <span>🔄 Interconsulta / Derivación</span>
            </Link>
          </div>
        </div>

        {/* Alertas Médicas Destacadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start space-x-2">
            <Heart className="w-4 h-4 text-rose-600 fill-rose-100 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-rose-900">Alergias Registradas:</span>
              <p className="text-rose-800 mt-0.5">
                {record?.allergiesSummary || patient?.allergies || 'Sin alergias conocidas informadas.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start space-x-2">
            <Activity className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-900">Condiciones Crónicas / Antecedentes:</span>
              <p className="text-amber-800 mt-0.5">
                {record?.chronicSummary || patient?.chronicConditions || 'Sin antecedentes crónicos registrados.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del EHR */}
      <div className="flex border-b border-slate-200 space-x-1">
        <button
          onClick={() => setActiveTab('evoluciones')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'evoluciones'
              ? 'bg-white text-sky-700 border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Evoluciones Clínicas ({entries.length})</span>
        </button>

        {permissions.canEditClinicalEvolution ? (
          <button
            onClick={() => setActiveTab('nueva_evolucion')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'nueva_evolucion'
                ? 'bg-white text-sky-700 border-t-2 border-x border-slate-200 -mb-px'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>+ Nueva Consulta Médica</span>
          </button>
        ) : (
          <div
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 flex items-center space-x-1 cursor-not-allowed opacity-60"
            title="Solo médicos pueden firmar evoluciones"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Nueva Consulta (Solo Médicos)</span>
          </div>
        )}

        <button
          onClick={() => setActiveTab('signos_vitales')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'signos_vitales'
              ? 'bg-white text-sky-700 border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Signos Vitales & Triaje ({vitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recetas')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'recetas'
              ? 'bg-white text-sky-700 border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Recetas Emitidas ({allPrescriptions.length})</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* 1. Listado de Evoluciones */}
      {activeTab === 'evoluciones' && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              No hay evoluciones médicas registradas para este paciente aún.
            </div>
          ) : (
            entries.map((entry: any) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4"
              >
                {/* Encabezado de la evolución: Médico actuante y fecha */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-xs">
                      Dr
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{entry.doctor.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {entry.doctor.specialty} • {entry.doctor.licenseNumber || 'Médico Clínico'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-600 block">
                      {formatDateTime(entry.createdAt)}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">
                      ✓ Firma Digital Válida
                    </span>
                  </div>
                </div>

                {/* Motivo de Consulta y Anamnesis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Motivo de Consulta:</span>
                    <p className="text-slate-800 font-medium">{entry.reason}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Anamnesis / Enfermedad Actual:</span>
                    <p className="text-slate-700 leading-relaxed">{entry.anamnesis}</p>
                  </div>
                </div>

                {/* Examen Físico */}
                {entry.physicalExam && (
                  <div className="text-xs bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Examen Físico:</span>
                    <p className="text-slate-700 leading-relaxed">{entry.physicalExam}</p>
                  </div>
                )}

                {/* Diagnóstico CIE-10 y Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sky-900">Diagnóstico Médico:</span>
                      {entry.diagnosisCode && (
                        <span className="text-[10px] bg-sky-200 text-sky-900 font-mono font-bold px-2 py-0.5 rounded">
                          CIE-10: {entry.diagnosisCode}
                        </span>
                      )}
                    </div>
                    <p className="text-sky-950 font-bold">{entry.diagnosis}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Plan Terapéutico e Indicaciones:</span>
                    <p className="text-slate-700 leading-relaxed">{entry.treatmentPlan}</p>
                  </div>
                </div>

                {/* Recetas asociadas a esta consulta */}
                {entry.prescriptions && entry.prescriptions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center mb-2">
                      <Pill className="w-3.5 h-3.5 text-sky-600 mr-1.5" />
                      Receta Médica Electrónica Emitida:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {entry.prescriptions.map((rx: any) => (
                        <div
                          key={rx.id}
                          className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs"
                        >
                          <p className="font-bold text-emerald-900">{rx.medication}</p>
                          <p className="text-[11px] text-emerald-800">Dosis: {rx.dosage}</p>
                          {rx.quantity && <p className="text-[10px] text-emerald-700">Cant: {rx.quantity}</p>}
                          {rx.instructions && (
                            <p className="text-[10px] text-slate-600 italic mt-0.5">{rx.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Formulario de Nueva Consulta Médica */}
      {activeTab === 'nueva_evolucion' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Stethoscope className="w-5 h-5 text-sky-600 mr-2" />
              Registro de Consulta Médica y Receta Electrónica
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Firma y guarda la evolución clínica directamente en la Historia Clínica del paciente.
            </p>
          </div>

          <form onSubmit={handleSubmitEvolution} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Motivo de Consulta *</label>
              <input
                type="text"
                required
                value={evolutionForm.reason}
                onChange={(e) => setEvolutionForm({ ...evolutionForm, reason: e.target.value })}
                placeholder="Ej: Control de hipertensión, dolor torácico, cefalea..."
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Anamnesis / Enfermedad Actual *</label>
              <textarea
                required
                rows={3}
                value={evolutionForm.anamnesis}
                onChange={(e) => setEvolutionForm({ ...evolutionForm, anamnesis: e.target.value })}
                placeholder="Evolución del cuadro, sintomatología, factores desencadenantes..."
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Examen Físico</label>
              <textarea
                rows={2}
                value={evolutionForm.physicalExam}
                onChange={(e) => setEvolutionForm({ ...evolutionForm, physicalExam: e.target.value })}
                placeholder="Auscultación, palpación, pulsos periféricos, estado general..."
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Diagnóstico Clínico *</label>
                <input
                  type="text"
                  required
                  value={evolutionForm.diagnosis}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, diagnosis: e.target.value })}
                  placeholder="Ej: Hipertensión arterial esencial estadio 1"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código CIE-10 (Opcional)</label>
                <input
                  type="text"
                  value={evolutionForm.diagnosisCode}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, diagnosisCode: e.target.value })}
                  placeholder="Ej: I10, J45, E11"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Plan Terapéutico e Indicaciones *</label>
              <textarea
                required
                rows={3}
                value={evolutionForm.treatmentPlan}
                onChange={(e) => setEvolutionForm({ ...evolutionForm, treatmentPlan: e.target.value })}
                placeholder="Estudios solicitados, pautas de alarma, controles posteriores..."
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* SECCIÓN DE RECETAS ELECTRÓNICAS */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 flex items-center">
                  <Pill className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Prescripción de Medicamentos (Receta Electrónica)
                </span>
                <button
                  type="button"
                  onClick={handleAddPrescriptionField}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Medicamento</span>
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <p className="text-slate-400 italic py-2">
                  No se prescribieron medicamentos en esta consulta. Haz clic en "Agregar Medicamento" si deseas recetar.
                </p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                    >
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Fármaco (ej: Enalapril 10mg)"
                          value={rx.medication}
                          onChange={(e) => handlePrescriptionChange(idx, 'medication', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-medium"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Posología (ej: 1 comp. c/ 12 hs)"
                          value={rx.dosage}
                          onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="Cant. (ej: 30 comp.)"
                          value={rx.quantity}
                          onChange={(e) => handlePrescriptionChange(idx, 'quantity', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div className="md:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePrescriptionField(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Eliminar medicamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={savingEvolution}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{savingEvolution ? 'Firmando y Guardando...' : 'Firmar y Guardar Consulta'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Signos Vitales & Triaje */}
      {activeTab === 'signos_vitales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Triaje */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center">
              <Activity className="w-4 h-4 text-emerald-600 mr-2" />
              Registrar Signos Vitales
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Módulo habilitado para Enfermería y Médicos de guardia.
            </p>

            <form onSubmit={handleSubmitVitals} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Presión Sistólica (mmHg)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={vitalForm.systolicPressure}
                    onChange={(e) => setVitalForm({ ...vitalForm, systolicPressure: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Presión Diastólica (mmHg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitalForm.diastolicPressure}
                    onChange={(e) => setVitalForm({ ...vitalForm, diastolicPressure: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frecuencia Cardíaca (lpm)</label>
                  <input
                    type="number"
                    placeholder="75"
                    value={vitalForm.heartRate}
                    onChange={(e) => setVitalForm({ ...vitalForm, heartRate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={vitalForm.temperature}
                    onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sat. O2 (% SpO2)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={vitalForm.oxygenSaturation}
                    onChange={(e) => setVitalForm({ ...vitalForm, oxygenSaturation: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Glucemia (mg/dL)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={vitalForm.glucose}
                    onChange={(e) => setVitalForm({ ...vitalForm, glucose: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={vitalForm.weight}
                    onChange={(e) => setVitalForm({ ...vitalForm, weight: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Talla (cm)</label>
                  <input
                    type="number"
                    placeholder="170"
                    value={vitalForm.height}
                    onChange={(e) => setVitalForm({ ...vitalForm, height: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas de Enfermería / Triaje</label>
                <textarea
                  rows={2}
                  value={vitalForm.nursingNotes}
                  onChange={(e) => setVitalForm({ ...vitalForm, nursingNotes: e.target.value })}
                  placeholder="Observaciones de enfermería..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                disabled={savingVitals}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
              >
                {savingVitals ? 'Guardando...' : 'Guardar Signos Vitales'}
              </button>
            </form>
          </div>

          {/* Historial de Signos Vitales */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Historial de Mediciones</h3>
            {vitals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No hay signos vitales registrados para este paciente.
              </p>
            ) : (
              vitals.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-semibold text-slate-700">
                      Registrado por: <strong>{v.recordedBy.name}</strong> ({v.recordedBy.role})
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {formatDateTime(v.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">P. Arterial</span>
                      <strong className="text-slate-800">
                        {v.systolicPressure && v.diastolicPressure
                          ? `${v.systolicPressure}/${v.diastolicPressure}`
                          : '-'}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">FC (lpm)</span>
                      <strong className="text-slate-800">{v.heartRate || '-'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Temp.</span>
                      <strong className="text-slate-800">{v.temperature ? `${v.temperature}°C` : '-'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Sat. O2</span>
                      <strong className="text-slate-800">{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '-'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Glucemia</span>
                      <strong className="text-slate-800">{v.glucose ? `${v.glucose} mg/dL` : '-'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Peso</span>
                      <strong className="text-slate-800">{v.weight ? `${v.weight} kg` : '-'}</strong>
                    </div>
                  </div>

                  {v.nursingNotes && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                      <strong>Nota enfermería:</strong> {v.nursingNotes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Recetas Emitidas */}
      {activeTab === 'recetas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historial de Recetas Digitales</h3>
              <p className="text-xs text-slate-500">Recetas prescritas con firma digital del profesional</p>
            </div>
          </div>

          {allPrescriptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No hay recetas registradas para este paciente.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPrescriptions.map((rx: any) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-sm">{rx.medication}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {rx.status}
                    </span>
                  </div>

                  <p className="text-slate-700"><strong>Posología:</strong> {rx.dosage}</p>
                  {rx.quantity && <p className="text-slate-700"><strong>Cantidad:</strong> {rx.quantity}</p>}
                  {rx.instructions && <p className="text-slate-600 italic"><strong>Indicaciones:</strong> {rx.instructions}</p>}

                  <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Dr/a. {rx.doctorName} ({rx.doctorSpecialty})</span>
                    <span>{formatDate(rx.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientEHRPage() {
  return (
    <React.Suspense fallback={<div className="py-16 text-center text-xs text-slate-400">Cargando historia clínica...</div>}>
      <PatientEHRContent />
    </React.Suspense>
  );
}
