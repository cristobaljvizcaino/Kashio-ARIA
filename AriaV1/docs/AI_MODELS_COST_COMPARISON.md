# Comparativa de Modelos de IA - Costos y Alternativas

**Fecha**: Enero 2026  
**Para**: ARIA Control Center  
**Uso**: Generación de artefactos PDLC + Análisis de intake

---

## 🎯 Necesidades de ARIA

| Función | Volumen Estimado | Requerimiento |
|---------|------------------|---------------|
| **Generación de artefactos** | 100-200 artefactos/mes | ~1,000 tokens output/artefacto |
| **Análisis de intake** | 50-100 requests/mes | ~500 tokens output/análisis |
| **Chatbot ARIA** | 200-500 mensajes/mes | ~300 tokens output/mensaje |
| **Total tokens/mes** | ~350,000 tokens output | |

---

## 💰 Comparativa de Precios (Ordenado por Costo)

### 1. **Groq (MÁS BARATO - RECOMENDADO)** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | Llama 3.1 70B, Mixtral 8x7B |
| **Pricing** | **$0/mes hasta 14,400 req/día** 🎉 |
| **Free Tier** | 14,400 requests/día, 6,000 tokens/minuto |
| **Paid (si excedes)** | $0.27/1M tokens input, $0.27/1M tokens output |
| **Velocidad** | ⚡ ULTRA RÁPIDO (500+ tokens/seg) |
| **Calidad** | ⭐⭐⭐⭐ Muy buena (Llama 3.1 es top-tier) |
| **API** | Compatible con OpenAI API |
| **Website** | https://groq.com |

**Costo para ARIA**: **$0/mes** (bien dentro del free tier) 💰

**Ventajas**:
- ✅ Completamente gratis para tu volumen
- ✅ Más rápido que Gemini (3-5x velocidad)
- ✅ Compatible con OpenAI SDK (fácil migración)
- ✅ Sin límite de requests diarios (14k es enorme)

---

### 2. **Together AI** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelos** | Llama 3.1, Mixtral, Qwen, DeepSeek |
| **Pricing** | $0.20/1M tokens input, $0.20/1M output |
| **Free Tier** | $5 en créditos gratis |
| **Velocidad** | Rápido (~300 tokens/seg) |
| **Calidad** | ⭐⭐⭐⭐ Excelente |
| **Website** | https://together.ai |

**Costo para ARIA**: ~$0.14/mes ($0.07 por 350k tokens)

---

### 3. **OpenRouter (Agregador)** ⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelos** | Acceso a 200+ modelos (Claude, GPT, Llama, etc.) |
| **Pricing** | Variable por modelo: $0.06-$15/1M tokens |
| **Modelos baratos** | DeepSeek: $0.14/1M, Mistral: $0.24/1M |
| **Free Tier** | $5 créditos gratis |
| **Ventaja** | Puedes probar múltiples modelos |
| **Website** | https://openrouter.ai |

**Costo para ARIA**: $0.05-0.50/mes (según modelo)

---

### 4. **Anthropic Claude (Calidad Premium)** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | Claude 3.5 Haiku (más económico) |
| **Pricing** | $0.80/1M tokens input, $4/1M output |
| **Calidad** | ⭐⭐⭐⭐⭐ Mejor del mercado |
| **Contexto** | 200k tokens (vs 32k Gemini) |
| **Website** | https://anthropic.com |

**Costo para ARIA**: ~$1.40/mes

**Cuando usar**: Documentos muy complejos o críticos

---

### 5. **OpenAI GPT-4o Mini** ⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | GPT-4o mini |
| **Pricing** | $0.15/1M input, $0.60/1M output |
| **Free Tier** | $5 créditos para nuevos usuarios |
| **Calidad** | ⭐⭐⭐⭐ Muy buena |
| **Website** | https://openai.com |

**Costo para ARIA**: ~$0.21/mes

---

### 6. **Google Gemini** (Actual) ⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | Gemini 1.5 Flash |
| **Pricing** | $0.35/1M input, $1.05/1M output |
| **Free Tier** | 1,500 req/día, 1M tokens/min |
| **Calidad** | ⭐⭐⭐⭐ Buena |
| **Integración GCP** | ✅ Nativa |

**Costo para ARIA**: ~$0.36/mes (si usas free tier)  
**Costo si excedes**: ~$0.40/mes

---

### 7. **DeepSeek (Ultra Económico)** ⭐⭐⭐

