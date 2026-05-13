-- =============================================================================
-- Migracion 006 - product_type en public.initiative + filtro de artefactos
--                 por productType en el detalle de iniciativa
-- =============================================================================
-- Proyecto:   ARIA 2.0 (KashioOS)
-- Fecha:      2026-05-12
-- Autor:      Backend ARIA
--
-- Proposito
-- ---------
--   Cada iniciativa que se sincroniza desde KashioOS aplica a UN tipo de
--   producto: Offering, Sellable o Non_Sellable. Hasta esta migracion ARIA
--   no guardaba ese dato y el detalle GET /initiatives/:publicId mostraba
--   TODOS los artefactos activos de cada fase. Esto pollucionaba la vista:
--   p.ej. una iniciativa para un producto "Non_Sellable" recibia artefactos
--   marketing/comerciales (One-pager, Pitch Deck, ICP, Brochure, etc.) que
--   solo aplican a "Sellable".
--
--   Esta migracion:
--     1) Agrega la columna `product_type` (varchar(20)) a `public.initiative`.
--     2) Agrega CHECK que solo permite ('Offering', 'Sellable', 'Non_Sellable').
--     3) Crea indice btree para filtros por tipo de producto.
--     4) Deja la columna NULLABLE (sin default) para no romper iniciativas
--        ya sincronizadas: el codigo del backend trata el valor NULL como
--        "no filtrar por productType" hasta que se haga un re-sync con el
--        nuevo body { publicId, productType }.
--
-- Caracteristicas
-- ---------------
--   - Idempotente: usa IF NOT EXISTS / DROP IF EXISTS antes de CREATE.
--   - NO destructiva: agrega una columna nullable; las filas existentes
--     quedan con product_type = NULL hasta que el front haga el siguiente
--     sync con el body nuevo.
--
-- Aplicacion
-- ----------
--   psql "$ConnectionString_Karia" -f database/migrations/006_initiative_product_type.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Agregar columna product_type
-- -----------------------------------------------------------------------------
ALTER TABLE public.initiative
    ADD COLUMN IF NOT EXISTS product_type varchar(20) NULL;

-- -----------------------------------------------------------------------------
-- 2. Recrear el CHECK por si la columna ya existia con otra forma
-- -----------------------------------------------------------------------------
ALTER TABLE public.initiative
    DROP CONSTRAINT IF EXISTS initiative_product_type_check;

ALTER TABLE public.initiative
    ADD CONSTRAINT initiative_product_type_check
    CHECK (
        product_type IS NULL
        OR product_type IN ('Offering', 'Sellable', 'Non_Sellable')
    );

-- -----------------------------------------------------------------------------
-- 3. Indice btree para filtros / dashboards por tipo de producto
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_initiative_product_type
    ON public.initiative USING btree (product_type);

-- -----------------------------------------------------------------------------
-- 4. Comentarios explicativos
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.initiative.product_type IS
    'Tipo de producto de la iniciativa (Offering | Sellable | Non_Sellable). '
    'Lo envia el front en POST /initiatives/sync junto con publicId. '
    'Al renderizar el detalle (GET /initiatives/:publicId) ARIA filtra los '
    'artefactos de cada fase por: artifact_definition.product_type @> '
    '[initiative.product_type] AND status = 1 AND initiative_type IN (Both, '
    '<equivalente del initiative.initiative_type>). Si el valor es NULL '
    '(iniciativas viejas que aun no se han re-sincronizado con el nuevo body) '
    'el detalle no aplica el filtro y muestra todos los artefactos activos.';

-- -----------------------------------------------------------------------------
-- 5. Validacion final
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_col_exists       boolean;
    v_constraint_exists boolean;
    v_index_exists     boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'initiative'
          AND column_name  = 'product_type'
    ) INTO v_col_exists;

    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'initiative_product_type_check'
    ) INTO v_constraint_exists;

    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname  = 'idx_initiative_product_type'
    ) INTO v_index_exists;

    IF NOT v_col_exists THEN
        RAISE EXCEPTION 'Migracion 006: la columna product_type no se creo';
    END IF;
    IF NOT v_constraint_exists THEN
        RAISE EXCEPTION 'Migracion 006: el CHECK initiative_product_type_check no se creo';
    END IF;
    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'Migracion 006: el indice idx_initiative_product_type no se creo';
    END IF;
END $$;

COMMIT;
