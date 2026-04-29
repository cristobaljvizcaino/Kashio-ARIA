/**
 * ARIA Backend API - Cloud Functions
 * 
 * Endpoints seguros que acceden a Gemini API usando Secret Manager
 */

import functions from '@google-cloud/functions-framework';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import cors from 'cors';

const secretClient = new SecretManagerServiceClient();
const PROJECT_ID =
  process.env.PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'kashio-finops';

// CORS configuration
const corsHandler = cors({
  origin: [
    'https://karia-ui-app-476648227615.us-east4.run.app',
    'https://aria-frontend-ih5a4tpiua-uc.a.run.app',
    'https://aria-frontend-215989210525.us-central1.run.app',
    'https://aria-control-center.vercel.app',
    'http://localhost:3000',
    'http://localhost:8082'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
});

// Cache for API key (avoid fetching on every request)
let cachedApiKey = null;

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite-preview'
];

/**
 * Get Gemini API key from Secret Manager
 */
async function getGeminiApiKey() {
  if (cachedApiKey) return cachedApiKey;

  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/gemini-api-key/versions/latest`,
  });

  cachedApiKey = version.payload.data.toString();
  return cachedApiKey;
}

/**
 * Initialize Gemini AI client
 */
async function getGeminiClient() {
  const apiKey = await getGeminiApiKey();
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Intenta generar contenido con múltiples modelos como fallback
 * Si un modelo falla, automáticamente intenta con el siguiente
 */
async function generateWithFallback(genAI, prompt, systemInstruction = null) {
  let lastError = null;
  
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelName = GEMINI_MODELS[i];
    
    try {
      console.log(`🔄 Intentando con modelo ${i + 1}/${GEMINI_MODELS.length}: ${modelName}`);
      
      const modelConfig = { model: modelName };
      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }
      
      const model = genAI.getGenerativeModel(modelConfig);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ Éxito con modelo: ${modelName}`);
      return text;
      
    } catch (error) {
      console.warn(`⚠️ Modelo ${modelName} falló:`, error?.message);
      lastError = error;
      
      // Si es el último modelo, lanzar el error
      if (i === GEMINI_MODELS.length - 1) {
        throw error;
      }
      
      // Continuar con el siguiente modelo
      continue;
    }
  }
  
  // Si llegamos aquí, todos los modelos fallaron
  throw lastError || new Error('Todos los modelos de Gemini fallaron');
}


// ==============================================
// ENDPOINT 1: Generate Artifact Content
// ==============================================
functions.http('generateArtifact', async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { artifactName, gateLabel } = req.body;

      if (!artifactName || !gateLabel) {
        res.status(400).json({ error: 'Missing artifactName or gateLabel' });
        return;
      }

      const genAI = await getGeminiClient();
      const prompt = `Generate a brief professional outline for a product document titled "${artifactName}" within the "${gateLabel}" gate of a PDLC for a Fintech called Kashio. Keep it to 3 main sections with bullet points.`;

      const content = await generateWithFallback(genAI, prompt);

      res.status(200).json({
        success: true,
        content,
        metadata: {
          artifactName,
          gateLabel,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating artifact:', error);
      res.status(500).json({
        error: 'Failed to generate artifact',
        message: error.message
      });
    }
  });
});

// ==============================================
// ENDPOINT 2: Analyze Intake Request
// ==============================================
functions.http('analyzeIntake', async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { request } = req.body;

      if (!request) {
        res.status(400).json({ error: 'Missing request data' });
        return;
      }

      const genAI = await getGeminiClient();
      const prompt = `Analyze this product intake request for Kashio Fintech:
Type: ${request.type}
Severity: ${request.severity}
Problem: ${request.problem}
Outcome: ${request.outcome}
Scope: ${request.scope?.join(', ') || 'Not defined'}
Constraints: ${request.constraints || 'None mentioned'}

Provide a concise 2-sentence ARIA Analysis recommendation. Indicate the PDLC Route (Fast Track, Discovery, or Standard) and the primary gate to start (G0 to G5).`;

      const analysis = await generateWithFallback(genAI, prompt);

      res.status(200).json({
        success: true,
        analysis,
        metadata: {
          type: request.type,
          severity: request.severity,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error analyzing intake:', error);
      res.status(500).json({
        error: 'Failed to analyze intake',
        message: error.message
      });
    }
  });
});

// ==============================================
// ENDPOINT 3: ARIA Chatbot
// ==============================================
functions.http('ariaChat', async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { message, history } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Missing message' });
        return;
      }

      const genAI = await getGeminiClient();
      const systemInstruction = `You are ARIA, the Kashio PDLC AI Agent. You are an expert in the Product Development Life Cycle, agile governance, and Kashio's product offerings (Conexión Única, Kashio Cards, etc.). Help users with questions about Gates, SLAs, Artifact generation, and strategic alignment. Keep answers professional, concise, and helpful.`;

      const response = await generateWithFallback(genAI, message, systemInstruction);

      res.status(200).json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in chat:', error);
      res.status(500).json({
        error: 'Failed to process chat',
        message: error.message
      });
    }
  });
});

// ==============================================
// HEALTH CHECK
// ==============================================
functions.http('health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'aria-api-functions',
    timestamp: new Date().toISOString()
  });
});

