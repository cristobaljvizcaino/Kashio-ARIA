/**
 * Authentication Service - Firebase Identity Platform
 * Microsoft 365 (Azure AD) OAuth Login
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  OAuthProvider,
  User
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHVEGDLzKgDQ7yjDNqDREnQ3WaJtGTbjk",
  authDomain: "kashio-squad-nova.firebaseapp.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Microsoft OAuth Provider
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  tenant: '4cb14595-301a-44ee-af4e-33b9bb64c9c4', // Kashio Tenant ID
  prompt: 'select_account'
});

// Request specific scopes
microsoftProvider.addScope('User.Read');
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');

/**
 * Login with Microsoft 365
 */
export async function loginWithMicrosoft(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    
    // Verificar dominio permitido
    const email = result.user.email || '';
    if (!isAllowedDomain(email)) {
      await signOut(auth);
      throw new Error(`Acceso denegado. Solo usuarios @kashio.net o @kashio.us pueden acceder. Tu email: ${email}`);
    }
    
    console.log('✅ Login exitoso:', result.user.email);
    return result.user;
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    // Error codes de Firebase
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelado. Por favor intenta nuevamente.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('El popup fue bloqueado por tu navegador. Por favor habilita popups para este sitio.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Login cancelado.');
    }
    
    throw error;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  await signOut(auth);
  console.log('✅ Sesión cerrada');
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Verificar si el email pertenece a un dominio permitido
 */
export function isAllowedDomain(email: string): boolean {
  const allowedDomains = ['kashio.net', 'kashio.us', 'kashio.com'];
  return allowedDomains.some(domain => email.toLowerCase().endsWith(`@${domain}`));
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user display name
 */
export function getUserDisplayName(): string {
  const user = getCurrentUser();
  return user?.displayName || user?.email || 'Usuario';
}

/**
 * Get user email
 */
export function getUserEmail(): string {
  const user = getCurrentUser();
  return user?.email || '';
}

/**
 * Get user photo URL
 */
export function getUserPhotoURL(): string | null {
  const user = getCurrentUser();
  return user?.photoURL || null;
}

export default {
  auth,
  loginWithMicrosoft,
  logout,
  getCurrentUser,
  isAuthenticated,
  isAllowedDomain,
  onAuthStateChange,
  getUserDisplayName,
  getUserEmail,
  getUserPhotoURL
};

