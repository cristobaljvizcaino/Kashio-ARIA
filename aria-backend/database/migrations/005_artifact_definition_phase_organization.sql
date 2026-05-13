-- =============================================================================
-- Migracion 005 - Reorganizacion canonica de public.artifact_definition
-- =============================================================================
-- Proyecto:   ARIA 2.0 (KashioOS)
-- Fecha:      2026-05-12
-- Autor:      Backend ARIA
--
-- Proposito
-- ---------
--   1) Reemplazar el catalogo legado basado en `gate` (G0..G5) por la version
--      canonica basada en `phase` (1..8) del MAI v2.1.0.0.
--   2) Migrar los valores de la columna `initiative_type`:
--          'Run'   -> 'New_Product'
--          'Change'-> 'Change'        (sin cambios)
--          'Both'  -> 'Both'          (sin cambios)
--      Y reemplazar el CHECK por: ('Both', 'Change', 'New_Product').
--   3) Anadir la columna `product_type` (jsonb) con los valores
--      'Offering', 'Sellable' y 'Non_Sellable' (multi-valor por artefacto).
--   4) Renombrar `predecessor_names` -> `predecessor_public_ids` (jsonb) y
--      almacenar SIEMPRE los `public_id` (UUID) de los artefactos predecesores
--      en lugar de sus nombres. El front consume esas UUIDs para resolver
--      la informacion del predecesor.
--   5) Anadir la columna `status` (int2) con la convencion:
--          1 = Activo   (default)
--          0 = Inactivo
--      Permite soft-delete: el endpoint DELETE cambia status a 0 sin borrar la fila.
--   6) Repoblar la tabla con los 36 artefactos canonicos definidos en:
--          - docs/inventario_artefactos_aria_markdown.md
--          - docs/Resumen_Documentos_ARIA_v1.0.1.0.md
--      con la convencion de nombre `<phase>.<orden>. <nombre canonico>`
--      (zero-pad a 2 digitos cuando la fase tiene mas de 9 artefactos,
--      ej. Phase 7 usa 7.01 .. 7.26; Phase 2/3/5 usan 2.1, 3.1, 5.1).
--
-- Caracteristicas
-- ---------------
--   - Idempotente: usa DROP IF EXISTS / CREATE TABLE / INSERT.
--   - DESTRUCTIVO sobre los datos antiguos de artifact_definition (tanto la
--     forma V1 con `gate`/`predecessor_ids` como la forma V2 con
--     `phase`/`predecessor_names`). El catalogo es regenerable desde el MAI.
--   - Resolucion de predecesores en 2 pasos para no depender de UUIDs hardcoded:
--       Paso A: insertamos los 36 artefactos guardando los nombres de los
--               predecesores en `predecessor_public_ids` (de forma temporal).
--       Paso B: con un UPDATE bulk reemplazamos cada nombre por el `public_id`
--               UUID correspondiente.
--
-- Aplicacion
-- ----------
--   psql "$ConnectionString_Karia" -f database/migrations/005_artifact_definition_phase_organization.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Recreacion limpia de la tabla con el esquema canonico (V2 + product_type
--    + predecessor_public_ids).
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.artifact_definition CASCADE;

CREATE TABLE public.artifact_definition (
    id                      bigserial    NOT NULL,
    public_id               uuid         DEFAULT gen_random_uuid() NOT NULL,
    phase                   int2         NOT NULL,
    "name"                  varchar(500) NOT NULL,
    initiative_type         varchar(20)  DEFAULT 'Both'::varchar NULL,
    product_type            jsonb        DEFAULT '[]'::jsonb NULL,
    predecessor_public_ids  jsonb        DEFAULT '[]'::jsonb NULL,
    description             text         NULL,
    mandatory               bool         DEFAULT false NULL,
    area                    varchar(50)  DEFAULT 'Producto'::varchar NULL,
    status                  int2         NOT NULL DEFAULT 1,
    created_at              timestamptz  DEFAULT now() NULL,
    updated_at              timestamptz  DEFAULT now() NULL,
    CONSTRAINT artifact_definition_pkey            PRIMARY KEY (id),
    CONSTRAINT artifact_definition_public_id_key   UNIQUE (public_id),
    CONSTRAINT artifact_definition_name_key        UNIQUE ("name"),
    CONSTRAINT artifact_definition_phase_check     CHECK (phase BETWEEN 1 AND 8),
    CONSTRAINT artifact_definition_initiative_type_check CHECK (
        (initiative_type)::text = ANY (ARRAY[
            'Both'::text,
            'Change'::text,
            'New_Product'::text
        ])
    ),
    CONSTRAINT artifact_definition_product_type_check CHECK (
        product_type IS NULL OR jsonb_typeof(product_type) = 'array'
    ),
    CONSTRAINT artifact_definition_predecessor_public_ids_check CHECK (
        predecessor_public_ids IS NULL OR jsonb_typeof(predecessor_public_ids) = 'array'
    ),
    CONSTRAINT artifact_definition_status_check CHECK (status IN (0, 1))
);

