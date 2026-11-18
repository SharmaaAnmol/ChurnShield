/**
 * POST /api/predict — Vercel Function that replaces the Render FastAPI service.
 * Runs the exported weights of the trained sklearn Balanced Logistic Regression
 * (same math as backend/app/services/predictor.py) and returns the same response shape.
 */
import { runLocalModelInference } from '../src/lib/data/model-inference-engine';

// Bounds mirror backend/app/schemas.py (the pydantic contract).
const BOUNDS: Record<string, [number, number, boolean?]> = {
  // [min, max, integer]
  order_count: [1, 50, true],
  total_spend: [0.01, 100000],
  avg_order_value: [0.01, 50000],
  median_order_value: [0.01, 50000],
  order_value_std: [0, 20000],
  total_items: [1, 100, true],
  avg_items_per_order: [1, 50],
  total_freight: [0, 10000],
  distinct_products: [1, 50, true],
  distinct_sellers: [1, 30, true],
  orders_recent_90d: [0, 50, true],
  spend_recent_90d: [0, 50000],
  freight_ratio: [0, 1],
  recency_days: [0, 365],
  tenure_days: [0, 365],
  has_multiple_orders: [0, 1, true],
  avg_inter_order_days: [0, 365],
  std_inter_order_days: [0, 180],
  order_ratio_recent_vs_earlier: [0, 1],
  spend_ratio_recent_vs_earlier: [0, 1],
};

const STATES = new Set(
  'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ')
);

export function validate(body: unknown): { values?: Record<string, number | string>; errors: string[] } {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') return { errors: ['Body must be a JSON object.'] };
  const input = body as Record<string, unknown>;
  const values: Record<string, number | string> = {};

  for (const [field, [min, max, integer]] of Object.entries(BOUNDS)) {
    const v = input[field];
    if (typeof v !== 'number' || !Number.isFinite(v)) errors.push(`${field}: must be a number`);
    else if (v < min || v > max) errors.push(`${field}: must be between ${min} and ${max}`);
    else if (integer && !Number.isInteger(v)) errors.push(`${field}: must be a whole number`);
    else values[field] = v;
  }

  const state = typeof input.customer_state === 'string' ? input.customer_state.trim().toUpperCase() : '';
  if (!STATES.has(state)) errors.push('customer_state: must be a Brazilian state code, e.g. SP');
  else values.customer_state = state;

  return errors.length ? { errors } : { values, errors };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Validation Error', message: 'Body must be valid JSON.' }, { status: 400 });
  }

  const { values, errors } = validate(body);
  if (!values) {
    return Response.json(
      { error: 'Validation Error', message: 'One or more input feature fields failed validation.', details: errors },
      { status: 422 }
    );
  }

  const r = runLocalModelInference(values);
  return Response.json({
    predicted_class: r.predictedClass,
    prediction_label: r.predictionLabel,
    repeat_purchase_probability: r.repeatPurchaseProbability,
    inactivity_risk_score: r.inactivityRiskScore,
    risk_tier: r.riskTier,
    decision_threshold: r.decisionThreshold,
    model_name: 'Balanced Logistic Regression',
    features_received: values,
    explanation: {
      summary: r.summary,
      recommended_retention_action: `${r.recommendedPlayTitle}: ${r.recommendedAction}`,
      key_drivers: r.contributions.map((c) => ({
        feature: c.feature,
        feature_label: c.label,
        feature_value: c.valueDisplay,
        impact: c.direction === 'repeat' ? 'positive_for_repeat' : 'negative_for_repeat',
        explanation: `${c.label} (${c.valueDisplay}) ${c.direction === 'repeat' ? 'raises' : 'lowers'} the chance of a repeat purchase.`,
      })),
    },
  });
}
