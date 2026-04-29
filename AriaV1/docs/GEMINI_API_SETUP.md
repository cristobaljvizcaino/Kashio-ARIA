# Configuración de Gemini API Key

## Paso 1: Obtener API Key de Google AI Studio

1. Ve a: https://aistudio.google.com/apikey
2. Inicia sesión con tu cuenta de Google (arley.gutierrez@kashio.us)
3. Acepta los términos de servicio
4. Haz clic en "Get API key" o "Create API key"
5. Si dice "No Cloud Projects Available":
   - Haz clic en "Import projects"
   - Selecciona el proyecto `kashio-squad-nova`
   - Confirma la importación
6. Luego crea la API key con nombre: "ARIA Production Key"
7. **COPIA LA API KEY** (se mostrará solo una vez)

## Paso 2: Configurar en Vercel

### Opción A: Dashboard de Vercel
1. Ve a: https://vercel.com/arleygutierrez-5018s-projects/aria-control-center/settings/environment-variables
2. Haz clic en el menú de la variable `GEMINI_API_KEY`
3. Haz clic en "Edit"
4. Pega la API key real
5. Guarda y redeploy

### Opción B: CLI de Vercel
```bash
cd /Users/jules/Kashio/ARIA
vercel env rm GEMINI_API_KEY production
vercel env add GEMINI_API_KEY production
# Pega tu API key cuando te lo pida
vercel --prod
```

## Paso 3: Actualizar en archivo local

```bash
cd /Users/jules/Kashio/ARIA
echo "GEMINI_API_KEY=tu_api_key_aqui" > .env.local
```

## Verificar que funciona

```bash
npm run dev
# Abre http://localhost:3000
# Ve a "Intake Hub" y haz clic en "Analizar con ARIA"
# Debe funcionar sin errores
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**:
- NUNCA comitear la API key a Git
- `.env.local` ya está en `.gitignore`
- Rotar la key cada 90 días
- Usar Secret Manager en producción

---

## 📊 Límites y Cuotas (Free Tier)

| Límite | Valor |
|--------|-------|
| Requests por minuto | 15 |
| Requests por día | 1,500 |
| Tokens por minuto | 32,000 input / 8,000 output |

Si necesitas más, upgrade a paid tier.

---

## 🚀 Modelos Disponibles (2026)

ARIA implementa una **estrategia de fallback automática** con 3 modelos:

### Modelos Activos (con Fallback) ✅
1. **`gemini-2.5-flash`** (Primario) - Estable, rápido, 1M tokens (Jun 2025)
2. **`gemini-2.5-pro`** (Fallback #1) - Más potente, análisis complejos
3. **`gemini-2.0-flash`** (Fallback #2) - Versión anterior estable

### Cómo Funciona el Fallback
- Si el modelo primario falla (404, 503, etc), automáticamente intenta con el siguiente
- Los intentos son secuenciales: intento 1 → intento 2 → intento 3
- Solo falla si los 3 modelos están caídos
- Los logs muestran qué modelo respondió exitosamente

### Estado de Verificación
✅ **Todos los modelos probados y funcionales** (12 Feb 2026)
- `gemini-2.5-flash`: ✅ OK
- `gemini-2.5-pro`: ✅ OK
- `gemini-2.0-flash`: ✅ OK

### Modelos Deprecados ❌
- ~~`gemini-1.0-pro`~~ - Ya no disponible (causa error 404)
- ~~`gemini-1.5-flash`~~ - Ya no disponible en API v1beta
- ~~`gemini-1.5-pro`~~ - Ya no disponible en API v1beta
- ~~`gemini-3-flash-preview`~~ - Solo preview, no estable

**Configuración**: Los modelos están definidos en:
- Frontend: `src/services/geminiService.ts` (array `GEMINI_MODELS`)
- Backend: `functions/api/index.js` (array `GEMINI_MODELS`)

### Verificar Modelos Disponibles
Para ver todos los modelos disponibles en tu API key:
```bash
node list-available-models.js
```