CREATE INDEX idx_artdef_phase                  ON public.artifact_definition USING btree (phase);
CREATE INDEX idx_artdef_type                   ON public.artifact_definition USING btree (initiative_type);
CREATE INDEX idx_artdef_area                   ON public.artifact_definition USING btree (area);
CREATE INDEX idx_artdef_status                 ON public.artifact_definition USING btree (status);
CREATE INDEX idx_artdef_product_type           ON public.artifact_definition USING gin   (product_type);
CREATE INDEX idx_artdef_predecessor_public_ids ON public.artifact_definition USING gin   (predecessor_public_ids);

COMMENT ON COLUMN public.artifact_definition.status IS
    'Activo/inactivo del artefacto en el catalogo. 1 = Activo (default), 0 = Inactivo/soft-delete.';

CREATE TRIGGER update_artdef_updated_at
    BEFORE UPDATE ON public.artifact_definition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. Insercion canonica de los 36 artefactos (MAI v2.1.0.0).
--
--    Convencion de nombre: "<phase>.<orden>. <nombre canonico>"
--      - Phase 2 (5 items)   -> "2.1.", "2.2.", ... "2.5."
--      - Phase 3 (4 items)   -> "3.1.", ... "3.4."
--      - Phase 5 (1 item)    -> "5.1."
--      - Phase 7 (26 items)  -> "7.01.", "7.02.", ... "7.26." (zero-pad a 2 digitos)
--
--    `predecessor_public_ids` se rellena temporalmente con NOMBRES; el paso 3
--    convierte cada nombre a su `public_id` UUID correspondiente.
-- -----------------------------------------------------------------------------

-- =========================================================
-- Phase 2 - Analysis
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (2, '2.1. PRD (Product Requirements Document)',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '[]'::jsonb,
        'Documento de requerimientos del producto. Insumos externos: Market Research, Service Blueprint, Benchmark, Regulaciones, Tendencias, Vision de Producto.',
        true,
        'Producto'),

    (2, '2.2. (USM) Epics & Release Stories Map',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)"]'::jsonb,
        'Mapa de epicas y historias de usuario por release. Predecesor: PRD.',
        true,
        'SDLC'),

    (2, '2.3. SRS / Spec Funcional + NFR',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.2. (USM) Epics & Release Stories Map"]'::jsonb,
        'Software Requirements Specification + NFR. Predecesores: PRD, USM (BPRD opcional).',
        true,
        'SDLC'),

    (2, '2.4. Mapa de Capacidades',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.2. (USM) Epics & Release Stories Map"]'::jsonb,
        'Catalogo de capacidades del producto. Predecesores: PRD, USM (BPRD opcional).',
        true,
        'Producto Tecnico'),

    (2, '2.5. Funcionalidades (catalogo)',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.2. (USM) Epics & Release Stories Map","2.3. SRS / Spec Funcional + NFR"]'::jsonb,
        'Catalogo funcional. Predecesores: PRD, USM, SRS (BPRD opcional).',
        true,
        'Producto Tecnico');

-- =========================================================
-- Phase 3 - Design
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (3, '3.1. SAD',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.2. (USM) Epics & Release Stories Map","2.3. SRS / Spec Funcional + NFR"]'::jsonb,
        'Software Architecture Document. Predecesores: PRD, USM, SRS.',
        true,
        'SDLC'),

    (3, '3.2. SDD',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.2. (USM) Epics & Release Stories Map","2.3. SRS / Spec Funcional + NFR","3.1. SAD"]'::jsonb,
        'Software Design Document. Predecesores: PRD, USM, SRS, SAD.',
        true,
        'SDLC'),

    (3, '3.3. Arquitectura (C4 + ADRs)',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","3.1. SAD"]'::jsonb,
        'Diagramas C4 + ADRs. Predecesores: PRD, SAD.',
        true,
        'Producto Tecnico'),

    (3, '3.4. Flujos (secuencia / BPMN)',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.2. (USM) Epics & Release Stories Map","2.3. SRS / Spec Funcional + NFR","3.1. SAD","3.2. SDD"]'::jsonb,
        'Diagramas de secuencia y BPMN. Predecesores: PRD, USM, SRS, SAD, SDD.',
        true,
        'Producto Tecnico');

