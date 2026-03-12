interface ChemicalPropertyResult {
  success: boolean;
  value: number | null;
  message?: string;
}

interface PythonPropertyResponse {
  success?: boolean;
  value?: number | null;
  message?: string;
  data?: {
    value?: number | null;
    success?: boolean;
    message?: string;
  };
}

const PYTHON_AI_BASE_URL = process.env.PYTHON_AI_BASE_URL || 'http://localhost:8000';

/**
 * Service for communicating with Python AI backend
 */
class AIService {
  /**
   * Makes a request to the Python AI backend
   */
  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<ChemicalPropertyResult> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${PYTHON_AI_BASE_URL}${endpoint}?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as PythonPropertyResponse;
      const normalizedValue =
        data.value ??
        data.data?.value ??
        null;

      const normalizedSuccess =
        data.success ??
        data.data?.success ??
        false;

      const normalizedMessage =
        data.message ??
        data.data?.message;

      return {
        success: normalizedSuccess,
        value: normalizedValue,
        message: normalizedMessage,
      };
    } catch (error: any) {
      console.error('Error making AI request:', error.message);
      return {
        success: false,
        value: null,
        message: error.message || 'Failed to get prediction',
      };
    }
  }

  /**
   * Predicts the density of a chemical compound
   */
  async predictDensity(
    formula: string,
    name?: string,
    conditions: string = 'standard conditions'
  ): Promise<ChemicalPropertyResult> {
    return this.makeRequest('/predict/density', {
      formula,
      name: name || formula,
      conditions,
    });
  }

  /**
   * Predicts the molar mass of a chemical compound
   */
  async predictMolarMass(
    formula: string,
    name?: string,
    conditions: string = 'standard conditions'
  ): Promise<ChemicalPropertyResult> {
    return this.makeRequest('/predict/molar-mass', {
      formula,
      name: name || formula,
      conditions,
    });
  }
}

export const aiService = new AIService();
