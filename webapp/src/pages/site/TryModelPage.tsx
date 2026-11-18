import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Figure, Eyebrow } from '../../components/site/Figure';
import { pct, num, useSiteData } from '../../lib/data/site-data';
import examplesFile from '../../../public/data/examples.json';
import { EXACT_MODEL_WEIGHTS as W, runLocalModelInference } from '../../lib/data/model-inference-engine';
import { predictCustomer } from '../../lib/api/prediction-client';
import { editCustomer, recentOrderRange, type Example, type Features, type InputKey } from '../../lib/data/customer-edit';

const WRAP = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10';
const SOURCE = 'examples.json';
const EX = examplesFile as unknown as {
  cohort: string;
  cohort_customers: number;
  cohort_repeat_rate: number;
  contact_list_size: number;
  contact_threshold: number;
  customers: Example[];
};
const SHORT: Record<string, string> = {
  lowest: 'Lowest risk',
  typical: 'Typical',
  returner: 'Came back',
  highest: 'Highest risk',
};
const STATES = Object.keys(W.cat_weights).sort();

/** The 21 features, grouped under the 5 things a person can change on this page. */
const GROUPS: Array<{ key: InputKey; label: string; features: string[] }> = [
  { key: 'recency_days', label: 'Days since last order', features: ['recency_days', 'tenure_days', 'avg_inter_order_days', 'std_inter_order_days'] },
  { key: 'orders_recent_90d', label: 'Orders in the last 90 days', features: ['orders_recent_90d', 'order_ratio_recent_vs_earlier', 'spend_recent_90d', 'spend_ratio_recent_vs_earlier'] },
  { key: 'order_count', label: 'Number of orders', features: ['order_count', 'has_multiple_orders', 'total_items', 'avg_items_per_order', 'distinct_products', 'distinct_sellers'] },
  { key: 'total_spend', label: 'Spend', features: ['total_spend', 'avg_order_value', 'median_order_value', 'order_value_std', 'total_freight', 'freight_ratio'] },
  { key: 'customer_state', label: 'State', features: ['customer_state'] },
];

/** Each feature's push on the model's log-odds, against an average training customer. */
function effects(f: Features): Record<string, number> {
  const out: Record<string, number> = { customer_state: W.cat_weights[String(f.customer_state)] ?? 0 };
  for (const [k, p] of Object.entries(W.num_weights)) out[k] = (p.coef * (Number(f[k]) - p.mean)) / p.scale;
  return out;
}