-- =========================================================
-- Phase 5 - Backend Development
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (5, '5.1. APIs / Contratos (OpenAPI/AsyncAPI)',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.3. SRS / Spec Funcional + NFR","3.1. SAD","3.2. SDD"]'::jsonb,
        'Contratos API (REST OpenAPI / AsyncAPI). Predecesores: SRS, SAD, SDD.',
        true,
        'Producto Tecnico');

-- =========================================================
-- Phase 7 - Deployment / Nivel 1 (7.01 - 7.10)
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (7, '7.01. Product Marketing Strategy',
        'New_Product',
        '["Offering","Sellable"]'::jsonb,
        '[]'::jsonb,
        'Estrategia de marketing del producto. Insumos externos: Competitive Landscape, Tendencias, Regulaciones.',
        true,
        'Producto - Marketing'),

    (7, '7.02. Impacto COGS',
        'Both',
        '["Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)"]'::jsonb,
        'Impacto en COGS. Predecesores: PRD, Capacidades, Funcionalidades, APIs.',
        true,
        'Finanzas'),

    (7, '7.03. Reportes financieros requeridos',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)"]'::jsonb,
        'Reportes financieros requeridos. Predecesores: PRD, Capacidades, Funcionalidades, APIs.',
        true,
        'Finanzas'),

    (7, '7.04. Runbook N1',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)"]'::jsonb,
        'Runbook operativo Nivel 1. Predecesores: PRD, Funcionalidades, Flujos.',
        true,
        'Operaciones'),

    (7, '7.05. Manejo de Objeciones',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.5. Funcionalidades (catalogo)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)"]'::jsonb,
        'Manejo de objeciones comerciales. Predecesores: Funcionalidades, APIs.',
        false,
        'Comercial'),

    (7, '7.06. Guia de Usuario',
        'New_Product',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)"]'::jsonb,
        'Guia de usuario final. Predecesores: PRD, Capacidades, Funcionalidades.',
        false,
        'Cliente - Operaciones'),

    (7, '7.07. One-pager',
        'New_Product',
        '["Offering","Sellable"]'::jsonb,
        '["2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.3. Arquitectura (C4 + ADRs)"]'::jsonb,
        'One-pager comercial. Predecesores: Capacidades, Funcionalidades, Arquitectura.',
        false,
        'Comercial'),

    (7, '7.08. Pitch Deck (Presentacion de Producto)',
        'New_Product',
        '["Offering","Sellable"]'::jsonb,
        '["2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)"]'::jsonb,
        'Pitch Deck / Presentacion de producto. Predecesores: Funcionalidades, Flujos.',
        false,
        'Comercial'),

    (7, '7.09. Brochure Producto',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)"]'::jsonb,
        'Brochure comercial. Predecesores: Capacidades, Funcionalidades, Flujos.',
        false,
        'Comercial'),

    (7, '7.10. Manual de Producto (operacion + reglas)',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","3.3. Arquitectura (C4 + ADRs)"]'::jsonb,
        'Manual de producto (operacion + reglas). Predecesores: Capacidades, Funcionalidades, Flujos, Arquitectura.',
        false,
        'Comercial - Operaciones');

