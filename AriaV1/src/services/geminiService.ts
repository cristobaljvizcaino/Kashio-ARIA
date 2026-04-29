import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, IntakeRequest } from "../types/types";

// API Key configuration
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || 'AIzaSyDBSsjUgYdsbkje53F8LKrhbYZXxa4uGi8';

console.log('🔑 Gemini API Key configurada:', apiKey ? 'SÍ (longitud: ' + apiKey.length + ')' : 'NO');

const genAI = new GoogleGenerativeAI(apiKey);

// Lista de modelos a intentar en orden de preferencia (Fallback Strategy)
// Actualizado 2026-02-12 con modelos verificados como funcionales
const GEMINI_MODELS = [
  "gemini-2.5-flash",      // Primario - Estable, rápido (Jun 2025)
  "gemini-2.5-pro",        // Fallback #1 - Más potente, análisis complejos
  "gemini-2.0-flash"       // Fallback #2 - Versión anterior estable
];

/**
 * Intenta generar contenido con múltiples modelos como fallback
 * Si un modelo falla, automáticamente intenta con el siguiente
 */
async function generateWithFallback(prompt: string, systemInstruction?: string): Promise<string> {
  let lastError: any = null;
  
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelName = GEMINI_MODELS[i];
    
    try {
      console.log(`🔄 Intentando con modelo ${i + 1}/${GEMINI_MODELS.length}: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {})
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Éxito con modelo: ${modelName}`);
      return text;
      
    } catch (error: any) {
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

export const generateArtifactContent = async (artifactName: string, fullPrompt: string): Promise<string> => {
  console.log('📝 Generando artefacto:', artifactName);
  console.log('📤 Prompt length:', fullPrompt.length, 'caracteres');
  
  try {
    // USAR EL PROMPT COMPLETO que viene como parámetro
    // (ya incluye todo: contexto + prompt + template + instrucciones)
    const systemInstruction = `Eres un Product Manager experto de Kashio. SIEMPRE debes:
1. Responder SOLO en ESPAÑOL profesional
2. Generar documentos COMPLETOS (mínimo 2,000 palabras)
3. Seguir EXACTAMENTE la estructura de la plantilla proporcionada
4. Usar TODA la información del contexto proporcionado
5. NO generar "esquemas" o "outlines" - solo documentos completos

NUNCA generes en inglés. NUNCA generes solo un resumen.`;
    
    console.log('📤 Enviando request a Gemini con system instruction en español...');
    
    const text = await generateWithFallback(fullPrompt, systemInstruction);
    
    console.log('✅ Contenido generado:', text.length, 'caracteres');
    return text;
    
  } catch (error: any) {
    console.error("❌ Gemini Error completo:", error);
    
    // Mensajes de error más descriptivos
    if (error?.message?.includes('API key')) {
      return 'Error: API Key de Gemini inválida. Contacta al administrador.';
    }
    if (error?.message?.includes('quota')) {
      return 'Error: Quota de Gemini API excedida. Intenta en unos minutos.';
    }
    
    return `Error generando contenido: ${JSON.stringify(error?.message || error)}. Por favor intenta nuevamente.`;
  }
};

export const analyzeIntakeRequest = async (request: Partial<IntakeRequest>): Promise<string> => {
  try {
    const prompt = `Analiza esta solicitud de intake para Kashio Fintech:
    Título: ${request.title}
    Tipo: ${request.type}
    Severidad: ${request.severity}
    Problema: ${request.problem}
    Resultado Esperado: ${request.outcome}
    Alcance: ${request.scope?.join(', ') || 'No definido'}
    Restricciones: ${request.constraints || 'Ninguna mencionada'}
    
    Proporciona un análisis conciso de 2-3 oraciones en ESPAÑOL sobre:
    1. La ruta recomendada en el PDLC (Fast Track, Discovery, o Estándar)
    2. El gate primario por donde debe comenzar (G0 a G5)
    3. Una observación clave o riesgo a considerar
    
    Responde de forma profesional y directa en español, sin formateo markdown.`;
    
    return await generateWithFallback(prompt);
    
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return `Error analizando request: ${error?.message || 'Error desconocido'}`;
  }
};

export const chatWithAria = async (message: string, history: ChatMessage[] = []): Promise<string> => {
  try {
    const systemInstruction = `Eres ARIA, el Agente de IA del PDLC de Kashio. Eres experto en el Ciclo de Vida de Desarrollo de Productos, gobernanza ágil, y las ofertas de productos de Kashio (Conexión Única, Kashio Cards, etc.). Ayuda a los usuarios con preguntas sobre Gates, SLAs, generación de artefactos y alineación estratégica. Mantén las respuestas profesionales, concisas y útiles. SIEMPRE responde en ESPAÑOL.`;
    
    return await generateWithFallback(message, systemInstruction);
    
  } catch (error: any) {
    console.error("ARIA Chat Error:", error);
    return `Error en chat: ${error?.message || 'Error desconocido'}. ¿Podrías intentar de nuevo?`;
  }
};
