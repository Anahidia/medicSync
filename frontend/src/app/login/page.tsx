'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Activity, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Credenciales inválidas');
    }
  };

  const handleQuickDemoLogin = async (role: any, userEmail: string) => {
    setEmail(userEmail);
    setPassword('123456');
    await switchRole(role);
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8faf9] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-700 relative">
      {/* Fondo sutil con trama médica muy suave */}
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
      <div className="w-full max-w-[430px] bg-white rounded-2xl p-7 sm:p-9 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] relative z-10">
        {/* Encabezado de la tarjeta */}
        <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase block mb-1">
          ACCESO AL SISTEMA
        </span>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Bienvenida de nuevo
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Ingresá con tu cuenta profesional.
        </p>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {error}
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
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@clinica.com"
              className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Contraseña
              </label>
              <a
                href="#recuperar"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Para restablecer tu contraseña, consulta con la administración o utiliza una cuenta de demostración.');
                }}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center mt-2"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Demo rápido discreto para pruebas */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Acceso rápido demo (1 clic)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ADMIN', 'admin@medisync.com')}
              className="p-2 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 border border-slate-100 rounded-xl text-left transition cursor-pointer"
            >
              <strong className="block text-slate-700 text-[11px]">Director</strong>
              <span className="text-[10px] text-slate-400">admin@medisync.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('MEDICO', 'medico1@medisync.com')}
              className="p-2 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 border border-slate-100 rounded-xl text-left transition cursor-pointer"
            >
              <strong className="block text-slate-700 text-[11px]">Dra. Clara</strong>
              <span className="text-[10px] text-slate-400">Cardiología</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ENFERMERO', 'enfermero@medisync.com')}
              className="p-2 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 border border-slate-100 rounded-xl text-left transition cursor-pointer"
            >
              <strong className="block text-slate-700 text-[11px]">Lic. Lucas</strong>
              <span className="text-[10px] text-slate-400">Enfermería</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('RECEPCION', 'recepcion@medisync.com')}
              className="p-2 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 border border-slate-100 rounded-xl text-left transition cursor-pointer"
            >
              <strong className="block text-slate-700 text-[11px]">Mariana</strong>
              <span className="text-[10px] text-slate-400">Recepción</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ENLACES INFERIORES */}
      <div className="mt-5 text-center text-xs text-slate-500 relative z-10 space-y-1">
        <div>
          ¿No tenés cuenta?{' '}
          <Link
            href="/register"
            className="text-emerald-600 hover:text-emerald-700 font-semibold transition"
          >
            Registrate
          </Link>
        </div>
        <div className="text-[11px] text-slate-400">
          Entorno de demostración · no se guardan cuentas
        </div>
      </div>
    </div>
  );
}
