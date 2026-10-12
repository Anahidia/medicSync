'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Mail,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function EquipoPage() {
  const { user, role, permissions } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Formulario de Invitación
  const [inviteForm, setInviteForm] = useState({
    recipientName: '',
    invitedEmail: '',
    role: 'ENFERMERO',
    department: user?.department || 'Enfermería',
    positionTitle: '',
    isDepartmentHead: false,
  });

  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Actualizar departamento por defecto según el usuario logueado
  useEffect(() => {
    if (user?.department) {
      setInviteForm((prev) => ({
        ...prev,
        department: user.department || 'Enfermería',
        role: user.role === 'ENFERMERO' ? 'ENFERMERO' : user.role === 'MEDICO' ? 'MEDICO' : 'RECEPCION',
      }));
    }
  }, [user]);

  const fetchInvitaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/invitations');
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitaciones();
  }, [user]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedInviteUrl(data.inviteUrl);
        await fetchInvitaciones();
      } else {
        alert(data.error || 'Error al generar invitación');
      }
    } catch {
      alert('Error de conexión al emitir invitación');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (urlOrToken: string, token: string) => {
    const fullUrl = urlOrToken.startsWith('http')
      ? urlOrToken
      : `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const isHead = user?.isDepartmentHead || role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 text-sky-600 mr-2" />
            Gestión de Equipo & Invitaciones de Personal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Los jefes de departamento y directores autorizan altas con cargos y roles preasignados
          </p>
        </div>

        {isHead && (
          <button
            onClick={() => {
              setCreatedInviteUrl(null);
              setShowInviteModal(true);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-2 self-start cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Generar Invitación de Empleado</span>
          </button>
        )}
      </div>

      {/* Banner de Jerarquía Actual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-base shrink-0">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">{user?.name}</h2>
              {user?.isDepartmentHead && (
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  ★ Jefe/a de Departamento
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Departamento: <strong className="text-slate-700">{user?.department || 'General'}</strong> • Cargo: <strong className="text-slate-700">{user?.positionTitle || user?.role}</strong>
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-md">
          {role === 'ADMIN' ? (
            <p>
              👑 <strong>Permisos de Director/Admin:</strong> Puedes invitar jefes de área y empleados a cualquier departamento de la clínica.
            </p>
          ) : user?.isDepartmentHead ? (
            <p>
              🩺 <strong>Jefatura de {user.department}:</strong> Como responsable de área, tus invitaciones incorporarán automáticamente a los empleados en el departamento de <strong>{user.department}</strong>.
            </p>
          ) : (
            <p className="text-slate-400">
              Personal de planta. Las invitaciones son administradas por tu jefe/a de departamento o director médico.
            </p>
          )}
        </div>
      </div>

      {/* Listado de Invitaciones Emitidas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Invitaciones Emitidas por Superiores</h2>
            <p className="text-xs text-slate-500">Enlaces seguros generados para activación de empleados</p>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {invitations.length} invitaciones
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Cargando invitaciones...</div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No se han generado invitaciones aún. Haz clic en "Generar Invitación de Empleado" para invitar al primer profesional.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {inv.recipientName || 'Empleado / Profesional'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {inv.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inv.status === 'ACEPTADA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="text-slate-600 mt-1 flex flex-wrap gap-x-4">
                      <span>
                        Departamento: <strong className="text-sky-800">{inv.department}</strong>
                      </span>
                      <span>
                        Cargo Asignado: <strong className="text-slate-800">{inv.positionTitle || 'Personal de Planta'}</strong>
                      </span>
                      {inv.invitedEmail && (
                        <span>
                          Email previsto: <strong className="text-slate-700">{inv.invitedEmail}</strong>
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Emitido por: {inv.createdBy.name} ({inv.createdBy.department}) • Expira: {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {inv.status === 'PENDIENTE' && (
                    <button
                      onClick={() => copyToClipboard(inv.token, inv.token)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
                      title="Copiar enlace directo de invitación"
                    >
                      {copiedToken === inv.token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">¡Enlace Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copiar Link de Invitación</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Crear Invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center">
              <UserPlus className="w-5 h-5 text-sky-600 mr-2" />
              Generar Enlace de Invitación de Empleado
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              El empleado recibirá este enlace y no podrá modificar el rol ni el departamento asignado.
            </p>

            {createdInviteUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>¡Invitación Generada Exitosamente!</span>
                  </div>
                  <p className="text-emerald-950">
                    Comparte este enlace con el empleado por WhatsApp, email o el canal interno:
                  </p>
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-emerald-300 font-mono text-[11px] text-slate-700 break-all">
                    <span>{createdInviteUrl}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => copyToClipboard(createdInviteUrl, 'modal')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copiedToken === 'modal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedToken === 'modal' ? '¡Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setCreatedInviteUrl(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre o Destinatario Tentativo</label>
                  <input
                    type="text"
                    value={inviteForm.recipientName}
                    onChange={(e) => setInviteForm({ ...inviteForm, recipientName: e.target.value })}
                    placeholder="Ej: Lic. Julieta Navarro"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Previsto (Opcional)</label>
                  <input
                    type="email"
                    value={inviteForm.invitedEmail}
                    onChange={(e) => setInviteForm({ ...inviteForm, invitedEmail: e.target.value })}
                    placeholder="julieta@clinica.com"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Departamento Asignado *</label>
                    {role !== 'ADMIN' && user?.department ? (
                      <input
                        type="text"
                        disabled
                        value={user.department}
                        className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-700 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={inviteForm.department}
                        onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                      >
                        <option value="Enfermería">Enfermería</option>
                        <option value="Cardiología">Cardiología</option>
                        <option value="Pediatría">Pediatría</option>
                        <option value="Guardia / Urgencias">Guardia / Urgencias</option>
                        <option value="Recepción y Admisión">Recepción y Admisión</option>
                        <option value="Farmacia y Depósito">Farmacia y Depósito</option>
                        <option value="Dirección Médica">Dirección Médica</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rol en Sistema *</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                    >
                      <option value="ENFERMERO">Enfermero/a (Triaje)</option>
                      <option value="MEDICO">Médico/a (EHR & Recetas)</option>
                      <option value="RECEPCION">Recepción (Turnos)</option>
                      <option value="FARMACIA">Farmacia (Stock)</option>
                      {role === 'ADMIN' && <option value="ADMIN">Administrador</option>}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo / Título Institucional Preasignado *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.positionTitle}
                    onChange={(e) => setInviteForm({ ...inviteForm, positionTitle: e.target.value })}
                    placeholder="Ej: Enfermero/a de Cuidados Intermedios, Cardiólogo/a de Guardia..."
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                {role === 'ADMIN' && (
                  <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inviteForm.isDepartmentHead}
                      onChange={(e) => setInviteForm({ ...inviteForm, isDepartmentHead: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-bold text-slate-700">Designar como Jefe/a de Departamento</span>
                  </label>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {submitting ? 'Generando...' : 'Crear Enlace de Invitación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