| Aspecto | Detalle |
|---------|---------|
| **Modelo** | DeepSeek V3 |
| **Pricing** | $0.14/1M input, $0.28/1M output |
| **Calidad** | ⭐⭐⭐ Buena (competitivo con GPT-4) |
| **Velocidad** | Rápido |
| **Website** | https://platform.deepseek.com |

**Costo para ARIA**: ~$0.10/mes

---

## 📊 Resumen de Costos Mensuales para ARIA

| Modelo | Costo/mes | Free Tier | Velocidad | Calidad | Recomendado |
|--------|-----------|-----------|-----------|---------|-------------|
| **Groq** | **$0** | ✅ 14.4k req/día | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐⭐ **MEJOR** |
| **DeepSeek** | **$0.10** | ❌ | ⚡⚡⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Together AI** | **$0.14** | $5 créditos | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐ |
| **OpenAI Mini** | **$0.21** | $5 créditos | ⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐ |
| **OpenRouter** | **$0.05-0.50** | $5 créditos | Variable | Variable | ⭐⭐ |
| **Gemini (actual)** | **$0.36** | 1.5k req/día | ⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐ |
| **Claude Haiku** | **$1.40** | ❌ | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ⭐ |

**Ahorro vs Gemini**: Hasta **$0.36/mes** → **$0** (100% ahorro con Groq)

---

## 🏆 RECOMENDACIÓN #1: Groq + Llama 3.1 70B

### Por qué Groq es LA MEJOR opción:

1. **💰 GRATIS**: 14,400 requests/día (ARIA usa ~10-20/día)
2. **⚡ MÁS RÁPIDO**: 500 tokens/seg (vs 50 de Gemini)
3. **🎯 CALIDAD**: Llama 3.1 70B rivaliza con GPT-4
4. **🔧 FÁCIL**: API compatible con OpenAI (cambio trivial)
5. **📈 ESCALABLE**: Quota enorme (nunca la excederás)

### Migración de Gemini a Groq (5 minutos):

**Instalar SDK**:
```bash
npm install groq-sdk
```

**Actualizar `src/services/geminiService.ts`**:
```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'tu_groq_api_key'
});

export async function generateArtifactContent(
  artifactName: string,
  gateLabel: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-70b-versatile", // o "mixtral-8x7b-32768"
    messages: [
      {
        role: "system",
        content: "You are an expert in Product Development Life Cycle (PDLC) documentation for Fintech companies."
      },
      {
        role: "user",
        content: `Generate a brief professional outline for a product document titled "${artifactName}" within the "${gateLabel}" gate of a PDLC for a Fintech called Kashio. Keep it to 3 main sections with bullet points.`
      }
    ],
    temperature: 0.7,
    max_tokens: 2048
  });

  return completion.choices[0]?.message?.content || '';
}
```

**API key gratis**: https://console.groq.com

---

## 🆚 Comparativa Técnica

### Groq vs Gemini para ARIA

| Aspecto | Gemini 1.5 Flash | Groq Llama 3.1 70B |
|---------|------------------|---------------------|
| **Costo** | $0.36/mes | **$0/mes** 💰 |
| **Velocidad generación** | ~5 segundos | **~1-2 segundos** ⚡ |
| **Calidad BRMs** | Excelente | **Excelente** |
| **Contexto** | 32k tokens | 128k tokens |
| **Rate limit** | 15 req/min | **30 req/min** |
| **Free tier** | 1,500 req/día | **14,400 req/día** |
| **Integración GCP** | Nativa | Vía API REST |
| **Setup** | Ya configurado | 10 min migración |

**Ganador**: **Groq** (3x más rápido, gratis, mejor quota)

---

## 💡 Estrategia Híbrida (Mejor de ambos mundos)

### Opción: Usar múltiples modelos según caso

```typescript
// src/services/aiService.ts
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateArtifact(
  artifactName: string,
  gateLabel: string,
  complexity: 'simple' | 'complex' = 'simple'
): Promise<string> {
  
  if (complexity === 'simple') {
    // Usar Groq (gratis, rápido) para 95% de casos
    return await generateWithGroq(artifactName, gateLabel);
  } else {
    // Usar Claude (premium) solo para casos muy complejos
    return await generateWithClaude(artifactName, gateLabel);
  }
}
```

**Costo híbrido**: 
- 95% requests → Groq ($0)
- 5% requests → Claude ($0.07/mes)
- **Total**: ~$0.07/mes

---

## 📊 Proyección Anual de Costos

