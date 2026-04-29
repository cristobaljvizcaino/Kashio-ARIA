# Guía: Habilitar ARIA en Cloud Run como Servicio Público

**Problema**: Organization Policy de Kashio bloquea acceso público  
**Solución**: Requiere Organization Policy Administrator

---

## 🔒 Problema Actual

```bash
Error: One or more users named in the policy do not belong to a 
permitted customer, perhaps due to an organization policy.
```

**Organization Policy activa**:
```
Constraint: iam.allowedPolicyMemberDomains
Allowed values: C03975l1l (Kashio Customer ID only)
Effect: Bloquea "allUsers" y "allAuthenticatedUsers"
```

**Impacto**:
- ❌ No puedes hacer Cloud Run público
- ❌ No puedes hacer Cloud Functions públicas
- ✅ Solo usuarios @kashio.us con autenticación pueden acceder

---

## ✅ SOLUCIÓN: Excepción de Organization Policy

### Paso 1: Identificar Organization Policy Administrator

Busca en tu empresa a alguien con uno de estos roles:
- **Organization Policy Administrator** ⭐ (puede modificar policies)
- **Organization Administrator** (puede todo)
- **Security Admin** (puede políticas de seguridad)

Típicamente es:
- CTO / Head of Infrastructure
- Security Team Lead
- Cloud Platform Admin

### Paso 2: El Admin Ejecuta Este Comando

```bash
# Crear excepción SOLO para el proyecto ARIA
gcloud org-policies set-policy - <<EOF
name: projects/kashio-squad-nova/policies/iam.allowedPolicyMemberDomains
spec:
  rules:
  - allowAll: true
    condition:
      title: "Allow public access for ARIA services"
      description: "Permite acceso público solo para Cloud Run y Cloud Functions de ARIA"
      expression: |
        resource.matchTag('projects/kashio-squad-nova', 'aria-public') ||
        resource.type == 'run.googleapis.com/Service' ||
        resource.type == 'cloudfunctions.googleapis.com/Function'
EOF
```

**Tiempo**: 2 minutos  
**Scope**: Solo afecta proyecto `kashio-squad-nova`, no toda la org

### Paso 3: TÚ Ejecutas (Habilitar Acceso Público)

Una vez el admin habilite la excepción:

```bash
# 1. Cloud Run público
gcloud run services add-iam-policy-binding aria-frontend \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  --project kashio-squad-nova

# 2. Cloud Functions públicas
for func in generateArtifact analyzeIntake ariaChat; do
  gcloud functions add-invoker-policy-binding $func \
    --region=us-central1 \
    --member=allUsers \
    --project kashio-squad-nova
done

# 3. Verificar
curl https://aria-frontend-ih5a4tpiua-uc.a.run.app
```

**Tiempo**: 2 minutos  
**Resultado**: ARIA público en Cloud Run 🎉

---

## 🔐 Alternativa: Identity-Aware Proxy (IAP)

Si no quieren desactivar la policy, pueden usar IAP:

### Setup IAP (Acceso con Google Login)

```bash
# 1. Habilitar IAP
gcloud iap web enable \
  --resource-type=cloud-run \
  --service=aria-frontend \
  --project=kashio-squad-nova

# 2. Configurar OAuth consent screen
# (Desde consola: https://console.cloud.google.com/apis/credentials/consent)

# 3. Agregar usuarios permitidos
gcloud iap web add-iam-policy-binding \
  --resource-type=cloud-run \
  --service=aria-frontend \
  --member=domain:kashio.us \
  --role=roles/iap.httpsResourceAccessor
```

**Resultado**: 
- ✅ Usuarios deben hacer login con Google (@kashio.us)
- ✅ Cumple organization policy
- ✅ No requiere proxy local
- ⚠️ Requiere autenticación (no 100% público)

---

## 🆚 Comparativa de Opciones

| Opción | Esfuerzo | Público | Requiere | Tiempo |
|--------|----------|---------|----------|--------|
| **Excepción Org Policy** | Bajo | ✅ SÍ | Org Admin | 5 min |
| **IAP** | Medio | 🟡 Login Google | Editor | 15 min |
| **API Gateway** | Alto | ✅ SÍ | Config compleja | 1 hora |
| **Mantener Vercel** | Zero | ✅ SÍ | Nada | Ya está ✅ |

---

## 💡 Mi Recomendación

### CORTO PLAZO (Hoy):
**USA VERCEL**: https://aria-control-center.vercel.app
- ✅ Ya es público
- ✅ Ya funciona al 100%
- ✅ $0/mes
- ✅ No necesitas permisos especiales

### MEDIANO PLAZO (Próximas semanas):
**Pide excepción de Org Policy**
- Contacta al Organization Policy Admin
- Muestra esta guía
- Toma 5 minutos aprobar

---

## 📞 Email Template para el Admin

```
Asunto: Solicitud de Excepción de Organization Policy para ARIA

Hola [Nombre del Admin],

Necesito habilitar acceso público para el proyecto ARIA en Cloud Run.

Proyecto: kashio-squad-nova
Servicios: aria-frontend (Cloud Run) + 3 Cloud Functions
Constraint: iam.allowedPolicyMemberDomains

¿Podrías ejecutar este comando para crear una excepción solo 
para este proyecto?

[Pegar comando del Paso 2 de arriba]

Esto permitirá que ARIA sea accesible públicamente sin comprometer 
la seguridad de otros proyectos.

Documentación: docs/HABILITAR_CLOUDRUN_PUBLICO.md

Gracias,
Arley
```

---

## 🎯 Pasos Concretos AHORA

### 1. Identifica al Organization Admin
```bash
# Ver quién tiene permisos
gcloud organizations get-iam-policy $(gcloud projects describe kashio-squad-nova --format="value(parent.id)") \
  --filter="bindings.role:roles/orgpolicy.policyAdmin" \
  --flatten="bindings[].members" \
  --format="value(bindings.members)"
```

### 2. Comparte Esta Guía
- Envía `docs/HABILITAR_CLOUDRUN_PUBLICO.md` al admin
- O comparte el comando del Paso 2

### 3. Espera Aprobación (5-15 minutos típicamente)

### 4. Ejecuta los Comandos del Paso 3

---

## ⏰ Timeline

| Paso | Responsable | Tiempo |
|------|-------------|--------|
| 1. Solicitar excepción | Tú | 2 min |
| 2. Revisar/aprobar | Org Admin | 5-30 min |
| 3. Habilitar público | Tú | 2 min |
| **Total** | - | **10-35 min** |

---

## 🚀 Mientras Tanto

**ARIA YA ESTÁ PÚBLICO EN VERCEL**:
- 🔗 https://aria-control-center.vercel.app
- ✅ Funciona al 100%
- ✅ Accesible para todos
- ✅ Sin necesidad de permisos

**Cloud Run quedará como**:
- Staging environment
- Testing interno
- Backup de producción

---

¿Quieres que te ayude a identificar al Organization Admin o prefieres usar Vercel como URL principal por ahora? 🚀

