# Implementación de Login con Microsoft 365 (Azure AD)

**Objetivo**: Solo usuarios @kashio.net pueden acceder a ARIA  
**Método**: OAuth 2.0 con Azure Active Directory  
**Plataforma**: Compatible con Vercel y Cloud Run

---

## 🎯 Flujo de Autenticación

```
Usuario → ARIA Login → Redirect Azure AD → Login Microsoft 365 → 
Verificar @kashio.net → Token JWT → Acceso permitido
```

---

## 📋 Paso 1: Configurar Azure AD App Registration

### 1.1 Ir al Portal de Azure

**URL**: https://portal.azure.com  
**Sección**: Azure Active Directory → App registrations

### 1.2 Crear Nueva App Registration

1. Haz clic en **"New registration"**
2. Completa:
   - **Name**: `ARIA Control Center`
   - **Supported account types**: `Accounts in this organizational directory only (Kashio only - Single tenant)`
   - **Redirect URI**: 
     - Type: `Web`
     - URL: `https://aria-control-center.vercel.app/auth/callback`
     - Agregar también: `https://aria-frontend-215989210525.us-central1.run.app/auth/callback`
     - Y: `http://localhost:3000/auth/callback` (para desarrollo)

3. Haz clic en **"Register"**

### 1.3 Obtener Credenciales

Después de crear, anota:

- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 1.4 Crear Client Secret

1. Ve a **"Certificates & secrets"**
2. Haz clic en **"New client secret"**
3. Description: `ARIA Production Secret`
4. Expires: `24 months`
5. Haz clic en **"Add"**
6. **COPIA EL VALUE** (solo se muestra una vez): `xxxxxx~xxxxxxxxxxxxxxxxxx`

### 1.5 Configurar API Permissions

1. Ve a **"API permissions"**
2. Haz clic en **"Add a permission"**
3. Selecciona **"Microsoft Graph"**
4. Selecciona **"Delegated permissions"**
5. Agrega:
   - ✅ `User.Read` (leer perfil básico)
   - ✅ `email`
   - ✅ `profile`
   - ✅ `openid`
6. Haz clic en **"Grant admin consent for Kashio"** (requiere admin)

---

## 📝 Paso 2: Configurar Variables de Entorno

### En Vercel

```bash
vercel env add AZURE_AD_CLIENT_ID production
# Pegar: Application (client) ID

vercel env add AZURE_AD_CLIENT_SECRET production  
# Pegar: Client secret value

vercel env add AZURE_AD_TENANT_ID production
# Pegar: Directory (tenant) ID

vercel env add NEXTAUTH_URL production
# Pegar: https://aria-control-center.vercel.app

vercel env add NEXTAUTH_SECRET production
# Pegar: $(openssl rand -base64 32)
```

### En Cloud Run

```bash
# Crear secrets
echo -n "CLIENT_ID_AQUI" | gcloud secrets create azure-client-id --data-file=- --project kashio-squad-nova
echo -n "CLIENT_SECRET_AQUI" | gcloud secrets create azure-client-secret --data-file=- --project kashio-squad-nova
echo -n "TENANT_ID_AQUI" | gcloud secrets create azure-tenant-id --data-file=- --project kashio-squad-nova

# Actualizar Cloud Run
gcloud run services update aria-frontend \
  --region us-central1 \
  --update-secrets="AZURE_AD_CLIENT_ID=azure-client-id:latest,AZURE_AD_CLIENT_SECRET=azure-client-secret:latest,AZURE_AD_TENANT_ID=azure-tenant-id:latest" \
  --project kashio-squad-nova
```

---

## 💻 Paso 3: Instalar Dependencias

```bash
cd /Users/jules/Kashio/ARIA
npm install @azure/msal-browser @azure/msal-react
```

---

## 🔐 Paso 4: Crear Servicio de Autenticación

`src/services/authService.ts`:

```typescript
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

// Configuración de Azure AD
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}`,
    redirectUri: window.location.origin + '/auth/callback',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Inicializar MSAL
export async function initializeMsal() {
  await msalInstance.initialize();
}

// Login con Microsoft 365
export async function loginWithMicrosoft() {
  try {
    const loginResponse = await msalInstance.loginPopup({
      scopes: ['User.Read', 'email', 'profile', 'openid'],
      prompt: 'select_account'
    });
    
    return loginResponse;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Logout
export async function logout() {
  await msalInstance.logoutPopup();
}

// Get current user
export function getCurrentUser() {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    return accounts[0];
  }
  return null;
}

// Verificar si usuario está autenticado
export function isAuthenticated(): boolean {
  return msalInstance.getAllAccounts().length > 0;
}

// Verificar dominio permitido
export function isAllowedDomain(email: string): boolean {
  return email.endsWith('@kashio.net') || email.endsWith('@kashio.us');
}

// Get access token
export async function getAccessToken() {
  const account = getCurrentUser();
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: ['User.Read'],
      account
    });
    return response.accessToken;
  } catch (error) {
    // Token expirado, hacer login de nuevo
    const response = await msalInstance.acquireTokenPopup({
      scopes: ['User.Read'],
      account
    });
    return response.accessToken;
  }
}