| Modelo | Mes | Año | 3 Años | Ahorro vs Gemini |
|--------|-----|-----|--------|------------------|
| **Groq** | **$0** | **$0** | **$0** | **$13/año** |
| DeepSeek | $0.10 | $1.20 | $3.60 | $11.80/año |
| Together AI | $0.14 | $1.68 | $5.04 | $11.32/año |
| OpenAI Mini | $0.21 | $2.52 | $7.56 | $10.48/año |
| **Gemini** | $0.36 | $4.32 | $12.96 | Baseline |
| Claude Haiku | $1.40 | $16.80 | $50.40 | -$12.48/año |

**Ahorro 3 años con Groq**: **$12.96** (100%)

---

## 🚀 Migración Recomendada: Gemini → Groq

### Paso 1: Obtener API Key de Groq (2 minutos)

1. Ve a: https://console.groq.com
2. Sign up con Google (gratis)
3. Crear API key
4. Copiar key

### Paso 2: Instalar SDK (1 minuto)

```bash
cd /Users/jules/Kashio/ARIA
npm install groq-sdk
```

### Paso 3: Actualizar geminiService.ts (5 minutos)

Reemplazar el import y cliente:

```typescript
// Antes:
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Después:
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Actualizar función:
export async function generateArtifactContent(
  artifactName: string,
  gateLabel: string
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Generate a brief professional outline for a product document titled "${artifactName}" within the "${gateLabel}" gate of a PDLC for a Fintech called Kashio. Keep it to 3 main sections with bullet points.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error);
    return 'Error generating content. Please try again.';
  }
}
```

### Paso 4: Configurar API Key (2 minutos)

```bash
# Local
echo "GROQ_API_KEY=tu_groq_api_key_aqui" >> .env.local

# Vercel
vercel env add GROQ_API_KEY production
# Pegar tu key

# Cloud Run
gcloud run services update aria-frontend \
  --update-env-vars="GROQ_API_KEY=tu_key_aqui" \
  --region us-central1
```

### Paso 5: Redeploy (1 minuto)

```bash
npm run build
vercel --prod
```

**Tiempo total**: 10 minutos  
**Ahorro**: $4.32/año → $0/año

---

## 🎯 Modelos Recomendados por Caso de Uso

### Para Generación de Artefactos (BRMs, Specs):
1. **Groq Llama 3.1 70B** - Gratis, rápido, calidad excelente
2. Together AI Llama 3.1 - $0.14/mes, similar calidad

### Para Análisis de Intake (Clasificación):
1. **Groq Mixtral 8x7B** - Gratis, ultra rápido para tareas simples
2. DeepSeek V3 - $0.10/mes, muy económico

### Para Chatbot ARIA:
1. **Groq Llama 3.1 8B** - Gratis, conversacional, rápido
2. OpenAI GPT-4o mini - $0.21/mes, muy conversacional

---

## 📈 Escalabilidad de Costos

### Con Gemini (Actual)
| Usuarios | Artefactos/mes | Costo/mes |
|----------|----------------|-----------|
| 20 | 200 | $0.36 (free tier) |
| 50 | 500 | $1.80 |
| 100 | 1,000 | $3.60 |
| 200 | 2,000 | $7.20 |

### Con Groq (Recomendado)
| Usuarios | Artefactos/mes | Costo/mes |
|----------|----------------|-----------|
| 20 | 200 | **$0** |
| 50 | 500 | **$0** |
| 100 | 1,000 | **$0** |
| 200 | 2,000 | **$0** |
| 500 | 5,000 | **$0** |

**Free tier hasta 14,400 requests/día = 432,000 requests/mes**

---

## ⚡ Velocidad de Generación Comparativa

| Modelo | Tiempo promedio | Experiencia Usuario |
|--------|----------------|---------------------|
| **Groq Llama 3.1** | **1-2 seg** | ⚡⚡⚡⚡⚡ Instantáneo |
| Groq Mixtral | 0.5-1 seg | ⚡⚡⚡⚡⚡ Ultra rápido |
| Claude Haiku | 2-3 seg | ⚡⚡⚡⚡ Muy rápido |
| OpenAI Mini | 3-4 seg | ⚡⚡⚡ Rápido |
| Gemini Flash | 5-8 seg | ⚡⚡ Normal |
| Together AI | 3-5 seg | ⚡⚡⚡ Rápido |

**Groq es 3-5x más rápido** que Gemini.

---

## 🎁 Free Tiers Comparados

