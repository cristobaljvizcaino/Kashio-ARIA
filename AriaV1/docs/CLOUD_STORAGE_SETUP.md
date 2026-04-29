# Configuración de Cloud Storage - ARIA

## 📦 Buckets Creados

| Bucket | Propósito | Público | Región |
|--------|-----------|---------|--------|
| `kashio-aria-artifacts` | Artefactos generados (PDFs, DOCx) | ❌ Privado | us-central1 |
| `kashio-aria-templates` | Templates y plantillas reutilizables | ✅ Público (read-only) | us-central1 |

---

## 🏗️ Estructura de Directorios

### kashio-aria-artifacts/
```
kashio-aria-artifacts/
├── IDPRD-001/                    # Por iniciativa
│   ├── ART-001/                  # Por artefacto
│   │   ├── v1.0.0.pdf           # Versiones
│   │   ├── v1.1.0.pdf
│   │   └── v2.0.0.pdf
│   ├── ART-002/
│   │   └── v1.0.0.pdf
│   └── brm/                      # Documentos BRM
│       └── brm-documento.docx
├── IDPRD-002/
│   └── ...
└── backups/                      # Backups automáticos
    └── 2026-01-15-export.sql
```

### kashio-aria-templates/
```
kashio-aria-templates/
├── templates/
│   ├── brm-template.docx        # Template de BRM
│   ├── ficha-funcional.docx     # Ficha funcional
│   ├── apis-spec-template.md    # API specifications
│   └── playbook-template.pdf    # Playbook comercial
├── images/
│   └── logos/
│       └── kashio-logo.svg
└── fonts/
    └── inter/
```

---

## 🔐 Permisos y Acceso

### Service Account

Crear service account para acceso programático:

```bash
# Crear service account
gcloud iam service-accounts create aria-storage-sa \
  --display-name="ARIA Storage Service Account" \
  --project=kashio-squad-nova

# Otorgar permisos de Storage Object Admin
gcloud projects add-iam-policy-binding kashio-squad-nova \
  --member="serviceAccount:aria-storage-sa@kashio-squad-nova.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Crear key para el service account
gcloud iam service-accounts keys create ~/aria-storage-key.json \
  --iam-account=aria-storage-sa@kashio-squad-nova.iam.gserviceaccount.com
```

### Configurar en Aplicación

```typescript
// En backend o Edge Function
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'kashio-squad-nova',
  keyFilename: './aria-storage-key.json' // O usar GOOGLE_APPLICATION_CREDENTIALS
});
```

### Para Frontend (Browser)

El frontend no puede acceder directamente a Cloud Storage por seguridad. Debe:
1. Solicitar signed URL al backend
2. Usar la signed URL para upload/download

```typescript
// Frontend pide signed URL al backend
const response = await fetch('/api/storage/get-upload-url', {
  method: 'POST',
  body: JSON.stringify({ initiativeId, artifactId, version })
});

const { signedUrl } = await response.json();

// Upload usando signed URL
await fetch(signedUrl, {
  method: 'PUT',
  body: pdfBlob,
  headers: { 'Content-Type': 'application/pdf' }
});
```

---

## 🚀 Uso desde ARIA Generation

### Flujo de Generación + Upload

```typescript
// src/views/Generation.tsx

import { generateArtifactContent } from '../services/geminiService';
import { uploadArtifact, getArtifactSignedUrl } from '../services/storageService';

async function handleGenerateAndSave(
  artifactName: string,
  gateLabel: string,
  initiativeId: string,
  artifactId: string
) {
  try {
    // 1. Generar contenido con Gemini
    const content = await generateArtifactContent(artifactName, gateLabel);
    
    // 2. Convertir contenido a PDF (usando jsPDF o similar)
    const pdfBlob = await convertToPDF(content);
    
    // 3. Upload a Cloud Storage
    const url = await uploadArtifact(pdfBlob, initiativeId, artifactId, '1.0.0');
    
    // 4. Guardar URL en base de datos (cuando esté implementada)
    await saveArtifactRecord({
      id: artifactId,
      initiativeId,
      name: artifactName,
      gate: gateLabel,
      version: '1.0.0',
      storageUrl: url,
      status: 'ACTIVE',
      generatedBy: 'ARIA',
      createdAt: new Date()
    });
    
    console.log('✅ Artifact generated and uploaded:', url);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Helper: Convert markdown/text to PDF
async function convertToPDF(content: string): Promise<Blob> {
  // TODO: Implementar conversión a PDF
  // Opciones: jsPDF, pdfmake, o enviar a backend con puppeteer
  const blob = new Blob([content], { type: 'application/pdf' });
  return blob;
}
```

