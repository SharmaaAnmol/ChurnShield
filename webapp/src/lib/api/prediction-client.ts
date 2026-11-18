/** Client for the same-origin Vercel Function webapp/api/predict.ts. */

export interface PredictionKeyDriver {
  feature: string;
  feature_label: string;
  feature_value: any;
  impact: 'positive_for_repeat' | 'negative_for_repeat' | 'neutral';
  explanation: string;
}

export interface PredictionExplanation {
  summary: string;
  recommended_retention_action: string;
  key_drivers: PredictionKeyDriver[];
}

export interface PredictionResult {
  predicted_class: number;
  prediction_label: string;
  repeat_purchase_probability: number;
  inactivity_risk_score: number;
  risk_tier: 'high' | 'moderate' | 'low';
  decision_threshold: number;
  model_name: string;
  features_received: Record<string, any>;
  explanation: PredictionExplanation;
}

// Same-origin Vercel Functions (webapp/api/*). Under plain `vite dev` they don't exist,
// and the Prediction Studio falls back to the identical in-browser engine.
// Same-origin Vercel Functions (webapp/api/*). Under plain `vite dev` they don't exist,
// and Try the model falls back to the identical in-browser engine.
const API_BASE_URL = '';

export class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Scores one customer's 21 features with /api/predict.
 */
export async function predictCustomer(features: Record<string, any>): Promise<PredictionResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(features),
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to reach /api/predict.',
      0
    );
  }

  if (!res.ok) {
    let errBody: any = null;
    try {
      errBody = await res.json();
    } catch {
      // no JSON body
    }

    const message =
      errBody?.message || errBody?.detail || `Inference request failed with HTTP ${res.status}`;
    throw new ApiError(message, res.status, errBody?.details);
  }

  return res.json();
}
