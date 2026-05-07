export type ArtifactInitiativeType = 'Run' | 'Change' | 'Both';

/**
 * Modelo expuesto por la API. Se alinea con el esquema vigente:
 *   id            BIGSERIAL PK interno
 *   public_id     UUID estable (clave de URL/API)
 *   fase          1–8 (PDLC KashioOS)
 *   predecessor_names jsonb array de strings (nombres legibles de predecesores)
 */
export interface ArtifactDefinition {
  id: number;
  publicId: string;
  fase: number;
  faseLabel: string;
  name: string;
  initiativeType: ArtifactInitiativeType;
  predecessorNames: string[];
  description: string | null;
  mandatory: boolean;
  area: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cuerpo POST. Indica **`fase`** (1–8) o **`faseName`** (etiqueta KashioOS, ej. `Design`);
 * hace falta al menos uno. Si ambos van y no coinciden → 400.
 * `predecessorNames`: cada elemento puede ser `publicId` (UUID) o `name` exacto de un
 * artefacto existente; se normaliza al `name` guardado en BD.
 * `initiativeType`: opcional en POST; si se envía debe ser **`Run`**, **`Change`** o **`Both`**
 * (mayúsculas indistintas). Si se omite → **`Both`**.
 */
export interface ArtifactDefinitionInput {
  fase?: number;
  /** Etiqueta de fase (misma que `faseLabel` en respuesta), ej. `Backend Development`. */
  faseName?: string;
  name: string;
  initiativeType?: ArtifactInitiativeType;
  predecessorNames?: string[];
  description?: string | null;
  mandatory?: boolean;
  area?: string;
  publicId?: string;
}

/** Parámetros ya normalizados para INSERT (fase 1–8 resuelta; sin `faseName`). */
export type ArtifactDefinitionInsertPayload = Omit<
  ArtifactDefinitionInput,
  'faseName' | 'fase'
> & {
  fase: number;
};

export type ArtifactDefinitionUpdate = Partial<
  Omit<
    ArtifactDefinition,
    'id' | 'publicId' | 'faseLabel' | 'createdAt' | 'updatedAt' | 'initiativeType'
  >
> & {
  initiativeType?: ArtifactInitiativeType;
  faseName?: string;
};

/** Forma cruda devuelta por `pg` (snake_case y `id` puede llegar como string desde bigint). */
export interface ArtifactDefinitionRow {
  id: number | string;
  public_id: string;
  fase: number;
  name: string;
  initiative_type: string;
  predecessor_names: string[] | null;
  description: string | null;
  mandatory: boolean;
  area: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

export interface ArtifactDefinitionsByPhaseGroup {
  fase: number;
  faseLabel: string;
  count: number;
  artifacts: ArtifactDefinition[];
}

/**
 * Respuesta de `GET /artifact-definitions` (sin paginación: siempre el conjunto completo
 * que cumple el filtro). `phases` incluye **siempre las 8 fases** KashioOS (1–8); las que no
 * tienen coincidencias llevan `count: 0` y `artifacts: []` para que el front muestre el carril vacío.
 */
export interface ArtifactDefinitionsListResponse {
  totalArtifacts: number;
  /** Siempre 8: número fijo de fases del PDLC en la respuesta (`phases.length`). */
  totalPhases: number;
  phases: ArtifactDefinitionsByPhaseGroup[];
  filters: ArtifactDefinitionListFilters & {
    sortBy: ArtifactDefinitionSortField;
    sortOrder: 'asc' | 'desc';
  };
}

/** Filtros aplicables en `GET /artifact-definitions` (query string). */
export interface ArtifactDefinitionListFilters {
  /** Coincidencia exacta por `public_id`. */
  publicId?: string;
  initiativeType?: ArtifactInitiativeType;
  /** Coincidencia exacta (case-sensitive) con la columna `area`. */
  area?: string;
  /**
   * Query param `name`: subcadena sobre la columna del artefacto `name` (ej. `2.4. SDD`).
   * Case-insensitive; valor parametrizado.
   */
  name?: string;
}

export type ArtifactDefinitionSortField = 'fase' | 'name' | 'updatedAt' | 'createdAt' | 'id';

export interface ArtifactDefinitionListQuery extends ArtifactDefinitionListFilters {
  sortBy?: ArtifactDefinitionSortField;
  sortOrder?: 'asc' | 'desc';
}

export interface ArtifactDefinitionDeleteResponse {
  success: true;
  deleted: {
    publicId: string;
    name: string;
  };
  cascade: {
    artifactsUpdated: number;
    message: string;
  };
}
