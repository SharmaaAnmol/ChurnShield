/**
 * Editing one real customer on the "Try the model" page.
 * The page shows 5 inputs; the model needs 21 features. A preset loads a real customer's
 * exact 21 features (data/examples.json). When an input changes, only the features that
 * depend on it are recomputed, using the notebook's own definitions, so the rest stays real.
 */
export type Features = Record<string, number | string>;
export type InputKey = 'recency_days' | 'order_count' | 'orders_recent_90d' | 'total_spend' | 'customer_state';

export interface Example {
  key: string;
  rule: string;
  customer_unique_id: string;
  observation_date: string;
  came_back: number;
  repeat_purchase_probability: number;
  inactivity_risk_score: number;
  features: Features;
}

const n = (f: Features, k: string) => Number(f[k]);

/** Orders in the last 90 days must agree with days since the last order. */
export function recentOrderRange(f: Features): [number, number] {
  const count = n(f, 'order_count');
  return n(f, 'recency_days') >= 90 ? [0, 0] : [1, count];
}

export function editCustomer(f: Features, key: InputKey, value: number | string): Features {
  const g: Features = { ...f, [key]: value };
  if (key === 'customer_state') return g;

  if (key === 'total_spend') {
    // Same customer, bigger or smaller baskets: scale every money feature together.
    const k = Number(value) / n(f, 'total_spend');
    for (const c of ['avg_order_value', 'median_order_value', 'order_value_std', 'spend_recent_90d', 'total_freight'])
      g[c] = n(f, c) * k;
    return g;
  }

  const count = n(g, 'order_count');
  const recency = n(g, 'recency_days');
  const [lo, hi] = recentOrderRange(g);
  const recent = Math.min(hi, Math.max(lo, n(g, 'orders_recent_90d')));
  const spend = n(g, 'total_spend');

  g.orders_recent_90d = recent;
  g.has_multiple_orders = count >= 2 ? 1 : 0;
  // One order means first order = last order, so tenure equals recency.
  g.tenure_days = count === 1 ? recency : Math.max(n(f, 'tenure_days'), recency);
  // Notebook definitions: ratio = recent / total; 180 is its value for "no second order yet".
  g.avg_inter_order_days = count >= 2 ? (n(g, 'tenure_days') - recency) / (count - 1) : 180;
  if (count < 3) g.std_inter_order_days = 0;
  g.order_ratio_recent_vs_earlier = recent / count;
  if (key !== 'recency_days' || recent !== n(f, 'orders_recent_90d')) {
    g.spend_recent_90d = recent === 0 ? 0 : (spend * recent) / count;
  }
  g.spend_ratio_recent_vs_earlier = n(g, 'spend_recent_90d') / (spend + 1e-5);

  if (key === 'order_count') {
    g.avg_order_value = spend / count;
    g.median_order_value = spend / count;
    if (count === 1) g.order_value_std = 0;
    g.total_items = Math.max(count, Math.round(n(f, 'avg_items_per_order') * count));
    g.avg_items_per_order = n(g, 'total_items') / count;
    g.distinct_products = Math.min(n(f, 'distinct_products'), n(g, 'total_items'));
    g.distinct_sellers = Math.min(n(f, 'distinct_sellers'), n(g, 'total_items'));
  }
  return g;
}
