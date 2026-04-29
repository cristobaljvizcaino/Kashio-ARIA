# Guía: Otorgar Permisos para Cloud Run Deployment

## 🚨 Problema Actual

El deployment a Cloud Run falla con este error:
```
ERROR: 215989210525-compute@developer.gserviceaccount.com does not have 
storage.objects.get access to the Google Cloud Storage object
```

## 🔧 Solución: Otorgar Permisos al Service Account

### Opción 1: Desde la Consola de GCP (Recomendado)

1. **Ir a IAM**:
   - Ve a: https://console.cloud.google.com/iam-admin/iam?project=kashio-squad-nova

2. **Buscar el Service Account**:
   - Busca: `215989210525-compute@developer.gserviceaccount.com`
   - También aparece como "Compute Engine default service account"

3. **Editar Permisos**:
   - Haz clic en el ícono de lápiz (editar) al lado del service account
   - Haz clic en "+ ADD ANOTHER ROLE"
   - Busca y agrega estos roles:
     - `Storage Object Viewer`
     - `Storage Object Creator`
     - O simplemente: `Storage Admin` (más permisivo pero más simple)

4. **Guardar**:
   - Haz clic en "SAVE"

5. **Reintentar Deployment**:
   ```bash
   cd /Users/jules/Kashio/ARIA
   gcloud run deploy aria-frontend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --project kashio-squad-nova
   ```

---

### Opción 2: Desde CLI (Requiere Permisos de Admin)

Si alguien con permisos de Project Admin puede ejecutar:

```bash
# Otorgar Storage Admin al Compute Engine service account
gcloud projects add-iam-policy-binding kashio-squad-nova \
  --member="serviceAccount:215989210525-compute@developer.gserviceaccount.com" \
  --role="roles/storage.admin"

# Otorgar permisos a Cloud Build también
gcloud projects add-iam-policy-binding kashio-squad-nova \
  --member="serviceAccount:215989210525@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"
```

---

### Opción 3: Habilitar Cloud Build API Permissions Automáticamente

1. **Ir a Cloud Build Settings**:
   - URL: https://console.cloud.google.com/cloud-build/settings/service-account?project=kashio-squad-nova

2. **Habilitar permisos**:
   - Toggle ON en "Cloud Storage"
   - Toggle ON en "Service Accounts"

3. **Guardar y reintentar**

---

## 🎯 Comando Final de Deployment

Una vez otorgados los permisos, ejecuta:

```bash
cd /Users/jules/Kashio/ARIA

gcloud run deploy aria-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --timeout 300 \
  --set-env-vars="GEMINI_API_KEY=AIzaSyDBSsjUgYdsbkje53F8LKrhbYZXxa4uGi8" \
  --project kashio-squad-nova
```

**Tiempo estimado**: 5-8 minutos

---

## 🔍 Service Accounts Involucrados

| Service Account | Propósito | Permisos Necesarios |
|-----------------|-----------|---------------------|
| `215989210525-compute@developer.gserviceaccount.com` | Compute Engine default | Storage Admin, Cloud Build |
| `215989210525@cloudbuild.gserviceaccount.com` | Cloud Build | Storage Admin, Artifact Registry Writer |

---

## ✅ Verificación Post-Deployment

Después del deployment exitoso, verás:

```
Deploying container to Cloud Run service [aria-frontend] 
in project [kashio-squad-nova] region [us-central1]
✓ Deploying new service... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
  ✓ Setting IAM Policy...
Done.
Service [aria-frontend] revision [aria-frontend-00001-abc] has been deployed
Service URL: https://aria-frontend-xxxxxxxxxx-uc.a.run.app
```

---

## 🚀 Beneficios de Cloud Run vs Vercel

| Aspecto | Vercel | Cloud Run |
|---------|--------|-----------|
| **Control** | Limitado | Total control |
| **Integración GCP** | No | Nativa |
| **Vertex AI** | Llamadas externas | Misma VPC |
| **Cloud Storage** | Externo | Integrado |
| **Logs** | Vercel logs | Cloud Logging |
| **Monitoreo** | Básico | Cloud Monitoring completo |
| **Costo** | $0 | ~$85/mes |

---

## 🔄 Migración Vercel → Cloud Run

**¿Afecta a los usuarios?**: No, solo cambia la URL

**Pasos**:
1. Deployment a Cloud Run (obtener URL)
2. Actualizar DNS si tienes dominio custom
3. Apuntar tráfico a Cloud Run
4. (Opcional) Mantener Vercel como backup

---

## ❓ FAQ

### ¿Por qué necesito estos permisos?

Cloud Build necesita:
- **Storage permissions**: Para subir el código fuente a un bucket temporal
- **Build permissions**: Para construir la imagen Docker
- **Cloud Run permissions**: Para desplegar el servicio

### ¿Es seguro otorgar Storage Admin?

Sí, es el service account **por defecto** de Compute Engine. Es usado por GCP internamente.

Alternativa más restrictiva:
- `roles/storage.objectViewer` (read)
- `roles/storage.objectCreator` (write)

### ¿Qué pasa si no puedo otorgar permisos?

**Opción temporal**: Mantener Vercel (funciona perfectamente)

**Opción definitiva**: Pedir a un Project Owner/Admin que otorgue los permisos

---

## 📞 Contacto

Si necesitas ayuda con permisos, contacta a:
- **GCP Admin**: [admin-gcp@kashio.us]
- **DevOps**: [devops@kashio.us]

---

**Última actualización**: Enero 15, 2026  
**Estado**: Esperando permisos de IAM

