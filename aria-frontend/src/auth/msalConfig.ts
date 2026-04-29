import { Configuration, LogLevel, BrowserCacheLocation } from '@azure/msal-browser';

/** Rellenado en runtime por public/config.js o por el contenedor. */
type AriaWindow = Window & {
  aria_msal_config?: { clientId?: string; authority?: string };
};

interface MsalRuntimeConfig {
  clientId: string;
  authority: string;
}

function getRuntimeMsalConfig(): MsalRuntimeConfig {
  const cfg = (window as AriaWindow).aria_msal_config;  return {
    clientId: cfg?.clientId?.trim() ?? '',
    authority: cfg?.authority?.trim() ?? '',
  };
}

export function buildMsalConfig(): Configuration {
  const { clientId, authority } = getRuntimeMsalConfig();

  return {
    auth: {
      clientId,
      authority,
      redirectUri: '/',
      postLogoutRedirectUri: '/',
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback(_logLevel: LogLevel, message: string) {
          if (import.meta.env.DEV) {
            console.debug('[MSAL]', message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  };
}

export const loginRequest = {
  scopes: ['User.Read'],
};