-- =========================================================
-- Phase 7 - Deployment / Nivel 2 (7.11 - 7.20)
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (7, '7.11. ICP & Segmentos objetivo',
        'New_Product',
        '["Offering","Sellable"]'::jsonb,
        '["7.01. Product Marketing Strategy"]'::jsonb,
        'ICP y segmentos objetivo. Predecesor: Product Marketing Strategy.',
        false,
        'Producto - Marketing'),

    (7, '7.12. Playbook de Ventas',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","7.05. Manejo de Objeciones"]'::jsonb,
        'Playbook de ventas. Predecesores: Funcionalidades, Flujos, Manejo de Objeciones.',
        false,
        'Comercial'),

    (7, '7.13. Runbook N2',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)","7.04. Runbook N1"]'::jsonb,
        'Runbook operativo Nivel 2. Predecesores: Funcionalidades, Flujos, APIs, Runbook N1.',
        true,
        'Operaciones'),

    (7, '7.14. Exposicion de riesgo (financiero/fraude)',
        'New_Product',
        '["Offering","Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)","7.04. Runbook N1"]'::jsonb,
        'Exposicion de riesgo financiero / fraude. Predecesores: PRD, Capacidades, Funcionalidades, Flujos, APIs, Runbook N1.',
        true,
        'Finanzas'),

    (7, '7.15. Quick-start Guide',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","7.04. Runbook N1"]'::jsonb,
        'Quick-start guide. Predecesores: PRD, Capacidades, Funcionalidades, Flujos, Runbook N1.',
        false,
        'Cliente'),

    (7, '7.16. How-tos',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","7.04. Runbook N1"]'::jsonb,
        'How-tos para clientes. Predecesores: PRD, Capacidades, Funcionalidades, Flujos, Runbook N1.',
        false,
        'Cliente'),

    (7, '7.17. Training: Onboarding / Success',
        'New_Product',
        '["Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","5.1. APIs / Contratos (OpenAPI/AsyncAPI)","3.4. Flujos (secuencia / BPMN)","7.04. Runbook N1","7.06. Guia de Usuario"]'::jsonb,
        'Training de onboarding y success. Predecesores: PRD, Capacidades, APIs, Flujos, Runbook N1, Guia de Usuario.',
        false,
        'Operaciones'),

    (7, '7.18. Documentacion Tecnica Cliente (Readme/Portal)',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","7.04. Runbook N1"]'::jsonb,
        'Documentacion tecnica del cliente (README / portal). Predecesores: PRD, Capacidades, Funcionalidades, Flujos, Runbook N1.',
        false,
        'Producto Tecnico'),

    (7, '7.19. Casos de Uso',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","7.11. ICP & Segmentos objetivo"]'::jsonb,
        'Casos de uso. Predecesores: Capacidades, Funcionalidades, Flujos, ICP.',
        false,
        'Comercial - Operaciones'),

    (7, '7.20. Ficha Funcional',
        'New_Product',
        '["Sellable","Non_Sellable"]'::jsonb,
        '["7.01. Product Marketing Strategy","2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)","3.3. Arquitectura (C4 + ADRs)","7.11. ICP & Segmentos objetivo"]'::jsonb,
        'Ficha funcional del producto. Predecesores: Product Marketing Strategy, Capacidades, Funcionalidades, Flujos, APIs, Arquitectura, ICP.',
        false,
        'Producto');

-- =========================================================
-- Phase 7 - Deployment / Nivel 3 (7.21 - 7.23)
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (7, '7.21. Runbook N3',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","3.1. SAD","7.13. Runbook N2"]'::jsonb,
        'Runbook operativo Nivel 3. Predecesores: PRD, SAD, Runbook N2.',
        true,
        'Operaciones'),

    (7, '7.22. Contingencias por rail/territorio',
        'New_Product',
        '["Offering","Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","2.4. Mapa de Capacidades","5.1. APIs / Contratos (OpenAPI/AsyncAPI)","3.4. Flujos (secuencia / BPMN)","7.04. Runbook N1","7.13. Runbook N2"]'::jsonb,
        'Contingencias por rail / territorio. Predecesores: PRD, Capacidades, APIs, Flujos, Runbook N1, Runbook N2.',
        true,
        'Operaciones'),

    (7, '7.23. Killswitch & Rollback',
        'Both',
        '["Offering","Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","3.1. SAD","7.21. Runbook N3"]'::jsonb,
        'Killswitch & Rollback. Predecesores: PRD, SAD, Runbook N3.',
        true,
        'Operaciones');

-- =========================================================
-- Phase 7 - Deployment / Nivel 4 (7.24 - 7.26)
-- =========================================================
INSERT INTO public.artifact_definition
    (phase, "name", initiative_type, product_type, predecessor_public_ids, description, mandatory, area)
VALUES
    (7, '7.24. Criterios de operacion estable',
        'New_Product',
        '["Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","3.1. SAD","3.3. Arquitectura (C4 + ADRs)","7.04. Runbook N1","7.13. Runbook N2","7.21. Runbook N3","7.22. Contingencias por rail/territorio","7.23. Killswitch & Rollback"]'::jsonb,
        'Criterios de operacion estable. Predecesores: PRD, SAD, Arquitectura, Runbook N1/N2/N3, Contingencias, Killswitch & Rollback.',
        true,
        'Operaciones'),

    (7, '7.25. Checklist de adopcion por area',
        'New_Product',
        '["Sellable","Non_Sellable"]'::jsonb,
        '["2.1. PRD (Product Requirements Document)","7.24. Criterios de operacion estable","7.04. Runbook N1","7.13. Runbook N2","7.21. Runbook N3","7.22. Contingencias por rail/territorio","7.23. Killswitch & Rollback","7.06. Guia de Usuario","7.17. Training: Onboarding / Success"]'::jsonb,
        'Checklist de adopcion por area. Predecesores: PRD, Criterios de operacion estable, Runbook N1/N2/N3, Contingencias, Killswitch & Rollback, Guia de Usuario, Training.',
        false,
        'Operaciones'),

    (7, '7.26. General de Producto (Overview)',
        'New_Product',
        '["Sellable"]'::jsonb,
        '["2.4. Mapa de Capacidades","2.5. Funcionalidades (catalogo)","3.4. Flujos (secuencia / BPMN)","5.1. APIs / Contratos (OpenAPI/AsyncAPI)","7.01. Product Marketing Strategy","3.3. Arquitectura (C4 + ADRs)"]'::jsonb,
        'General de producto (overview). Predecesores: Capacidades, Funcionalidades, Flujos, APIs, Product Marketing Strategy, Arquitectura.',
        false,
        'Producto');

