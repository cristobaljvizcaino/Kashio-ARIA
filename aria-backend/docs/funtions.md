Documentación centralizada — Cloud Functions ARIA
1. Contexto general

Estas funciones forman parte del backend de ARIA/Karia y están desplegadas como Cloud Functions 2ª generación, visibles también como servicios en Cloud Run.

Proyecto GCP destino del redespliegue: **`kashio-finops`** (Kashio FinOps).

URLs históricas en `kashio-squad-nova` quedan **legacy**; tras el redespliegue las nuevas viven en `https://us-central1-kashio-finops.cloudfunctions.net/...`.

**Secret Manager — API key Gemini:** el secreto **`gemini-api-key`** está en **Kashio-Finops**. Ruta `projects/kashio-finops/secrets/gemini-api-key`. En `functions/api/index.js` se resuelve con `PROJECT_ID` → `GOOGLE_CLOUD_PROJECT` → default `'kashio-finops'`.

**Runtime:** desplegar con **`--runtime=nodejs22`** (Cloud Functions Gen 2). El backend Express (Cloud Run) usa **Node.js 24** vía `Dockerfile` (`node:24-alpine`).

Región:

us-central1

Funciones probadas hasta ahora:

ariaChat           OK
generateArtifact   OK

Ambas funciones usan Gemini mediante una API key guardada en Secret Manager.

2. Intermediarios comunes de estas funciones

Tanto ariaChat como generateArtifact usan casi la misma cadena técnica.

Flujo general
Cliente
  ↓
Cloud Functions URL / Cloud Run service
  ↓
Autenticación IAM
  ↓
CORS middleware
  ↓
Validación del método HTTP
  ↓
Validación del body JSON
  ↓
Secret Manager
  ↓
Gemini API client
  ↓
Modelo Gemini
  ↓
Respuesta JSON al cliente
  ↓
Logs en Cloud Run
Componentes intermedios
Componente	Rol
Cliente	Puede ser Cloud Shell, frontend, Postman, curl o navegador
Cloud Functions / Cloud Run	Ejecuta la función HTTP
IAM / Authentication	Bloquea o permite la invocación
CORS	Permite o bloquea llamadas desde ciertos dominios del frontend
Secret Manager	Guarda la API key de Gemini
GoogleGenerativeAI client	Cliente Node.js para llamar a Gemini
Gemini model	Modelo que genera texto
Logs de Cloud Run	Permiten ver errores, respuestas, tiempos y trazas
3. Secret Manager usado

Las funciones leen este secreto:

gemini-api-key

Ruta usada por el código (FinOps — fuente actual):

`projects/kashio-finops/secrets/gemini-api-key/versions/latest`

Estado en consola (Kashio-Finops, abril 2026):

- Versión **1** — **Habilitada** (cifrado administrado por Google). Notificación de consola: secreto `gemini-api-key` creado correctamente.

La cuenta de servicio de ejecución de la función necesita **Secret Manager Secret Accessor** sobre ese secreto. Si la función se despliega en otro proyecto, podés referenciarlo en forma cross-project (`projects/kashio-finops/secrets/gemini-api-key`) y dar IAM cruzado.

4. Funciones auxiliares comunes

Estas funciones no son endpoints públicos, pero son necesarias para que ariaChat y generateArtifact funcionen.

4.1 getGeminiApiKey()
Qué hace

Obtiene la API key de Gemini desde Secret Manager.