| Servicio | Requests/día | Tokens/mes | Restricciones |
|----------|-------------|------------|---------------|
| **Groq** | **14,400** | **Ilimitados** | Rate: 30 req/min |
| Gemini | 1,500 | 4M tokens | Rate: 15 req/min |
| OpenRouter | Según créditos | $5 gratis | Varies |
| Together AI | Según créditos | $5 gratis | - |
| OpenAI | Según créditos | $5 gratis | - |
| Claude | ❌ No free tier | - | Paid only |

**Groq es el rey del free tier** 👑

---

## 🔧 Código de Ejemplo - Migración Completa

### geminiService.ts → aiService.ts (con Groq)

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generación de artefactos
export async function generateArtifactContent(
  artifactName: string,
  gateLabel: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an expert PDLC documentation specialist for fintech companies. Generate professional, structured content."
      },
      {
        role: "user",
        content: `Generate a brief professional outline for "${artifactName}" within "${gateLabel}" gate for Kashio Fintech. 3 main sections with bullet points.`
      }
    ],
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9
  });

  return completion.choices[0]?.message?.content || '';
}

// Análisis de intake
export async function analyzeIntakeRequest(
  request: Partial<IntakeRequest>
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "mixtral-8x7b-32768", // Más rápido para clasificación
    messages: [
      {
        role: "user",
        content: `Analyze this intake request:
Type: ${request.type}
Severity: ${request.severity}  
Problem: ${request.problem}
Outcome: ${request.outcome}

Provide: 2-sentence analysis, PDLC Route (Fast Track/Discovery/Standard), Primary Gate (G0-G5).`
      }
    ],
    temperature: 0.5,
    max_tokens: 500
  });

  return completion.choices[0]?.message?.content || '';
}

// Chatbot
export async function chatWithAria(
  message: string,
  history?: ChatMessage[]
): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content: "You are ARIA, the Kashio PDLC AI Agent. Expert in product development, gates, and governance. Be professional and concise."
    },
    ...(history || []).map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content
    })),
    {
      role: "user" as const,
      content: message
    }
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // Modelo pequeño para chat
    messages,
    temperature: 0.8,
    max_tokens: 1024
  });

  return completion.choices[0]?.message?.content || '';
}
```

---

## 📊 Impacto en Costos Totales de ARIA

### Arquitectura Actual (Gemini)
| Componente | Costo/mes |
|------------|-----------|
| Vercel | $0 |
| Gemini API | $0.36 |
| Cloud Storage | $0.01 |
| **Total** | **$0.37/mes** |

### Arquitectura con Groq (Recomendado)
| Componente | Costo/mes |
|------------|-----------|
| Vercel | $0 |
| **Groq API** | **$0** 🎉 |
| Cloud Storage | $0.01 |
| **Total** | **$0.01/mes** |

**Ahorro**: $0.36/mes = $4.32/año = $12.96/3 años

---

## 🎯 Acción Recomendada

### AHORA (10 minutos):
1. Crear cuenta en Groq: https://console.groq.com
2. Obtener API key (gratis, sin tarjeta)
3. Instalar: `npm install groq-sdk`
4. Migrar código (copiar/pegar de arriba)
5. Deploy a Vercel

### BENEFICIOS:
- 💰 **Ahorro**: $4.32/año
- ⚡ **Velocidad**: 3-5x más rápido
- 📈 **Quota**: 10x más generosa
- 🎯 **Calidad**: Igual o mejor

---

## 🔗 Links Útiles

| Servicio | Consola | Documentación | Pricing |
|----------|---------|---------------|---------|
| **Groq** | https://console.groq.com | https://docs.groq.com | https://groq.com/pricing |
| Together AI | https://api.together.ai | https://docs.together.ai | https://together.ai/pricing |
| OpenRouter | https://openrouter.ai | https://openrouter.ai/docs | https://openrouter.ai/models |
| DeepSeek | https://platform.deepseek.com | https://api-docs.deepseek.com | https://platform.deepseek.com/pricing |

---

## ✅ Conclusión

**Migra a Groq** porque:
- 💰 **$0/mes** (vs $0.36 Gemini, $80+ otros)
- ⚡ **3-5x más rápido**
- 🎯 **Calidad igual o mejor**
- 📈 **Quota enorme** (14.4k req/día)
- 🔧 **Migración trivial** (10 minutos)

**ARIA con Groq = $0.01/mes total** (solo Cloud Storage)

---

**Última actualización**: Enero 15, 2026  
**Recomendación**: ⭐⭐⭐ Groq + Llama 3.1 70B