---

## 🔄 Lifecycle Policies

Configurar políticas de lifecycle para optimizar costos:

```bash
# Crear archivo lifecycle.json
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "NEARLINE"
        },
        "condition": {
          "age": 90,
          "matchesPrefix": ["IDPRD-"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "ARCHIVE"
        },
        "condition": {
          "age": 365
        }
      },
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 2555,
          "matchesPrefix": ["backups/"]
        }
      }
    ]
  }
}
EOF

# Aplicar lifecycle policy
gcloud storage buckets update gs://kashio-aria-artifacts \
  --lifecycle-file=lifecycle.json
```

**Reglas**:
- 📅 **90 días**: Mover a NEARLINE (acceso menos frecuente, más barato)
- 📅 **365 días**: Mover a ARCHIVE (archival, muy barato)
- 🗑️ **7 años**: Eliminar backups antiguos

---

## 💰 Costos Estimados

| Storage Class | Costo/GB/mes | Use Case |
|---------------|--------------|----------|
| **STANDARD** | $0.020 | Artefactos recientes (<90 días) |
| **NEARLINE** | $0.010 | Artefactos antiguos (90-365 días) |
| **ARCHIVE** | $0.004 | Archival (+365 días) |

**Proyección**:
- 500 artefactos/año × 2MB promedio = 1GB/año
- Costo año 1: $0.24/año (despreciable)
- Con 5 años de datos: ~5GB = $1.20/año

**Network Egress** (download):
- Primeros 100GB/mes: Gratis (mismo región GCP)
- 100GB-1TB: $0.12/GB

---

## 📊 Monitoreo

Ver usage en consola de GCP:
```
https://console.cloud.google.com/storage/browser?project=kashio-squad-nova
```

Métricas disponibles:
- Total storage size
- Request count (GET, PUT, DELETE)
- Bandwidth usage
- Average latency

---

## 🔒 Seguridad

**Configurado**:
- ✅ Uniform bucket-level access (no ACLs por objeto)
- ✅ Public access prevention (no acceso público)
- ✅ Encryption at-rest (default, Google-managed)
- ✅ Encryption in-transit (TLS 1.3)

**Recomendado** (próxima fase):
- 🔜 Customer-managed encryption keys (CMEK)
- 🔜 VPC Service Controls
- 🔜 Audit logging de accesos
- 🔜 Object versioning

---

## 🧪 Testing

Probar upload desde terminal:

```bash
# Subir archivo de prueba
echo "Test artifact content" > test-artifact.pdf
gcloud storage cp test-artifact.pdf gs://kashio-aria-artifacts/TEST/ART-001/v1.0.0.pdf

# Verificar que existe
gcloud storage ls gs://kashio-aria-artifacts/TEST/ART-001/

# Descargar
gcloud storage cp gs://kashio-aria-artifacts/TEST/ART-001/v1.0.0.pdf ./downloaded.pdf

# Limpiar
gcloud storage rm gs://kashio-aria-artifacts/TEST/ART-001/v1.0.0.pdf
```

---

## 📝 Próximos Pasos

1. [ ] Obtener Gemini API key
2. [ ] Integrar generación de PDF (jsPDF o backend)
3. [ ] Conectar generación → storage en UI
4. [ ] Implementar preview de artefactos
5. [ ] Configurar CORS para acceso desde frontend

---

**Última actualización**: Enero 2026  
**Buckets activos**: ✅ 2

