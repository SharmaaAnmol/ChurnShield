/**
 * ChurnShield Frontend API Client
 * Connects the React application to the FastAPI Python backend for real ML model inference.
 */

export interface ModelHealth {
  status: string;
  model_loaded: boolean;
  model_type: string;
  version: string;
}

export interface ModelInfo {
  model_name: string;
  version: string;
  target_variable: string;
  target_definition: string;
  positive_class: string;
  negative_class: string;
  inactivity_formula: string;
  decision_threshold: number;
  primary_selection_metric: string;
  validation_pr_auc: number;
  test_pr_auc: number;
  pr_auc_lift_over_dummy: number;
  features_count: number;
  features_order: string[];
}

export interface FeatureSchemaItem {
  name: string;
  label: string;
  type: 'number' | 'integer' | 'boolean' | 'select';
  group: string;
  min?: number;
  max?: number;
  step?: number;
  default: any;
  unit?: string;
  description: string;
  options?: string[];
}

export interface FeatureGroup {
  id: string;
  title: string;
  description: string;
}

export interface FeaturePreset {
  id: string;
  name: string;
  description: string;
  values: Record<string, any>;
}

export interface ModelSchema {
  version: string;
  target_variable: string;
  positive_class_label: string;
  negative_class_label: string;
  inactivity_formula: string;
  decision_threshold: number;
  groups: FeatureGroup[];
  features: FeatureSchemaItem[];
  presets: FeaturePreset[];
}

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

const RAW_API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:8000';
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

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
 * Checks backend connectivity and model readiness.
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; health?: ModelHealth; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: ModelHealth = await res.json();
      return { isOnline: true, health: data };
    }
    return { isOnline: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    return {
      isOnline: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Service offline or unreachable',
    };
  }
}

/**
 * Fetches verified feature schema from the backend.
 */
export async function fetchModelSchema(): Promise<ModelSchema> {
  const res = await fetch(`${API_BASE_URL}/api/model-schema`);
  if (!res.ok) {
    throw new ApiError(`Failed to fetch model schema: HTTP ${res.status}`, res.status);
  }
  return res.json();
}

/**
 * Fetches model info and metrics.
 */
export async function fetchModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE_URL}/api/model-info`);
  if (!res.ok) {
    throw new ApiError(`Failed to fetch model info: HTTP ${res.status}`, res.status);
  }
  return res.json();
}

/**
 * Submits real customer feature record to the FastAPI backend for prediction.
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
      'Unable to connect to the ChurnShield prediction service. Please ensure the backend server is running.',
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
