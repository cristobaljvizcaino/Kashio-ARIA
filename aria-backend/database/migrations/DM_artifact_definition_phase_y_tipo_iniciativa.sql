-- =============================================================================
-- DM — artifact_definition: columna fase → phase (inglés)
-- =============================================================================
-- Ejecutar UNA VEZ contra la base PostgreSQL de Karia/ARIA.
--
-- Incluye:
--   1) Renombrar columna legacy `fase` → `phase` (solo si aún existe `fase`).
--   2) Renombrar constraint CHECK 1..8 si sigue con nombre viejo.
--   3) Renombrar índice btree si sigue con nombre viejo.
--
-- NO toca initiative_type: sigue aceptando Run / Change / Both.
--
-- Aplicar:
--   psql "postgresql://usuario:pass@host:5432/bd" -f database/migrations/DM_artifact_definition_phase_y_tipo_iniciativa.sql
--
-- Idempotente: si la tabla ya tiene `phase`, los bloques no hacen nada.
-- =============================================================================

BEGIN;

-- (1) fase → phase
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'artifact_definition'
       AND column_name  = 'fase'
  ) THEN
    ALTER TABLE public.artifact_definition RENAME COLUMN fase TO phase;
  END IF;
END $$;

-- (2) Renombrar constraint CHECK 1..8 si sigue llamándose *_fase_check
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname    = 'artifact_definition_fase_check'
       AND conrelid   = 'public.artifact_definition'::regclass
  ) THEN
    ALTER TABLE public.artifact_definition
      RENAME CONSTRAINT artifact_definition_fase_check
      TO artifact_definition_phase_check;
  END IF;
END $$;

-- (3) Renombrar índice si sigue siendo idx_artdef_fase
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname  = 'public'
       AND c.relname  = 'idx_artdef_fase'
       AND c.relkind  = 'i'
  ) THEN
    ALTER INDEX public.idx_artdef_fase RENAME TO idx_artdef_phase;
  END IF;
END $$;

COMMIT;