export default {
  msalInstance,
  initializeMsal,
  loginWithMicrosoft,
  logout,
  getCurrentUser,
  isAuthenticated,
  isAllowedDomain,
  getAccessToken
};
```

---

## 🎨 Paso 5: Crear Componente de Login

`src/components/LoginPage.tsx`:

```typescript
import React, { useState } from 'react';
import { Lock, LogIn, Shield } from 'lucide-react';
import { loginWithMicrosoft, isAllowedDomain } from '../services/authService';

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
      const response = await loginWithMicrosoft();
      
      // Verificar que sea del dominio permitido
      if (!isAllowedDomain(response.account.username)) {
        setError('Acceso denegado. Solo usuarios @kashio.net pueden acceder.');
        return;
      }

      // Login exitoso
      onLoginSuccess();
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl mb-4 shadow-xl">
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
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-8">
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSI+PHBhdGggZmlsbD0iI2Y2NTMxNCIgZD0iTTAgMGgxMHYxMEgweiIvPjxwYXRoIGZpbGw9IiM4MGJjMDYiIGQ9Ik0xMSAwaDEwdjEwSDExeiIvPjxwYXRoIGZpbGw9IiMwNWE2ZjAiIGQ9Ik0wIDExaDEwdjEwSDB6Ii8+PHBhdGggZmlsbD0iI2ZmYmEwOCIgZD0iTTExIDExaDEwdjEwSDExeiIvPjwvc3ZnPg=="
                  alt="Microsoft"
                  className="w-5 h-5"
                />
                <span>Ingresar con Microsoft 365</span>
                <LogIn size={18} />
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Lock size={12} />
              <span>Conexión segura mediante OAuth 2.0</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Tu contraseña nunca es compartida con ARIA
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Acceso restringido a empleados de Kashio (@kashio.net)
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

## 🔒 Paso 6: Proteger la Aplicación

`src/App.tsx` (actualizar):

```typescript
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { 
  initializeMsal, 
  isAuthenticated, 
  getCurrentUser,
  logout 
} from './services/authService';

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Inicializar MSAL al cargar
    initializeMsal().then(() => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      
      if (authenticated) {
        setUser(getCurrentUser());
      }
      
      setIsLoading(false);
    });
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
    setUser(getCurrentUser());
  };

  const handleLogout = async () => {
    await logout();
    setIsAuth(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuth) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
      {/* ... resto de tu aplicación ... */}
    </Layout>
  );
};

export default App;
```

---

## 👤 Paso 7: Actualizar Layout con Info de Usuario

`src/components/Layout.tsx` (agregar):

```typescript
interface LayoutProps {
  // ... existing props
  user?: any;
  onLogout?: () => void;
}

// En el sidebar, agregar sección de usuario:
<div className="p-4 border-t border-slate-200 bg-slate-50">
  <div className="flex items-center space-x-3">
    <img 
      src={user?.idTokenClaims?.picture || `https://ui-avatars.com/api/?name=${user?.name}`}
      alt={user?.name}
      className="w-10 h-10 rounded-full"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 truncate">
        {user?.name}
      </p>
      <p className="text-xs text-slate-500 truncate">
        {user?.username}
      </p>
    </div>
  </div>
  
  <button
    onClick={onLogout}
    className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
  >
    <LogOut size={16} />
    <span>Cerrar Sesión</span>
  </button>
</div>
```

---

## 🔐 Paso 8: Agregar Middleware de Verificación

`src/utils/authMiddleware.ts`:

```typescript
import { getCurrentUser, isAllowedDomain } from '../services/authService';

export function requireAuth(): boolean {
  const user = getCurrentUser();
  
  if (!user) {
    return false;
  }

  // Verificar dominio
  if (!isAllowedDomain(user.username)) {
    alert('Acceso denegado. Solo usuarios @kashio.net pueden acceder.');
    return false;
  }

  return true;
}

// Verificar rol del usuario (futuro)
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Los roles vendrán de Azure AD groups o custom claims
  const roles = user.idTokenClaims?.roles || [];
  return roles.includes(role);
}

