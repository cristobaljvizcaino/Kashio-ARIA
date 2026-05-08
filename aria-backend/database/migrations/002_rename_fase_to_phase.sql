-- 002_rename_fase_to_phase.sql
--
-- Renames the legacy Spanish-named column `artifact_definition.fase` to `phase`
-- so the schema is fully consistent with the rest of the backend (English
-- identifiers in code, types and API contract).
--
-- Also renames the associated CHECK constraint and btree index. Idempotent: each
-- step is guarded so re-running on a database that already has `phase` is a
-- no-op. Wrap in a transaction so a partial failure rolls back cleanly.
--
-- Apply with:
--   psql "$ConnectionString_Karia" -f database/migrations/002_rename_fase_to_phase.sql
--
-- After this migration the API contract switches from `fase`/`faseName`/`faseLabel`
-- to `phase`/`phaseName`/`phaseLabel`. Coordinate the deploy of the backend code
-- with the execution of this script.

BEGIN;

-- 1) Rename the column itself.
ALTER TABLE public.artifact_definition
    RENAME COLUMN fase TO phase;

-- 2) Rename the CHECK constraint (1..8). PostgreSQL keeps the constraint name
--    when the column is renamed, so we update it explicitly to keep things
--    legible. Guarded with a DO block so the script doesn't fail if the
--    constraint was already renamed in a previous run.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'artifact_definition_fase_check'
           AND conrelid = 'public.artifact_definition'::regclass
    ) THEN
        ALTER TABLE public.artifact_definition
            RENAME CONSTRAINT artifact_definition_fase_check
            TO artifact_definition_phase_check;
    END IF;
END $$;

-- 3) Rename the btree index used by listing/order-by queries.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM pg_class
         WHERE relname = 'idx_artdef_fase'
           AND relkind = 'i'
    ) THEN
        ALTER INDEX public.idx_artdef_fase RENAME TO idx_artdef_phase;
    END IF;
END $$;

COMMIT;
