-- =============================================================================
-- DM — initiative: rediseñar para sincronización desde KashioOS
-- =============================================================================
-- La tabla `initiative` venía del modelo legacy ARIA v1 (id varchar, current_gate_id G0..G5,
-- artifacts jsonb embebido). Ahora la fuente de verdad de las iniciativas es **KashioOS**:
-- ARIA solo guarda un snapshot ligero por `public_id` (= id UUID de KashioOS) que se
-- refresca con `POST /karia-svc/v2/initiatives/sync/:publicId`.
--
-- Aplicar:
--   psql "..." -f database/migrations/004_initiative_kashio_sync.sql
--
-- DESTRUCTIVO: elimina la tabla `initiative` actual y la vuelve a crear.
-- Ejecutar solo si los datos antiguos no son necesarios (la migración asume que
-- KashioOS es la fuente de verdad y se puede re-sincronizar bajo demanda).
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS public.initiative CASCADE;

CREATE TABLE public.initiative (
    id                    bigserial      NOT NULL,
    public_id             uuid           NOT NULL,
    code                  varchar(50)    NULL,
    title                 varchar(500)   NOT NULL,
    description           text           NULL,
    status                varchar(50)    NULL,
    current_phase         int2           NULL,
    initiative_type       varchar(20)    NULL,
    product_name          varchar(200)   NULL,
    quarter_name          varchar(50)    NULL,
    quarter_year          int2           NULL,
    estimated_start_date  date           NULL,
    estimated_end_date    date           NULL,
    intake_origin_code    varchar(50)    NULL,
    phases                jsonb          DEFAULT '[]'::jsonb NULL,
    synced_at             timestamptz    DEFAULT now() NOT NULL,
    created_at            timestamptz    DEFAULT now() NOT NULL,
    updated_at            timestamptz    DEFAULT now() NOT NULL,
    CONSTRAINT initiative_pkey PRIMARY KEY (id),
    CONSTRAINT initiative_public_id_key UNIQUE (public_id),
    CONSTRAINT initiative_current_phase_check
        CHECK (current_phase IS NULL OR (current_phase BETWEEN 1 AND 8)),
    CONSTRAINT initiative_initiative_type_check
        CHECK (
            initiative_type IS NULL
            OR initiative_type IN ('CHANGE', 'NEW_PRODUCT')
        )
);

CREATE INDEX idx_initiative_status        ON public.initiative USING btree (status);
CREATE INDEX idx_initiative_type          ON public.initiative USING btree (initiative_type);
CREATE INDEX idx_initiative_current_phase ON public.initiative USING btree (current_phase);
CREATE INDEX idx_initiative_quarter       ON public.initiative USING btree (quarter_year, quarter_name);
CREATE INDEX idx_initiative_code          ON public.initiative USING btree (code);

CREATE TRIGGER update_initiative_updated_at BEFORE UPDATE
    ON public.initiative FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
