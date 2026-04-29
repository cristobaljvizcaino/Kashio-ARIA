# Setup Final de Cloud Run - Para Admin GCP

## ✅ Estado Actual

| Componente | Estado | Detalles |
|------------|--------|----------|
| **Cloud Run Service** | ✅ Desplegado | `aria-frontend` |
| **URL** | ✅ Activa | https://aria-frontend-215989210525.us-central1.run.app |
| **Container** | ✅ Corriendo | nginx + React build |
| **Auto-scaling** | ✅ Configurado | 1-10 instancias, 2Gi RAM, 2 vCPU |
| **Secret Manager** | ✅ Secret creado | `gemini-api-key` |
| **Problema** | ❌ Permisos | Service account no puede leer el secret |

---

## 🔧 Lo que Falta (1 comando - 30 segundos)

**Ejecutar este comando como Project Owner/Admin**:

```bash
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:215989210525-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project kashio-squad-nova
```

**Después, actualizar Cloud Run**:

```bash
gcloud run services update aria-frontend \
  --region us-central1 \
  --clear-env-vars \
  --update-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --project kashio-squad-nova
```

---

## 🎯 Resultado Esperado

Después de estos 2 comandos:
- ✅ Cloud Run puede leer la API key desde Secret Manager
- ✅ ARIA funcionará al 100% en Cloud Run
- ✅ Acceso: Solo usuarios @kashio.us (organization policy)

---

## 🔐 Acceso a Cloud Run (Para usuarios)

### Opción 1: Via Proxy (Recomendado para testing)

Cualquier usuario @kashio.us puede ejecutar:

```bash
gcloud run services proxy aria-frontend \
  --region us-central1 \
  --project kashio-squad-nova \
  --port 8081
```

Luego abrir: http://localhost:8081

### Opción 2: Navegador con Auth

1. Instalar gcloud CLI
2. Login: `gcloud auth login`
3. Ejecutar: 
```bash
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://aria-frontend-215989210525.us-central1.run.app
```

### Opción 3: Pedir excepción a Organization Policy (No recomendado)

Si necesitas acceso público sin autenticación, un **Organization Policy Administrator** debe ejecutar:

```bash
# NO RECOMENDADO - Abre servicio a internet público
gcloud run services add-iam-policy-binding aria-frontend \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  --project kashio-squad-nova
```

---

## 📊 Arquitectura Actual - Dual Deployment

```
┌─────────────────────────────────────────┐
│           VERCEL (Público)              │
│   aria-control-center.vercel.app        │
│                                         │
│   ✅ 100% Funcional                     │
│   ✅ Acceso público                     │
│   ✅ IA activa                          │
│   ✅ PDFs generándose                   │
│   ✅ $0/mes                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      GOOGLE CLOUD RUN (Interno)         │
│   aria-frontend-...-uc.a.run.app        │
│                                         │
│   ✅ Desplegado                         │
│   ⚠️  Secret config pendiente           │
│   🔒 Solo @kashio.us                    │
│   💰 ~$85/mes                           │
└─────────────────────────────────────────┘
```

---

## 🎯 Recomendación de Uso

### Para Producción (Ahora):
**USA VERCEL**: https://aria-control-center.vercel.app
- ✅ Completamente funcional
- ✅ Público y accesible
- ✅ Gratis

### Para Staging/Testing Interno (Futuro):
**USA CLOUD RUN**: https://aria-frontend-215989210525.us-central1.run.app
- Cuando un admin configure los permisos del secret
- Para testing interno de equipo
- Como ambiente de staging

---

## 🔄 Sincronización de Deployments

### Vercel (Auto-deploy desde Bitbucket):
```bash
git push origin main
# Vercel detecta el push y redeploy automáticamente
```

### Cloud Run (Manual o CI/CD):
```bash
cd /Users/jules/Kashio/ARIA
gcloud run deploy aria-frontend --source . --region us-central1
```

---

## 💡 Próximos Pasos

1. **Ahora**: Usa Vercel (ya funciona perfecto)
2. **Admin ejecuta**: Los 2 comandos de arriba para Secret Manager
3. **Después**: Cloud Run funcionará al 100%
4. **Opcional**: Configurar CI/CD automático con Cloud Build triggers

---

## 📞 Quién Puede Ayudar

Busca en tu equipo a alguien con estos roles en GCP:
- **Project Owner** ⭐ (puede todo)
- **Secret Manager Admin** (puede otorgar permisos a secrets)
- **Security Admin** (puede modificar IAM policies)

---

**Creado**: Enero 15, 2026  
**Estado Secret**: Creado, permisos pendientes  
**Estado Cloud Run**: Desplegado, esperando secret access

