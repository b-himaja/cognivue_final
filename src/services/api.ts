// src/services/api.ts

export interface AnalysisResponse {
  success: boolean;
  data?: {
    url: string;
    title: string;
    screenshot: string;
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    darkPatterns: {
      urgency: string[];
      scarcity: string[];
      confirmShaming: string[];
      defaultOptIns: string[];
    };
    persuasiveLanguage: {
      emotionalWords: string[];
      actionVerbs: string[];
      superlatives: string[];
    };
    patternScores: {
      urgency: number;
      scarcity: number;
      confirmShaming: number;
      defaultOptIns: number;
    };
    insights: string[];
  };
  error?: string;
}

export async function analyzeWebsite(url: string, text?: string): Promise<AnalysisResponse> {
  try {
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // send both url and text
      body: JSON.stringify({ url, text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
