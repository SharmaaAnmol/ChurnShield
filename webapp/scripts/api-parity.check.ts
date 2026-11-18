/**
 * Checks that /api/predict reproduces the sklearn pipeline.
 * Fixture: 40 real feature rows with sklearn predict_proba from backend/artifacts/churnshield_pipeline.joblib.
 * Run: npm run check:api
 */
import { POST } from '../api/predict';
import rows from './api-parity.fixture.json';
import examples from '../public/data/examples.json';
import { validate } from '../api/predict';
import { runLocalModelInference } from '../src/lib/data/model-inference-engine';
import { editCustomer, type Example, type InputKey } from '../src/lib/data/customer-edit';

let maxErr = 0;
for (const { p, ...features } of rows as Array<Record<string, any>>) {
  const res = await POST(new Request('http://local/api/predict', { method: 'POST', body: JSON.stringify(features) }));
  if (res.status !== 200) throw new Error(`rejected valid row: ${JSON.stringify(await res.json())}`);
  maxErr = Math.max(maxErr, Math.abs((await res.json()).repeat_purchase_probability - p));
}
if (maxErr > 1e-4) throw new Error(`parity broken: max error ${maxErr}`);

const bad = await POST(new Request('http://local/api/predict', { method: 'POST', body: '{"recency_days":-5}' }));
if (bad.status !== 422) throw new Error(`invalid input returned ${bad.status}, expected 422`);

// Try-the-model presets: unedited they reproduce the exported sklearn score; edited they stay valid API input.
const sweep: Array<[InputKey, number[]]> = [
  ['recency_days', [0, 45, 89, 90, 179]],
  ['order_count', [1, 2, 5, 10]],
  ['orders_recent_90d', [0, 1, 3, 10]],
  ['total_spend', [5, 100, 3000]],
];
for (const ex of examples.customers as Example[]) {
  const err = Math.abs(runLocalModelInference(ex.features).repeatPurchaseProbability - ex.repeat_purchase_probability);
  if (err > 1e-4) throw new Error(`example ${ex.key} drifted: ${err}`);
  for (const [k1, v1s] of sweep)
    for (const v1 of v1s)
      for (const [k2, v2s] of sweep)
        for (const v2 of v2s) {
          const f = editCustomer(editCustomer(ex.features, k1, v1), k2, v2);
          const { errors } = validate(f);
          if (errors.length) throw new Error(`${ex.key} ${k1}=${v1} ${k2}=${v2}: ${errors.join('; ')}`);
          if (Number(f.recency_days) >= 90 && f.orders_recent_90d !== 0) throw new Error(`${ex.key}: recent orders after 90 days`);
        }
}

console.log(`api parity ok: ${rows.length} rows, max error ${maxErr.toExponential(1)}`);
