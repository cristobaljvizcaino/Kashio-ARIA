/**
 * Tipo de iniciativa al que aplica un artefacto del MAI canónico.
 *  - `Both`        → aplica tanto a iniciativas `New_Product` como a `Change`.
 *  - `Change`      → solo a iniciativas de mantenimiento / mejora.
 *  - `New_Product` → solo a iniciativas de producto nuevo (proyecto completo).
 *
 * Migrado en `database/migrations/005_artifact_definition_phase_organization.sql`
 * (antes existían los valores legacy `Run` / `Change` / `Both`).
 */
export type ArtifactInitiativeType = 'Both' | 'Change' | 'New_Product';

/**
 * Tipo de producto KashioOS al que aplica el artefacto.
 *  - `Offering`     → producto-servicio / plataforma.
 *  - `Sellable`     → producto comercializable a clientes finales.
 *  - `Non_Sellable` → producto interno / componente / infra.
 *
 * Un mismo artefacto puede aplicar a varios tipos a la vez (por eso es array).
 */
export type ArtifactProductType = 'Offering' | 'Sellable' | 'Non_Sellable';

/**
 * Estado del artefacto en el catálogo:
 *  - `1` → Activo   (default; se ofrece y se exige por el flujo PDLC).
 *  - `0` → Inactivo (queda en BD pero no se considera vigente).
 */
export type ArtifactStatus = 0 | 1;

/**
 * Modelo expuesto por la API. Se alinea con el esquema vigente:
 *   id                     BIGSERIAL PK interno
 *   public_id              UUID estable (clave de URL/API)
 *   phase                  1–8 (PDLC KashioOS)
 *   product_type           jsonb array de `ArtifactProductType`
 *   predecessor_public_ids jsonb array de UUIDs (`public_id` de cada predecesor).
 *                          El front consume estos UUIDs para resolver el detalle
 *                          del artefacto predecesor (no se guardan nombres).
 */
export interface ArtifactDefinition {
  id: number;
  publicId: string;
  phase: number;
  phaseLabel: string;
  name: string;
  initiativeType: ArtifactInitiativeType;
  productType: ArtifactProductType[];
  predecessorPublicIds: string[];
  description: string | null;
  mandatory: boolean;
  area: string;
  /** `1` = Activo, `0` = Inactivo. Default en BD: `1`. */
  status: ArtifactStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cuerpo POST. Indica **`phase`** (1–8) o **`phaseName`** (etiqueta KashioOS, ej. `Design`);
 * hace falta al menos uno. Si ambos van y no coinciden → 400.
 *
 * `predecessorPublicIds`: cada elemento puede ser un `publicId` (UUID) o un `name`
 * exacto de un artefacto existente; se normaliza al `publicId` (UUID) que se
 * almacena en BD.
 *
 * `initiativeType`: opcional en POST; si se envía debe ser **`Both`**, **`Change`**
 * o **`New_Product`** (mayúsculas indistintas; aceptamos `New_Product` /
 * `NEW_PRODUCT` / `new product`). Si se omite → **`Both`**.
 *
 * `productType`: opcional en POST; array (o string único, se normaliza a array)
 * de `Offering` / `Sellable` / `Non_Sellable`. Por defecto `[]`.
 */
export interface ArtifactDefinitionInput {
  phase?: number;
  /** @deprecated Usar `phase`. Si coexisten `phase` y `fase`, deben resolver al mismo 1–8. */
  fase?: unknown;
  /** Etiqueta de fase (misma que `phaseLabel` en respuesta), ej. `Backend Development`. */
  phaseName?: string;
  name: string;
  initiativeType?: ArtifactInitiativeType;
  productType?: ArtifactProductType[] | ArtifactProductType;
  predecessorPublicIds?: string[];
  description?: string | null;
  mandatory?: boolean;
  area?: string;
  /**
   * `1` (activo) o `0` (inactivo). Acepta también `true`/`false` por conveniencia;
   * se normaliza a 0/1 antes de persistir. Default en POST: `1` (activo).
   */
  status?: ArtifactStatus | boolean;
  publicId?: string;
}

/** Parámetros ya normalizados para INSERT (phase 1–8 resuelta; sin `phaseName`). */
export type ArtifactDefinitionInsertPayload = Omit<
  ArtifactDefinitionInput,
  'phaseName' | 'phase' | 'fase' | 'productType' | 'status'
> & {
  phase: number;
  productType?: ArtifactProductType[];
  /** Ya normalizado a 0/1 antes de tocar el repositorio. */
  status?: ArtifactStatus;
};

export type ArtifactDefinitionUpdate = Partial<
  Omit<
    ArtifactDefinition,
    | 'id'
    | 'publicId'
    | 'phaseLabel'
    | 'createdAt'
    | 'updatedAt'
    | 'initiativeType'
    | 'productType'
    | 'status'
  >
> & {
  initiativeType?: ArtifactInitiativeType;
  productType?: ArtifactProductType[] | ArtifactProductType;
  /** Acepta 0/1 o boolean en el body; el service lo normaliza a 0/1. */
  status?: ArtifactStatus | boolean;
  phaseName?: string;
  /** @deprecated Usar `phase`. */
  fase?: unknown;
};

/** Forma cruda devuelta por `pg` (snake_case y `id` puede llegar como string desde bigint). */
export interface ArtifactDefinitionRow {
  id: number | string;
  public_id: string;
  phase: number;
  name: string;
  initiative_type: string;
  product_type: string[] | null;
  predecessor_public_ids: string[] | null;
  description: string | null;
  mandatory: boolean;
  area: string | null;
  status: number;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

export interface ArtifactDefinitionsByPhaseGroup {
  phase: number;
  phaseLabel: string;
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
   * Query param `name`: subcadena sobre la columna del artefacto `name` (ej. `2.4. Mapa`).
   * Case-insensitive; valor parametrizado.
   */
  name?: string;
  /** Filtro de contención: artefactos cuyo `product_type` incluya este valor. */
  productType?: ArtifactProductType;
  /**
   * Filtro por status. `1` = activos, `0` = inactivos.
   * Si se omite en el endpoint de listado, el servicio aplica `1` por defecto.
   */
  status?: ArtifactStatus;
}

export type ArtifactDefinitionSortField = 'phase' | 'name' | 'updatedAt' | 'createdAt' | 'id';

export interface ArtifactDefinitionListQuery extends ArtifactDefinitionListFilters {
  sortBy?: ArtifactDefinitionSortField;
  sortOrder?: 'asc' | 'desc';
}

export interface ArtifactDefinitionDeleteResponse {
  success: true;
  softDeleted: true;
  artifact: {
    publicId: string;
    name: string;
    status: ArtifactStatus;
  };
}
