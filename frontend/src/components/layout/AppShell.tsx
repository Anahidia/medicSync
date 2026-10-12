'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { HeartPulse } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage) {
        // Opción 1: Si no está logueado, redirigir a Login
        router.push('/login');
      } else if (user && pathname === '/login') {
        // Si ya está logueado y va a login, redirigir a la página principal
        router.push('/');
      }
    }
  }, [user, loading, isAuthPage, pathname, router]);

  // Pantalla de carga mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-3 animate-bounce">
          <HeartPulse className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-700">Verificando acceso a MediSync...</p>
      </div>
    );
  }

  // En páginas de Login y Registro: pantalla limpia clara completa
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#fbfcfd] text-slate-800">
        {children}
      </div>
    );
  }

  // Si no está autenticado y no es login/register, no renderizar nada mientras redirige
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-xs font-semibold text-slate-500">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }

  // Usuario autenticado en el sistema principal: Sidebar + Header + Contenido
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
