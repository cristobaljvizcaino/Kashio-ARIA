import React from 'react';
import { Activity, LogIn, Rocket, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

/**
 * Vista de acceso alineada al estándar corporativo (Microsoft 365 + Entra).
 * Misma lógica MSAL; solo presentación.
 */
const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#080d18] text-white">
        <Activity className="h-10 w-10 text-sky-500 animate-pulse" aria-hidden />
        <p className="text-slate-400 text-sm">Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-x-hidden bg-[#080d18] text-white px-4 py-10">
        {/* Fondo: gradiente radial suave al centro (estilo referencia) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 85% 55% at 50% 20%, rgba(30, 64, 175, 0.22) 0%, rgba(8, 13, 24, 0) 55%), #080d18',
          }}
        />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          {/* Cabecera marca ARIA */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="mb-5 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              }}
            >
              <Rocket className="h-6 w-6 text-white" strokeWidth={2.2} aria-hidden />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="text-white">KASHIO</span>
              <span className="text-sky-400">ARIA</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-sm">
              Ciclo de vida del desarrollo de producto
            </p>
          </div>

          {/* Tarjeta de acceso */}
          <div
            className="w-full rounded-2xl border p-6 sm:p-8 shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 13, 24, 0.95) 100%)',
              borderColor: 'rgba(148, 163, 184, 0.2)',
            }}
          >
            <div className="flex items-center gap-2.5 text-slate-400 text-sm mb-5">
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 21 21"
                fill="none"
                aria-hidden
              >
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              <span>Microsoft - Office 365</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Acceso organizacional</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Usa tu cuenta corporativa de Kashio para continuar a ARIA.
            </p>

            <button
              type="button"
              onClick={login}
              className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold py-3.5 px-4 text-white transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
              style={{
                background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.25), 0 12px 32px -8px rgba(37, 99, 235, 0.5)',
              }}
            >
              <LogIn className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden />
              Entrar con cuenta Kashio
            </button>

            <div
              className="mt-5 rounded-xl p-4 text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="text-slate-300 leading-relaxed text-left">
                  Acceso solo para usuarios con correo en{' '}
                  <span className="text-white font-semibold">@kashio.net</span>.
                </p>
              </div>
            </div>

            <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-xs text-slate-500">
              <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
              <span>
                Si no puedes acceder a tu cuenta corporativa, contacta a soporte de TI.
              </span>
            </p>
          </div>

          {/* Franja decorativa (Microsoft) */}
          <div className="mt-8 flex w-full max-w-md h-1.5 overflow-hidden rounded-full" aria-hidden>
            <div className="flex-1 bg-[#f25022]" />
            <div className="flex-1 bg-[#fbbf24]" />
            <div className="flex-1 bg-[#2563eb]" />
          </div>

          <p className="mt-6 text-xs text-slate-600">Protegido por Microsoft Entra ID</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoginGate;
