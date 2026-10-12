import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'MediSync — Sistema de Gestión para Policonsultorios y Clínicas',
  description: 'Sistema integral de EHR, Turnos, Guardias, Fichaje, Recepción e Inventario Clínico.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
