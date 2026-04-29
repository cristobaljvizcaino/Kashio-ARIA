/**
 * Artifact Definition Service
 * 
 * Gestiona el catálogo de definiciones de artefactos.
 * Connects to Express server API (Cloud SQL PostgreSQL).
 * Falls back to localStorage if API is unavailable.
 */

import { ArtifactDefinition } from '../types/types';

const API_BASE = '/api/db';
const STORAGE_KEY = 'aria_artifact_definitions';

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

function getFromStorage(): ArtifactDefinition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(data: ArtifactDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('⚠️ localStorage write failed:', e);
  }
}

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Obtener todas las definiciones de artefactos
 */
export async function getAllArtifactDefinitions(): Promise<ArtifactDefinition[]> {
  try {
    const definitions = await apiFetch<ArtifactDefinition[]>(`${API_BASE}/artifact-definitions`);
    console.log('✅ Loaded artifact definitions from DB:', definitions.length);
    return definitions;
  } catch (error: any) {
    console.error('❌ API error, falling back to localStorage:', error.message);
    const stored = getFromStorage();
    if (stored.length > 0) return stored;
    return [];
  }
}

/**
 * Obtener definiciones por gate
 */
export async function getArtifactDefinitionsByGate(gate: string): Promise<ArtifactDefinition[]> {
  const all = await getAllArtifactDefinitions();
  return all.filter(def => def.gate === gate);
}

/**
 * Obtener definiciones por gate y tipo de iniciativa
 */
export async function getArtifactDefinitionsForInitiative(
  gate: string,
  initiativeType: 'Change' | 'Run'
): Promise<ArtifactDefinition[]> {
  const all = await getAllArtifactDefinitions();
  return all.filter(def => 
    def.gate === gate && 
    (def.initiativeType === 'Both' || def.initiativeType === initiativeType)
  );
}

/**
 * Crear nueva definición de artefacto
 */
export async function createArtifactDefinition(definition: ArtifactDefinition): Promise<ArtifactDefinition> {
  try {
    const result = await apiFetch<ArtifactDefinition>(`${API_BASE}/artifact-definitions`, {
      method: 'POST',
      body: JSON.stringify(definition),
    });
    console.log('✅ Artifact definition created in DB:', result.id);
    return result;
  } catch (error: any) {
    console.error('❌ API error, falling back to localStorage:', error.message);
    const all = getFromStorage();
    const newDef = {
      ...definition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    all.push(newDef);
    saveToStorage(all);
    return newDef;
  }
}

/**
 * Actualizar definición de artefacto
 */
export async function updateArtifactDefinition(
  id: string,
  updates: Partial<ArtifactDefinition>
): Promise<ArtifactDefinition> {
  try {
    const result = await apiFetch<ArtifactDefinition>(`${API_BASE}/artifact-definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    console.log('✅ Artifact definition updated in DB:', result.id);
    return result;
  } catch (error: any) {
    console.error('❌ API error, falling back to localStorage:', error.message);
    const all = getFromStorage();
    const index = all.findIndex(def => def.id === id);
    if (index === -1) throw new Error(`Artifact definition ${id} not found`);
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveToStorage(all);
    return all[index];
  }
}

/**
 * Eliminar definición de artefacto
 */
export async function deleteArtifactDefinition(id: string): Promise<void> {
  try {
    await apiFetch(`${API_BASE}/artifact-definitions/${id}`, { method: 'DELETE' });
    console.log('✅ Artifact definition deleted from DB:', id);
  } catch (error: any) {
    console.error('❌ API error, falling back to localStorage:', error.message);
    const all = getFromStorage();
    const filtered = all.filter(def => def.id !== id);
    saveToStorage(filtered);
  }
}

export default {
  getAllArtifactDefinitions,
  getArtifactDefinitionsByGate,
  getArtifactDefinitionsForInitiative,
  createArtifactDefinition,
  updateArtifactDefinition,
  deleteArtifactDefinition
};
