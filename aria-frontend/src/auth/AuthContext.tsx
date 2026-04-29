import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated, MsalProvider } from '@azure/msal-react';
import {
  PublicClientApplication,
  AccountInfo,
  InteractionStatus,
  EventType,
} from '@azure/msal-browser';
import { buildMsalConfig, loginRequest } from './msalConfig';
export interface AuthUser {
  name: string;
  email: string;
  initials: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function mapAccount(account: AccountInfo | null): AuthUser | null {
  if (!account) return null;
  const name = account.name || account.username || 'Usuario';
  return {
    name,
    email: account.username || '',
    initials: getInitials(name) || 'U',
  };
}

const AuthInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const user = useMemo(() => mapAccount(accounts[0] ?? null), [accounts]);
  const isLoading = inProgress !== InteractionStatus.None;

  const login = useCallback(() => {
    instance.loginRedirect(loginRequest).catch((err) => {
      console.error('[Auth] Login failed:', err);
    });
  }, [instance]);

  const logout = useCallback(() => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' }).catch((err) => {
      console.error('[Auth] Logout failed:', err);
    });
  }, [instance]);

  const state = useMemo<AuthState>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, user, login, logout]
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(buildMsalConfig());
  }
  return msalInstance;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const instance = useMemo(() => getMsalInstance(), []);

  useEffect(() => {
    instance
      .initialize()
      .then(() => {
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
          instance.setActiveAccount(accounts[0]);
        }

        instance.addEventCallback((event) => {
          if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const account = (event.payload as { account?: AccountInfo }).account;
            if (account) {
              instance.setActiveAccount(account);
            }
          }
        });

        instance
          .handleRedirectPromise()
          .then(() => {
            setIsReady(true);
          })
          .catch((err) => {
            console.error('[Auth] Redirect handling failed:', err);
            setIsReady(true);
          });
      })
      .catch((err) => {
        console.error('[Auth] MSAL initialization failed:', err);
        setIsReady(true);
      });
  }, [instance]);

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400 text-sm">Inicializando...</div>
      </div>
    );
  }

  return (
    <MsalProvider instance={instance}>
      <AuthInner>{children}</AuthInner>
    </MsalProvider>
  );
};

/**
 * Contenedor con MSAL (mismo patrón que kbatch: AuthProvider alrededor de la app).
 */
export const AriaAuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider> o <AriaAuthShell>');
  }
  return ctx;
}
