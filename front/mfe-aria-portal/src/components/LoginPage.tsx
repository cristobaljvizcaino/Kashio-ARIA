import React, { useState } from 'react';
import { Lock, LogIn, Shield, AlertCircle } from 'lucide-react';
import { loginWithMicrosoft } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithMicrosoft();
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión. Por favor intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl mb-4 shadow-2xl shadow-indigo-200">
            <span className="text-3xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Kashio ARIA
          </h1>
          <p className="text-slate-600 font-medium">
            AI-Powered PDLC Control Center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Shield className="text-indigo-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Acceso Seguro
              </h2>
              <p className="text-xs text-slate-500">
                Solo usuarios autorizados de Kashio
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm text-red-900 font-bold mb-1">Error de Autenticación</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 21 21" className="w-5 h-5">
                  <rect fill="#f65314" width="10" height="10"/>
                  <rect fill="#80bc06" x="11" width="10" height="10"/>
                  <rect fill="#05a6f0" y="11" width="10" height="10"/>
                  <rect fill="#ffba08" x="11" y="11" width="10" height="10"/>
                </svg>
                <span>Ingresar con Microsoft 365</span>
                <LogIn size={18} />
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
              <Lock size={12} />
              <span>Conexión segura mediante OAuth 2.0</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Tu contraseña nunca es compartida con ARIA
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 space-y-2">
          <p className="text-center text-xs text-slate-400">
            Acceso restringido a empleados de Kashio
          </p>
          <p className="text-center text-xs text-slate-400">
            Dominios permitidos: @kashio.net, @kashio.us
          </p>
        </div>

        {/* Info */}
        <div className="mt-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-600 text-center">
            <strong className="text-slate-900">ARIA</strong> - Automated Requirements & Intelligent Artifacts
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            Product Development Life Cycle Control Center
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

