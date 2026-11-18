/**
 * Checks that /api/predict reproduces the sklearn pipeline.
 * Fixture: 40 real feature rows with sklearn predict_proba from backend/artifacts/churnshield_pipeline.joblib.
 * Run: npm run check:api
 */
import { POST } from '../api/predict';
import rows from './api-parity.fixture.json';

let maxErr = 0;
for (const { p, ...features } of rows as Array<Record<string, any>>) {
  const res = await POST(new Request('http://local/api/predict', { method: 'POST', body: JSON.stringify(features) }));
  if (res.status !== 200) throw new Error(`rejected valid row: ${JSON.stringify(await res.json())}`);
  maxErr = Math.max(maxErr, Math.abs((await res.json()).repeat_purchase_probability - p));
}
if (maxErr > 1e-4) throw new Error(`parity broken: max error ${maxErr}`);

const bad = await POST(new Request('http://local/api/predict', { method: 'POST', body: '{"recency_days":-5}' }));
if (bad.status !== 422) throw new Error(`invalid input returned ${bad.status}, expected 422`);

console.log(`api parity ok: ${rows.length} rows, max error ${maxErr.toExponential(1)}`);
