# database/

DDL PostgreSQL del backend ARIA. Estos archivos **no** se incluyen en la imagen Docker (`.dockerignore` los excluye); aplicalos manualmente con `psql` o tu herramienta de migración.

| Archivo | Contenido |
|---------|-----------|
| `schemaV1.sql` | Esquema histórico (legacy). |
| `schemaV2.sql` | Esquema vigente: `initiative`, `intake_request`, `artifact_definition`, `library_file`. |

**Aplicar a una BD nueva:**

```bash
psql "$ConnectionString_Karia" -f database/schemaV2.sql
```

**BD totalmente vacía:** `schemaV2.sql` define triggers que llaman a `update_updated_at_column()` pero no crean esa función en el archivo. Creala antes (por ejemplo con el bloque inicial del DDL en `docs/DATABASE_AUDIT.md`) o aplicá ese fragmento completo y luego alineá con este dump.