const tierOf = (risk: number) => (risk >= 0.7 ? 'High' : risk >= 0.4 ? 'Moderate' : 'Low');
const fmt = (k: string, v: number | string) => {
  if (typeof v === 'string') return v;
  if (k.includes('ratio')) return `${(v * 100).toFixed(0)}%`;
  if (k.includes('spend') || k.includes('value') || k.includes('freight') || k === 'order_value_std') return `$${v.toFixed(2)}`;
  if (k.includes('days')) return v.toFixed(1);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

export function TryModelPage() {
  const [preset, setPreset] = useState<Example>(EX.customers[1]);
  const [f, setF] = useState<Features>(preset.features);
  const edited = f !== preset.features;

  const local = useMemo(() => runLocalModelInference(f), [f]);
  const [api, setApi] = useState<{ for: Features; p: number } | null>(null);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      predictCustomer(f).then(
        (r) => {
          setApi({ for: f, p: r.repeat_purchase_probability });
          setApiDown(false);
        },
        () => setApiDown(true)
      );
    }, 300);
    return () => clearTimeout(t);
  }, [f]);

  const fromApi = api?.for === f;
  const pRepeat = fromApi ? api!.p : local.repeatPurchaseProbability;
  const risk = 1 - pRepeat;

  const choose = (ex: Example) => {
    setPreset(ex);
    setF(ex.features);
  };
  const set = (k: InputKey, v: number | string) => setF((cur) => editCustomer(cur, k, v));

  return (
    <>
      <section className={`${WRAP} py-16 lg:py-20`}>
        <Eyebrow>Try the model</Eyebrow>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <h1 className="font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px]">
            Score one <em className="text-route">customer</em>
          </h1>
          <p className="max-w-[560px] text-[17px] leading-[1.6] text-ink-2">
            Start from a real customer the model never saw in training (the {monthYear(EX.cohort)} test snapshot). Change
            what you know about them and watch the score, and the reasons behind it, move.
          </p>
        </div>
      </section>

      <section className={`${WRAP} grid gap-8 pb-16 lg:grid-cols-[1fr_1.05fr] lg:items-start`}>
        <div className="rounded-[18px] border border-rule bg-sheet p-6 sm:p-8">
          <h2 className="text-[15px] font-semibold">1. Pick a real customer</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EX.customers.map((ex) => {
              const on = ex === preset;
              return (
                <button
                  key={ex.key}
                  type="button"
                  onClick={() => choose(ex)}
                  aria-pressed={on}
                  title={ex.rule}
                  className={`rounded-[12px] border px-3 py-3 text-left transition-colors ${
                    on ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper hover:border-ink-2'
                  }`}
                >
                  <span className="block text-[14px] font-semibold">{SHORT[ex.key] ?? ex.key}</span>
                  <span className={`mt-1 block font-mono text-[12px] ${on ? 'opacity-80' : 'text-ink-2'}`}>
                    risk {pct(ex.inactivity_risk_score, 1)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] leading-[1.5] text-ink-2">
            {preset.rule}. Customer <span className="font-mono">{preset.customer_unique_id.slice(0, 8)}…</span>
          </p>

          <div className="mt-8 flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-semibold">2. Change what you know</h2>
            {edited && (
              <button
                type="button"
                onClick={() => setF(preset.features)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-route"
              >
                <RotateCcw size={14} aria-hidden /> Back to the real customer
              </button>
            )}
          </div>
          <Inputs f={f} set={set} />
          <p className="mt-5 text-[13px] leading-[1.5] text-ink-2">
            The model reads 21 numbers about this customer. You change 5; the ones that depend on them (average basket,
            share of recent orders, and so on) are recalculated the way the notebook defines them. Everything else stays
            as the real customer had it.
          </p>
        </div>

        <Result risk={risk} pRepeat={pRepeat} preset={preset} edited={edited} fromApi={fromApi} apiDown={apiDown} />
      </section>

      <Reasons f={f} />
      <Action f={f} risk={risk} />

      <section className={`${WRAP} pb-24`}>
        <Link
          to="/model"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-rule bg-sheet p-6 hover:border-ink-2 sm:p-8"
        >
          <span>
            <span className="eyebrow">Next</span>
            <span className="mt-2 block font-display text-[30px] font-semibold leading-tight">
              How do we know it works? <em className="text-route">See the results.</em>
            </span>
          </span>
          <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>
    </>
  );
}

function monthYear(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-[14px] font-semibold">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-[12px] text-ink-2">{hint}</span>}
    </label>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
  unit,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[var(--color-route)] disabled:cursor-not-allowed disabled:opacity-40"
      />
      <span className="w-[72px] shrink-0 text-right font-mono text-[15px] font-semibold">
        {Math.round(value)}
        {unit}
      </span>
    </div>
  );
}

function Inputs({ f, set }: { f: Features; set: (k: InputKey, v: number | string) => void }) {
  const [lo, hi] = recentOrderRange(f);
  const [spendText, setSpendText] = useState(String(Number(f.total_spend).toFixed(2)));
  useEffect(() => setSpendText(Number(f.total_spend).toFixed(2)), [f.total_spend]);

  const commitSpend = () => {
    const v = Number(spendText);
    if (Number.isFinite(v) && v >= 1 && v <= 10000) set('total_spend', v);
    else setSpendText(Number(f.total_spend).toFixed(2));
  };

  return (
    <div className="mt-5 grid gap-6">
      <Field label="Days since their last order">
        <Slider value={Number(f.recency_days)} min={0} max={179} unit=" d" onChange={(v) => set('recency_days', v)} />
      </Field>
      <Field label="Orders in the last 180 days">
        <Slider value={Number(f.order_count)} min={1} max={10} onChange={(v) => set('order_count', v)} />
      </Field>
      <Field
        label="…of which in the last 90 days"
        hint={
          hi === 0
            ? 'Has to be 0: their last order was 90 or more days ago.'
            : 'At least 1, because their last order was under 90 days ago.'
        }
      >
        <Slider
          value={Number(f.orders_recent_90d)}
          min={lo}
          max={Math.max(hi, lo + 1)}
          disabled={lo === hi}
          onChange={(v) => set('orders_recent_90d', Math.min(v, hi))}
        />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Total spend ($)" hint="All orders in the last 180 days, $1 to $10,000.">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={10000}
            step="0.01"
            value={spendText}
            onChange={(e) => setSpendText(e.target.value)}
            onBlur={commitSpend}
            onKeyDown={(e) => e.key === 'Enter' && commitSpend()}
            className="w-full rounded-[10px] border border-rule bg-paper px-3 py-2.5 font-mono text-[15px] focus:border-ink focus:outline-none"
          />
        </Field>
        <Field label="State">
          <select
            value={String(f.customer_state)}
            onChange={(e) => set('customer_state', e.target.value)}
            className="w-full rounded-[10px] border border-rule bg-paper px-3 py-2.5 text-[15px] focus:border-ink focus:outline-none"
          >
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Result({
  risk,
  pRepeat,
  preset,
  edited,
  fromApi,
  apiDown,
}: {
  risk: number;
  pRepeat: number;
  preset: Example;
  edited: boolean;
  fromApi: boolean;
  apiDown: boolean;
}) {
  const onList = risk >= EX.contact_threshold;
  return (
    <div className="lg:sticky lg:top-24">
      <Figure
        n={1}
        plate
        source={SOURCE}
        caption={edited ? 'Score for your edited customer.' : 'Score for this real customer, as the model saw them.'}
      >
        <p className="text-[14px] text-ink-2">Risk of not buying again in the next 90 days</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">
          <p className="font-mono text-[64px] font-semibold leading-none sm:text-[80px]" aria-live="polite">
            {pct(risk, 1)}
          </p>
          <p className="mb-2 rounded-full border border-current px-3 py-1 text-[13px] font-semibold">
            {tierOf(risk)} risk
          </p>
        </div>

        <Meter risk={risk} />

        <dl className="mt-8 grid gap-4 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-ink-2">Model's call</dt>
            <dd className="mt-1 font-semibold">{pRepeat >= 0.5 ? 'Likely to come back' : 'Unlikely to come back'}</dd>
          </div>
          <div>
            <dt className="text-ink-2">Contact list</dt>
            <dd className="mt-1 font-semibold">
              {onList ? 'Yes, in the riskiest 20%' : 'No, below the riskiest 20%'}
            </dd>
          </div>
          {!edited && (
            <div className="sm:col-span-2">
              <dt className="text-ink-2">What really happened</dt>
              <dd className="mt-1 font-semibold">
                {preset.came_back ? 'They did buy again within 90 days.' : 'They did not buy again within 90 days.'}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-8 border-t border-current/20 pt-4 text-[13px] leading-[1.55] text-ink-2">
          Read this as a ranking, not a literal chance. The model was trained with balanced class weights, so most
          scores sit near 50%, while only {pct(EX.cohort_repeat_rate, 2)} of the {num(EX.cohort_customers)} test
          customers actually came back. The team would contact the riskiest 20% ({num(EX.contact_list_size)} people,
          risk {pct(EX.contact_threshold, 1)} or more).
        </p>
        <p className="mt-3 font-mono text-[12px] text-ink-2">
          {fromApi ? 'scored by /api/predict' : apiDown ? 'scored in your browser (API not reachable)' : 'scoring…'}
        </p>
      </Figure>
    </div>
  );
}

function Meter({ risk }: { risk: number }) {
  return (
    <div className="mt-6" aria-hidden>
      <div className="relative h-3 rounded-full bg-current/15">
        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-route)]" style={{ width: `${risk * 100}%` }} />
        {[0.4, 0.7].map((t) => (
          <span key={t} className="absolute -inset-y-1 w-px bg-current/60" style={{ left: `${t * 100}%` }} />
        ))}
      </div>
      <div className="relative mt-2 h-4 font-mono text-[11px] text-ink-2">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2" style={{ left: '40%' }}>
          40% moderate
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: '70%' }}>
          70% high
        </span>
        <span className="absolute right-0">100%</span>
      </div>
    </div>
  );
}

function Reasons({ f }: { f: Features }) {
  const e = effects(f);
  const groups = GROUPS.map((g) => ({ ...g, effect: g.features.reduce((s, k) => s + e[k], 0) })).sort(
    (a, b) => Math.abs(b.effect) - Math.abs(a.effect)
  );
  const max = Math.max(...groups.map((g) => Math.abs(g.effect)), 0.5);

  return (
    <section className={`${WRAP} pb-16`}>
      <Eyebrow>Why this score</Eyebrow>
      <h2 className="mt-3 max-w-[760px] font-display text-[34px] font-semibold leading-[1.1] sm:text-[44px]">
        What pushed the score <em className="text-route">up or down</em>
      </h2>
      <p className="mt-4 max-w-[680px] text-[16px] leading-[1.6] text-ink-2">
        Logistic regression adds up one push per feature. Each bar is the total push from one of your five inputs,
        compared with an average customer in the training data. Bars to the left make a return less likely and raise
        the risk; bars to the right make it more likely.
      </p>

      <Figure n={2} source="model_weights.json" className="mt-8" caption="Push on the model's score, grouped by input.">
        <ul className="grid gap-4">
          {groups.map((g) => {
            const w = (Math.abs(g.effect) / max) * 50;
            const back = g.effect >= 0;
            return (
              <li key={g.key} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[200px_1fr_170px]">
                <span className="text-[14px] font-semibold">{g.label}</span>
                <div className="relative h-6">
                  <span className="absolute inset-y-[-4px] left-1/2 w-px bg-ink-2" />
                  <span
                    className="absolute inset-y-0 rounded-[4px]"
                    style={{
                      width: `${w}%`,
                      left: back ? '50%' : `${50 - w}%`,
                      background: back ? 'var(--color-chart-1)' : 'var(--color-chart-2)',
                    }}
                  />
                </div>
                <span className="text-[13px] text-ink-2">
                  <span className="font-mono text-ink">{g.effect >= 0 ? '+' : '−'}{Math.abs(g.effect).toFixed(2)}</span>{' '}
                  {Math.abs(g.effect) < 0.05 ? 'barely matters' : back ? 'toward coming back' : 'toward not coming back'}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-[var(--color-chart-2)]" /> raises the risk
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-[var(--color-chart-1)]" /> lowers the risk
          </span>
          <span>Units: change in log-odds.</span>
        </div>

        <details className="mt-5 text-[14px]">
          <summary className="cursor-pointer select-none font-semibold text-route">Show all 21 features</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b-[1.5px] border-ink text-ink-2">
                  <th className="py-2 pr-4 font-semibold">Feature</th>
                  <th className="py-2 pr-4 font-semibold">Input group</th>
                  <th className="py-2 pr-4 text-right font-semibold">Value</th>
                  <th className="py-2 text-right font-semibold">Push</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {GROUPS.flatMap((g) =>
                  g.features.map((k) => (
                    <tr key={k} className="border-b border-rule">
                      <td className="py-2 pr-4">{k}</td>
                      <td className="py-2 pr-4 font-ui text-[14px] text-ink-2">{g.label}</td>
                      <td className="py-2 pr-4 text-right">{fmt(k, f[k] as number | string)}</td>
                      <td className="py-2 text-right">{e[k] >= 0 ? '+' : '−'}{Math.abs(e[k]).toFixed(3)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </details>
      </Figure>
    </section>
  );
}

function Action({ f, risk }: { f: Features; risk: number }) {
  const { data } = useSiteData();
  const onList = risk >= EX.contact_threshold;
  const recency = Math.round(Number(f.recency_days));
  const count = Number(f.order_count);
  const detail =
    count === 1
      ? `They have ordered once, ${recency} days ago. Turning a first order into a second is the step that matters most${data ? `: ${pct(data.eda.one_order_share, 1)} of customer snapshots in the data have only one order` : ''}.`
      : `They have ordered ${count} times, the last one ${recency} days ago. Repeat buyers are the most likely to return, so a reminder while the habit is fresh is worth it.`;
  return (
    <section className={`${WRAP} pb-16`}>
      <Eyebrow>What the team would do</Eyebrow>
      <div className="mt-4 grid gap-6 rounded-[18px] border border-rule bg-sheet p-6 sm:p-8 lg:grid-cols-[1fr_1.4fr]">
        <p className="font-display text-[30px] font-semibold leading-[1.1] sm:text-[36px]">
          {onList ? (
            <>
              Contact them <em className="text-route">this quarter.</em>
            </>
          ) : (
            <>
              No outreach <em className="text-route">for now.</em>
            </>
          )}
        </p>
        <div className="text-[16px] leading-[1.6] text-ink-2">
          <p>
            {onList
              ? `A risk of ${pct(risk, 1)} puts them in the riskiest 20% of the test snapshot, the group the retention team works through first.`
              : `A risk of ${pct(risk, 1)} is below the ${pct(EX.contact_threshold, 1)} cut-off for the riskiest 20%, so the team spends its effort elsewhere.`}
          </p>
          {onList && <p className="mt-3">{detail}</p>}
        </div>
      </div>
    </section>
  );
}