async function getGeminiApiKey() {
  if (cachedApiKey) return cachedApiKey;

  const PROJECT_ID = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'kashio-finops';
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/gemini-api-key/versions/latest`,
  });

  cachedApiKey = version.payload.data.toString();
  return cachedApiKey;
}
Intermediarios que usa
Cloud Function
  ↓
Secret Manager
  ↓
gemini-api-key:latest
Detalle importante

Tiene cache en memoria:

let cachedApiKey = null;

Eso significa que si se cambia el secreto, puede ser necesario hacer redeploy o reinicio de la función para que lea la nueva key.

Esto fue exactamente lo que pasó: después de actualizar Secret Manager, hicimos redeploy para que dejara de usar la key vieja.

4.2 getGeminiClient()
Qué hace

Crea el cliente de Gemini usando la API key obtenida desde Secret Manager.

async function getGeminiClient() {
  const apiKey = await getGeminiApiKey();
  return new GoogleGenerativeAI(apiKey);
}
Intermediarios que usa
getGeminiApiKey()
  ↓
Secret Manager
  ↓
GoogleGenerativeAI
4.3 generateWithFallback()
Qué hace

Intenta generar contenido con varios modelos Gemini en orden.

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

La función devuelve `{ text, modelName }` y los endpoints exponen el modelo en `metadata.model` o `model`.

La intención es:

Intentar gemini-2.5-flash-lite
  ↓ si falla
Intentar gemini-2.5-flash
  ↓ si falla
Devolver error
Propósito

Evitar que una función falle completamente si un modelo específico tiene problemas temporales.

Observación durante las pruebas

Vimos un error temporal:

503 Service Unavailable
This model is currently experiencing high demand

Luego al reintentar, el modelo respondió bien.

5. Función ariaChat
5.1 Qué es

ariaChat es el chatbot de ARIA.

Sirve para responder preguntas sobre:

PDLC
Gates
SLAs
generación de artefactos
gobernanza ágil
alineación estratégica
productos Kashio
5.2 Endpoint

Nombre lógico en el código:

functions.http('ariaChat', async (req, res) => {

URL usada para prueba:

https://us-central1-kashio-finops.cloudfunctions.net/ariaChat

Servicio visible en Cloud Run:

ariachat
5.3 Método HTTP

Acepta únicamente:

POST

Si se llama con GET, devuelve error o queda bloqueada antes por autenticación.

5.4 Body esperado
{
  "message": "Hola ARIA, dime que haces.",
  "history": []
}

Campo obligatorio:

message

Campo opcional/actualmente no usado a profundidad:

history
5.5 Qué hace internamente

Flujo:

Recibe POST
  ↓
Valida CORS
  ↓
Valida que el método sea POST
  ↓
Lee req.body.message
  ↓
Si no existe message, responde 400
  ↓
Obtiene cliente Gemini
  ↓
Define systemInstruction de ARIA
  ↓
Llama a Gemini con el mensaje
  ↓
Devuelve respuesta JSON
5.6 System instruction usado

La función le indica a Gemini que actúe como ARIA:

You are ARIA, the Kashio PDLC AI Agent.
You are an expert in the Product Development Life Cycle,
agile governance, and Kashio's product offerings...

Esto es lo que le da el “rol” de asistente PDLC.

5.7 Respuesta exitosa validada

Obtuvimos:

{
  "success": true,
  "response": "Hola. Soy ARIA, el Agente IA de PDLC de Kashio...",
  "model": "gemini-2.5-flash",
  "timestamp": "2026-04-29T16:58:25.971Z"
}

En logs se confirmó:

POST 200
✅ Chat response generated
5.8 Comando de prueba
curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/ariaChat" \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{"message":"Hola ARIA, dime que haces.","history":[]}'
5.9 Errores vistos durante prueba
Error	Causa	Estado
403 Forbidden	Falta token/autenticación	Resuelto
400 Missing message	Body mal formado o faltó message	Resuelto
500 API key leaked	API key vieja bloqueada	Resuelto
503 high demand	Saturación temporal Gemini	Resuelto al reintentar
200 success	Función operativa	OK
6. Función generateArtifact
6.1 Qué es

generateArtifact genera un borrador profesional de un artefacto del PDLC.

Ejemplo:

Business Case para G1

La función no guarda el artefacto. Solo genera el texto y lo devuelve en la respuesta.

6.2 Endpoint

Nombre lógico en el código:

functions.http('generateArtifact', async (req, res) => {

URL usada para prueba:

https://us-central1-kashio-finops.cloudfunctions.net/generateArtifact

Servicio visible en Cloud Run:

generateartifact
6.3 Método HTTP

Acepta únicamente:

POST
6.4 Body esperado
{
  "artifactName": "Business Case",
  "gateLabel": "G1"
}

Campos obligatorios:

artifactName
gateLabel
6.5 Qué hace internamente

Flujo:

Recibe POST
  ↓
Valida CORS
  ↓
Valida que el método sea POST
  ↓
Lee artifactName y gateLabel
  ↓
Si falta alguno, responde 400
  ↓
Obtiene cliente Gemini
  ↓
Construye prompt profesional
  ↓
Llama a Gemini
  ↓
Devuelve contenido generado
6.6 Prompt usado

La función construye un prompt como:

Generate a brief professional outline for a product document titled "Business Case"
within the "G1" gate of a PDLC for a Fintech called Kashio.
Keep it to 3 main sections with bullet points.
6.7 Respuesta exitosa validada

Obtuvimos:

{
  "success": true,
  "content": "Here's a brief professional outline for a \"Business Case\" document at the G1 gate for Kashio...",
  "metadata": {
    "artifactName": "Business Case",
    "gateLabel": "G1",
    "model": "gemini-2.5-flash",
    "timestamp": "2026-04-29T19:36:29.657Z"
  }
}

Esto confirma que la función genera correctamente contenido con Gemini.

6.8 Comando de prueba
curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/generateArtifact" \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{"artifactName":"Business Case","gateLabel":"G1"}'
6.9 Dónde se guarda lo que genera

Actualmente:

No se guarda automáticamente.

generateArtifact solo devuelve el texto generado.

El resultado queda en:

Respuesta HTTP
Cloud Shell
Frontend si lo consume
Logs parcialmente, si se imprime

Pero no queda persistido como archivo ni como registro SQL.

6.10 Qué endpoint guarda artefactos realmente

Según la documentación del backend, guardar/publicar artefactos corresponde a otros endpoints:

POST /api/artifacts/publish
POST /api/artifacts/publish-pdf

Esos endpoints pertenecen al backend Express y guardan en Cloud Storage:

karia-library-files/Output/G0/
karia-library-files/Output/G1/
karia-library-files/Output/G2/
karia-library-files/Output/G3/
karia-library-files/Output/G4/
karia-library-files/Output/G5/

Flujo esperado completo:

generateArtifact
  ↓
genera borrador
  ↓
frontend muestra/edita/aprueba
  ↓
frontend llama /api/artifacts/publish
  ↓
backend guarda en Cloud Storage
6.11 Errores vistos durante prueba
Error	Causa	Estado
503 high demand	Gemini saturado temporalmente	Resuelto al reintentar
200 success	Generación correcta	OK
7. Comparación rápida
Función	Entrada	Salida	Guarda información
ariaChat	message, history	Respuesta conversacional	No
generateArtifact	artifactName, gateLabel	Borrador de artefacto	No

Ambas:

usan Secret Manager
usan Gemini
requieren POST
requieren token si están privadas
devuelven JSON
registran logs en Cloud Run
8. Pruebas exitosas hasta ahora
ariaChat

Comando:

curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/ariaChat" \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{"message":"Hola ARIA, dime que haces.","history":[]}'

Resultado:

success: true
POST 200

Estado:

OK
generateArtifact

Comando:

curl -X POST "https://us-central1-kashio-finops.cloudfunctions.net/generateArtifact" \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{"artifactName":"Business Case","gateLabel":"G1"}'

Resultado:

success: true
POST 200

Estado:

OK
9. Interpretación de códigos HTTP
Código	Significado en este contexto
200	La función funcionó correctamente
400	El body está mal o faltan campos
403	Falta autenticación o permiso
405	Método HTTP incorrecto
500	Error interno, normalmente Gemini, Secret Manager o código
503	Servicio/modelo Gemini temporalmente saturado
10. Checklist técnico para ambas funciones

Para que una prueba sea válida debe tener:

URL correcta
Método POST
Authorization bearer token
Content-Type application/json
Body correcto
Secret Manager actualizado
Cloud Run revision activa

Ejemplo base:

curl -X POST "URL_DE_FUNCION" \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{...body...}'
11. Estado actual documentado
ariaChat
  Estado: OK
  Última validación: POST 200
  Modelo usado: gemini-2.5-flash
  Usa Secret Manager: sí
  Guarda datos: no

generateArtifact
  Estado: OK
  Última validación: POST 200
  Modelo usado: gemini-2.5-flash
  Usa Secret Manager: sí
  Guarda datos: no