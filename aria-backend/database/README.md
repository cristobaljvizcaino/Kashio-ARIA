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
