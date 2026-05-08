-- 003_artifact_definition_initiative_type_kashio.sql
--
-- Aligns artifact_definition.initiative_type with KashioOS-style values:
--   CHANGE | NEW_PRODUCT
-- Replaces legacy Run / Change / Both (see schemaV2.sql before this migration).
--
-- Apply after 002_rename_fase_to_phase.sql if used. Safe on fresh DBs that already
-- have CHANGE/NEW_PRODUCT only (UPDATE affects 0 rows; constraint swap still runs).
--
--   psql "$ConnectionString_Karia" -f database/migrations/003_artifact_definition_initiative_type_kashio.sql

BEGIN;

-- Map legacy enum-like values to the new pair (adjust if product needs a different rule).
UPDATE public.artifact_definition
   SET initiative_type = 'CHANGE'
 WHERE initiative_type IN ('Run', 'Change', 'Both');

ALTER TABLE public.artifact_definition
    DROP CONSTRAINT IF EXISTS artifact_definition_initiative_type_check;

ALTER TABLE public.artifact_definition
    ADD CONSTRAINT artifact_definition_initiative_type_check
    CHECK (
      (initiative_type)::text = ANY (
        ARRAY[
          ('CHANGE'::character varying)::text,
          ('NEW_PRODUCT'::character varying)::text
        ]
      )
    );

ALTER TABLE public.artifact_definition
    ALTER COLUMN initiative_type SET DEFAULT 'CHANGE';

COMMIT;
