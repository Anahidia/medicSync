'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Activity, Building2, CheckCircle2 } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { refreshUser } = useAuth();

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Validación de invitación
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Formulario correspondiente a la maqueta
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    role: 'MEDICO',
    licenseNumber: '',
    email: '',
    password: '',
  });

  // Opción para registrar nueva clínica
  const [registerNewClinic, setRegisterNewClinic] = useState(false);
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    if (!inviteToken) return;

    const validate = async () => {
      try {
        setValidatingInvite(true);
        const res = await fetch(`/api/auth/invitations/validate/${inviteToken}`);
        const data = await res.json();

        if (res.ok && data.valid && data.invitation) {
          setInviteData(data.invitation);
          setForm((prev) => ({
            ...prev,
            role: data.invitation.role || 'MEDICO',
            email: data.invitation.invitedEmail || '',
            firstName: data.invitation.recipientName ? data.invitation.recipientName.split(' ')[0] : '',
            lastName: data.invitation.recipientName ? data.invitation.recipientName.split(' ').slice(1).join(' ') : '',
          }));
        } else {
          setInviteError(data.error || 'El link de invitación no es válido o ha expirado.');
        }
      } catch {
        setInviteError('No se pudo validar el enlace de invitación.');
      } finally {
        setValidatingInvite(false);
      }
    };

    validate();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let endpoint = '/api/auth/register';
      let payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        licenseNumber: form.licenseNumber,
        email: form.email,
        password: form.password,
        clinicName: registerNewClinic ? clinicName : undefined,
      };

      if (inviteToken && inviteData) {
        endpoint = '/api/auth/register-invite';
        payload = {
          token: inviteToken,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email,
          password: form.password,
          licenseNumber: form.licenseNumber,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('¡Cuenta profesional creada con éxito! Ingresando al sistema...');
        await refreshUser();
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setError(data.error || 'Error al completar el registro');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8faf9] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-700 relative">
      {/* Fondo con trama médica suave */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b98112_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* 1. LOGO SUPERIOR CENTRADO (Badge verde con pulso ECG + MediSync) */}
      <div className="flex items-center gap-2.5 mb-6 relative z-10 select-none">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Activity className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
          MediSync
        </span>
      </div>

      {/* 2. TARJETA BLANCA PRINCIPAL */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl p-7 sm:p-9 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] relative z-10">
        {/* Encabezado */}
        <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase block mb-1">
          ACCESO AL SISTEMA
        </span>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Crear cuenta
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Completá tus datos profesionales.
        </p>

        {/* Notificaciones */}
        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {inviteData && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl">
            <p className="font-semibold">Invitación validada para {inviteData.clinicName}</p>
            <p className="text-[11px] text-emerald-600">Rol asignado: {inviteData.role}</p>
          </div>
        )}

        {/* Botón: Continuar con Google */}
        <button
          type="button"
          onClick={() => alert('Autenticación institucional de Google disponible')}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition shadow-2xs cursor-pointer mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar con Google
        </button>

        {/* Separador: O CON TU EMAIL */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase absolute">
            O CON TU EMAIL
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Fila 1: Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Nombre"
                className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Apellido
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Apellido"
                className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          {/* Fila 2: Rol y Matrícula */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rol
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={Boolean(inviteData)}
                className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer"
              >
                <option value="MEDICO">Médico</option>
                <option value="ADMIN">Director Médico</option>
                <option value="ENFERMERO">Enfermero</option>
                <option value="RECEPCION">Recepción</option>
                <option value="FARMACIA">Farmacia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Matrícula
              </label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="MN 123456"
                className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          {/* Fila 3: Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nombre@clinica.com"
              className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          {/* Fila 4: Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Opción opcional: Registrar nueva clínica */}
          {!inviteToken && (
            <div className="pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={registerNewClinic}
                  onChange={(e) => setRegisterNewClinic(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Crear y gestionar un nuevo Centro Médico / Clínica
                </span>
              </label>

              {registerNewClinic && (
                <div className="mt-2.5 animate-in fade-in duration-200">
                  <input
                    type="text"
                    required={registerNewClinic}
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Nombre del Sanatorio o Policonsultorio..."
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center mt-2"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      {/* 3. ENLACES INFERIORES */}
      <div className="mt-5 text-center text-xs text-slate-500 relative z-10 space-y-1">
        <div>
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/login"
            className="text-emerald-600 hover:text-emerald-700 font-semibold transition"
          >
            Ingresar
          </Link>
        </div>
        <div className="text-[11px] text-slate-400">
          Entorno de demostración · no se guardan cuentas
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando registro...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
