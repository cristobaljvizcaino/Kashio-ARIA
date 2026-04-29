/**
 * API Service for ARIA
 * 
 * Calls Cloud Functions backend API instead of Gemini directly
 * This keeps API keys secure in Secret Manager
 */

const API_BASE_URL = 'https://us-central1-kashio-squad-nova.cloudfunctions.net';

interface IntakeRequest {
  type?: string;
  severity?: string;
  problem?: string;
  outcome?: string;
  scope?: string[];
  constraints?: string;
}

/**
 * Generate artifact content via Cloud Function
 */
export async function generateArtifactContent(
  artifactName: string,
  gateLabel: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/generateArtifact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artifactName, gateLabel })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || '';
    
  } catch (error) {
    console.error('Error generating artifact:', error);
    return 'Error generating content via Cloud Function. Please try again.';
  }
}

/**
 * Analyze intake request via Cloud Function
 */
export async function analyzeIntakeRequest(
  request: Partial<IntakeRequest>
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyzeIntake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ request })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis || '';
    
  } catch (error) {
    console.error('Error analyzing intake:', error);
    return 'Error analyzing request via Cloud Function. Please try again.';
  }
}

/**
 * Chat with ARIA via Cloud Function
 */
export async function chatWithAria(
  message: string,
  history?: Array<{role: string, content: string}>
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/ariaChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
    
  } catch (error) {
    console.error('Error in chat:', error);
    return 'Error communicating with ARIA. Please try again.';
  }
}

export default {
  generateArtifactContent,
  analyzeIntakeRequest,
  chatWithAria
};