// Roles disponibles (configurar en Azure AD)
export const ROLES = {
  PRODUCT_MANAGER: 'ProductManager',
  TECH_LEAD: 'TechLead',
  PMO: 'PMO',
  STAKEHOLDER: 'Stakeholder',
  ADMIN: 'Admin'
};
```

---

## 📊 Paso 9: Configurar en vite.config.ts

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // ... existing config
    define: {
      // Existing
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      
      // Azure AD (nuevo)
      'import.meta.env.VITE_AZURE_AD_CLIENT_ID': JSON.stringify(env.AZURE_AD_CLIENT_ID),
      'import.meta.env.VITE_AZURE_AD_TENANT_ID': JSON.stringify(env.AZURE_AD_TENANT_ID),
    }
  };
});
```

---

## 🧪 Paso 10: Testing del Login

### Test local

```bash
# 1. Configurar .env.local
cat >> .env.local <<EOF
AZURE_AD_CLIENT_ID=tu_client_id_aqui
AZURE_AD_TENANT_ID=tu_tenant_id_aqui
AZURE_AD_CLIENT_SECRET=tu_secret_aqui
EOF

# 2. Run local
npm run dev

# 3. Abrir http://localhost:3000
# Debe mostrar pantalla de login
# Hacer clic en "Ingresar con Microsoft 365"
# Debe redirigir a login.microsoftonline.com
```

### Test en producción

1. Deploy a Vercel: `vercel --prod`
2. Abrir: https://aria-control-center.vercel.app
3. Debe mostrar login
4. Login con usuario @kashio.net
5. Verificar acceso

---

## 🔄 Flujo Completo de Usuario

```
1. Usuario abre ARIA
   ↓
2. App verifica si hay sesión activa
   ↓ (No hay sesión)
3. Muestra LoginPage
   ↓
4. Usuario hace clic en "Ingresar con Microsoft 365"
   ↓
5. Redirect a login.microsoftonline.com
   ↓
6. Usuario ingresa email/password de Microsoft 365
   ↓
7. Azure AD verifica credenciales
   ↓
8. Verifica que email termine en @kashio.net
   ↓ (OK)
9. Redirect a ARIA con token
   ↓
10. ARIA guarda sesión
    ↓
11. Muestra aplicación completa
```

---

## 🎯 Dominios Permitidos

Por defecto, permitir:
- ✅ `@kashio.net` (principal)
- ✅ `@kashio.us` (alternativo)

Actualizar en `authService.ts`:
```typescript
export function isAllowedDomain(email: string): boolean {
  const allowedDomains = ['kashio.net', 'kashio.us'];
  return allowedDomains.some(domain => email.endsWith(`@${domain}`));
}
```

---

## 📱 Paso 11: Restricción por Rol (Opcional)

Si quieres diferentes permisos por rol:

```typescript
// En Azure AD, agregar usuarios a grupos:
// - ARIA-ProductManagers
// - ARIA-TechLeads
// - ARIA-PMO
// - ARIA-Stakeholders

// En App.tsx, verificar:
if (hasRole(ROLES.PRODUCT_MANAGER)) {
  // Puede crear/editar iniciativas
}

if (hasRole(ROLES.STAKEHOLDER)) {
  // Solo lectura
}
```

---

## 🚀 Despliegue con Auth

### Vercel
```bash
# 1. Configurar env vars (Paso 2)
# 2. Deploy
npm run build
vercel --prod
```

### Cloud Run
```bash
# 1. Configurar secrets (Paso 2)
# 2. Deploy
gcloud run deploy aria-frontend --source . --region us-central1
```

---

## ✅ Checklist de Implementación

- [ ] Crear App Registration en Azure AD
- [ ] Obtener Client ID, Tenant ID, Client Secret
- [ ] Configurar Redirect URIs
- [ ] Grant admin consent en Azure AD
- [ ] Instalar dependencias (@azure/msal-browser, @azure/msal-react)
- [ ] Crear authService.ts
- [ ] Crear LoginPage.tsx
- [ ] Actualizar App.tsx con auth check
- [ ] Actualizar Layout.tsx con user info
- [ ] Configurar env vars en Vercel/Cloud Run
- [ ] Testing local
- [ ] Deploy a producción
- [ ] Verificar login funciona

**Tiempo estimado**: 45-60 minutos

---

## 📞 Quién Puede Ayudar

**Para Azure AD App Registration**:
- Azure AD Administrator de Kashio
- Microsoft 365 Admin
- Identity & Access Management team

**Suelen ser**:
- IT Admin
- Security Team
- DevOps Lead

---

## 🔗 Links Útiles

- **Azure Portal**: https://portal.azure.com
- **App Registrations**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
- **Azure AD Docs**: https://docs.microsoft.com/en-us/azure/active-directory/develop/
- **MSAL React**: https://github.com/AzureAD/microsoft-authentication-library-for-js

---

**¿Quieres que implemente el código ahora o prefieres primero configurar la App Registration en Azure AD?** 🔐

