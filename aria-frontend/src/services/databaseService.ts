/**
 * Database Service - ARIA
 * 
 * Connects to Express server API which talks to Cloud SQL PostgreSQL.
 * Falls back to localStorage if API is unavailable.
 */

import { IntakeRequest, Initiative, Artifact } from '../types/types';

// API base URL - same origin (Express serves both frontend and API)
const API_BASE = '/api/db';

// ========================================
// HELPERS
// ========================================

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }
  return response.json();
}

// localStorage helpers for fallback
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('⚠️ localStorage write failed:', e);
  }
}

// ========================================
// INTAKE REQUESTS (read-only, used by Generation to load intake context)
// ========================================

export async function getAllIntakeRequests(): Promise<IntakeRequest[]> {
  console.log('📥 [DB] Fetching all intake requests');
  try {
    const data = await apiFetch<IntakeRequest[]>(`${API_BASE}/intakes`);
    console.log('✅ [DB] Fetched intakes from PostgreSQL:', data.length);
    return data;
  } catch (error: any) {
    console.error('❌ [DB] API error, falling back to localStorage:', error.message);
    return getFromStorage<IntakeRequest[]>('aria_intake_requests', []);
  }
}

// ========================================
// INITIATIVES
// ========================================

export async function createInitiative(initiative: Initiative): Promise<Initiative> {
  console.log('💾 [DB] Creating initiative:', initiative.id);
  try {
    const cleanInit = cleanInitiativeForStorage(initiative);
    const result = await apiFetch<Initiative>(`${API_BASE}/initiatives`, {
      method: 'POST',
      body: JSON.stringify(cleanInit),
    });
    console.log('✅ [DB] Initiative created in PostgreSQL:', result.id);
    return result;
  } catch (error: any) {
    console.error('❌ [DB] API error, falling back to localStorage:', error.message);
    const stored = getFromStorage<Initiative[]>('aria_initiatives', []);
    stored.push(initiative);
    saveToStorage('aria_initiatives', stored);
    return initiative;
  }
}

export async function getAllInitiatives(): Promise<Initiative[]> {
  console.log('📥 [DB] Fetching all initiatives');
  try {
    const data = await apiFetch<Initiative[]>(`${API_BASE}/initiatives`);
    console.log('✅ [DB] Fetched initiatives from PostgreSQL:', data.length);
    return data;
  } catch (error: any) {
    console.error('❌ [DB] API error, falling back to localStorage:', error.message);
    return getFromStorage<Initiative[]>('aria_initiatives', []);
  }
}

export async function updateInitiative(id: string, updates: Partial<Initiative>): Promise<Initiative> {
  console.log('📝 [DB] Updating initiative:', id);
  try {
    const cleanUpdates = updates.artifacts
      ? { ...updates, artifacts: cleanArtifactsForStorage(updates.artifacts) }
      : updates;
    const result = await apiFetch<Initiative>(`${API_BASE}/initiatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanUpdates),
    });
    console.log('✅ [DB] Initiative updated in PostgreSQL:', result.id);
    return result;
  } catch (error: any) {
    console.error('❌ [DB] API error, falling back to localStorage:', error.message);
    const stored = getFromStorage<Initiative[]>('aria_initiatives', []);
    const index = stored.findIndex(i => i.id === id);
    if (index >= 0) {
      stored[index] = { ...stored[index], ...updates };
      saveToStorage('aria_initiatives', stored);
      return stored[index];
    }
    throw new Error(`Initiative ${id} not found`);
  }
}

export async function deleteInitiative(id: string): Promise<void> {
  console.log('🗑️ [DB] Deleting initiative:', id);
  try {
    await apiFetch(`${API_BASE}/initiatives/${id}`, { method: 'DELETE' });
    console.log('✅ [DB] Initiative deleted from PostgreSQL:', id);
  } catch (error: any) {
    console.error('❌ [DB] API error, falling back to localStorage:', error.message);
    const stored = getFromStorage<Initiative[]>('aria_initiatives', []);
    const filtered = stored.filter(i => i.id !== id);
    saveToStorage('aria_initiatives', filtered);
  }
}

export async function updateArtifact(
  initiativeId: string,
  artifactId: string,
  updates: Partial<Artifact>
): Promise<Artifact> {
  console.log('📝 [DB] Updating artifact:', artifactId, 'in initiative:', initiativeId);
  try {
    const initiatives = await getAllInitiatives();
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) throw new Error(`Initiative ${initiativeId} not found`);
    
    const artifactIndex = initiative.artifacts.findIndex(a => a.id === artifactId);
    if (artifactIndex < 0) throw new Error(`Artifact ${artifactId} not found`);
    
    initiative.artifacts[artifactIndex] = { ...initiative.artifacts[artifactIndex], ...updates };
    await updateInitiative(initiativeId, { artifacts: initiative.artifacts });
    
    return initiative.artifacts[artifactIndex];
  } catch (error: any) {
    console.error('❌ [DB] Error updating artifact:', error.message);
    throw error;
  }
}

// ========================================
// HELPERS
// ========================================

function cleanArtifactsForStorage(artifacts: Artifact[]): Artifact[] {
  return artifacts.map(art => ({
    ...art,
    // Remove any Blob or non-serializable data
    versions: undefined as any,
  }));
}

function cleanInitiativeForStorage(initiative: Initiative): Initiative {
  return {
    ...initiative,
    artifacts: cleanArtifactsForStorage(initiative.artifacts || [])
  };
}

// ========================================
// EXPORTS
// ========================================

export default {
  getAllIntakeRequests,
  createInitiative,
  getAllInitiatives,
  updateInitiative,
  deleteInitiative,
  updateArtifact,
};