-- -----------------------------------------------------------------------------
-- 3. Resolucion de predecesores: nombre canonico -> public_id (UUID).
--
--    En el paso 2 guardamos los nombres temporales en `predecessor_public_ids`.
--    Aqui, en una unica sentencia, los reemplazamos por los `public_id` de los
--    artefactos correspondientes (manteniendo el orden original con WITH
--    ORDINALITY). Si alguna referencia no resuelve, abortamos la migracion.
-- -----------------------------------------------------------------------------

WITH resolved AS (
    SELECT
        a.id AS art_id,
        COALESCE(
            (
                SELECT jsonb_agg(p.public_id::text ORDER BY x.ord)
                  FROM jsonb_array_elements_text(a.predecessor_public_ids)
                       WITH ORDINALITY AS x(pred_name, ord)
                  JOIN public.artifact_definition p ON p."name" = x.pred_name
            ),
            '[]'::jsonb
        ) AS resolved_ids,
        (
            SELECT COUNT(*)
              FROM jsonb_array_elements_text(a.predecessor_public_ids) AS y(pred_name)
             WHERE NOT EXISTS (
                 SELECT 1
                   FROM public.artifact_definition p
                  WHERE p."name" = y.pred_name
             )
        ) AS unresolved_count
      FROM public.artifact_definition a
)
UPDATE public.artifact_definition a
   SET predecessor_public_ids = r.resolved_ids
  FROM resolved r
 WHERE a.id = r.art_id
   AND r.unresolved_count = 0;

-- Si quedo algun predecesor sin resolver -> abortar.
DO $$
DECLARE
    v_unresolved int;
BEGIN
    SELECT COUNT(*) INTO v_unresolved
      FROM public.artifact_definition a,
           LATERAL jsonb_array_elements_text(a.predecessor_public_ids) AS x(val)
     WHERE NOT (val ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    IF v_unresolved > 0 THEN
        RAISE EXCEPTION
            'Migracion 005: % predecesor(es) no se resolvieron a public_id. Revisar nombres canonicos en el paso 2.',
            v_unresolved;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Verificacion final (defensiva). Si algo no cuadra hacemos ROLLBACK.
--    Las fases canonicas son 5 (P2) + 4 (P3) + 1 (P5) + 26 (P7) = 36.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_total int;
    v_phase2 int;
    v_phase3 int;
    v_phase5 int;
    v_phase7 int;
    v_active int;
BEGIN
    SELECT COUNT(*) INTO v_total  FROM public.artifact_definition;
    SELECT COUNT(*) INTO v_phase2 FROM public.artifact_definition WHERE phase = 2;
    SELECT COUNT(*) INTO v_phase3 FROM public.artifact_definition WHERE phase = 3;
    SELECT COUNT(*) INTO v_phase5 FROM public.artifact_definition WHERE phase = 5;
    SELECT COUNT(*) INTO v_phase7 FROM public.artifact_definition WHERE phase = 7;
    SELECT COUNT(*) INTO v_active FROM public.artifact_definition WHERE status = 1;

    IF v_total <> 36 THEN
        RAISE EXCEPTION 'Migracion 005: total inesperado de artefactos (% != 36)', v_total;
    END IF;
    IF v_phase2 <> 5 OR v_phase3 <> 4 OR v_phase5 <> 1 OR v_phase7 <> 26 THEN
        RAISE EXCEPTION 'Migracion 005: distribucion por fase incorrecta (P2=%, P3=%, P5=%, P7=%)',
            v_phase2, v_phase3, v_phase5, v_phase7;
    END IF;
    IF v_active <> 36 THEN
        RAISE EXCEPTION 'Migracion 005: se esperaba que los 36 artefactos quedaran con status = 1 (activos), pero solo % lo estan', v_active;
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- Fin Migracion 005
-- =============================================================================
