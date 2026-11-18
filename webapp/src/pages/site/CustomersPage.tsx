import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { Eyebrow, DataState } from '../../components/site/Figure';
import { useSiteData, SOURCES, pct, num } from '../../lib/data/site-data';

const WRAP = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10';
const PAGE = 25;

interface Row {
  customer_unique_id: string;
  observation_date: string;
  repeat_purchase_next_90d: number;
  inactivity_risk_score: number;
  priority_retention_target_20pct: number;
  order_count: number;
  orders_recent_90d: number;
  total_spend: number;
  recency_days: number;
  customer_state: string;
}

const tierOf = (r: number) => (r >= 0.7 ? 'High' : r >= 0.4 ? 'Moderate' : 'Low');
const TIERS = ['All', 'High', 'Moderate', 'Low'] as const;
const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

let cache: Promise<Row[]> | null = null;
function loadRows(): Promise<Row[]> {
  cache ??= fetch(`/data/${SOURCES.customers}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load /data/${SOURCES.customers} (HTTP ${r.status})`);
      return r.text();
    })
    .then((t) => Papa.parse<Row>(t, { header: true, dynamicTyping: true, skipEmptyLines: true }).data);
  cache.catch(() => (cache = null));
  return cache;
}

export function CustomersPage() {
  const { data } = useSiteData();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cohort, setCohort] = useState<string>('');
  const [tier, setTier] = useState<(typeof TIERS)[number]>('All');
  const [listOnly, setListOnly] = useState(true);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    loadRows().then(setRows, (e: Error) => setError(e.message));
  }, []);

  const cohorts = useMemo(() => [...new Set((rows ?? []).map((r) => r.observation_date))].sort(), [rows]);
  const active = cohort || cohorts[cohorts.length - 1] || '';
  const inCohort = useMemo(() => (rows ?? []).filter((r) => r.observation_date === active), [rows, active]);
  const visible = useMemo(
    () =>
      inCohort
        .filter((r) => (!listOnly || r.priority_retention_target_20pct === 1) && (tier === 'All' || tierOf(r.inactivity_risk_score) === tier))
        .sort((a, b) => b.inactivity_risk_score - a.inactivity_risk_score),
    [inCohort, listOnly, tier]
  );
  useEffect(() => setShown(PAGE), [active, tier, listOnly]);

  if (!rows) return <DataState error={error} />;

  const listed = inCohort.filter((r) => r.priority_retention_target_20pct === 1);
  const full = data?.timeline[active];

  return (
    <>
      <section className={`${WRAP} py-16 lg:py-20`}>
        <Eyebrow>Step 5 of 6 · Customers</Eyebrow>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <h1 className="font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px]">
            Who to <em className="text-route">contact first</em>
          </h1>
          <p className="max-w-[560px] text-[17px] leading-[1.6] text-ink-2">
            This is the list a retention team would work from: customers ranked by the model's risk that they won't buy
            again in the next 90 days. The riskiest 20% of each snapshot make the contact list.
          </p>
        </div>
      </section>

      <section className={`${WRAP} pb-24`}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-[18px] border border-rule bg-sheet p-5">
          <label className="block">
            <span className="text-[13px] font-semibold">Snapshot</span>
            <select
              value={active}
              onChange={(e) => setCohort(e.target.value)}
              className="mt-1 block rounded-[10px] border border-rule bg-paper px-3 py-2 text-[15px] focus:border-ink focus:outline-none"
            >
              {cohorts.map((c) => (
                <option key={c} value={c}>
                  {monthYear(c)}
                  {data?.timeline[c] ? ` · ${data.timeline[c].split}` : ''}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-[13px] font-semibold">Risk tier</legend>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tier === t}
                  onClick={() => setTier(t)}
                  className={`press rounded-full border px-3.5 py-1.5 text-[14px] font-semibold ${
                    tier === t ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper hover:border-ink-2'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 pb-2 text-[14px] font-semibold">
            <input
              type="checkbox"
              checked={listOnly}
              onChange={(e) => setListOnly(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-route)]"
            />
            Contact list only
          </label>
        </div>

        <p className="mt-4 max-w-[860px] text-[14px] leading-[1.6] text-ink-2">
          Showing a random sample of {num(inCohort.length)} of the{' '}
          {full ? num(full.totalCustomersEvaluated) : ''} customers in this snapshot (fixed seed, so it's the same every
          time). {num(listed.length)} of them are on the contact list
          {full ? `, which covers ${num(full.recommendedContactCount)} customers in the full snapshot` : ''}. The last
          column is what really happened, which the model didn't know.
        </p>

        <div className="mt-5 overflow-x-auto rounded-[18px] border border-rule bg-sheet">
          <table className="w-full min-w-[820px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b-[1.5px] border-ink text-ink-2">
                {['#', 'Customer', 'Risk', 'Tier', 'Orders (last 90d)', 'Days since last order', 'Spend', 'State', 'Came back?'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 font-semibold ${i >= 4 && i !== 7 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, shown).map((r, i) => (
                <tr key={r.customer_unique_id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-ink-2">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px]" title={r.customer_unique_id}>
                    {r.customer_unique_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[13px] font-semibold">{pct(r.inactivity_risk_score, 1)}</td>
                  <td className="px-4 py-2.5">{tierOf(r.inactivity_risk_score)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                    {r.order_count} ({r.orders_recent_90d})
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px]">{Math.round(r.recency_days)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px]">${r.total_spend.toFixed(2)}</td>
                  <td className="px-4 py-2.5">{r.customer_state}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${r.repeat_purchase_next_90d ? 'text-route' : 'text-ink-2'}`}>
                    {r.repeat_purchase_next_90d ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-2">
                    No customers in this sample match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-ink-2">
          <span>
            Showing {num(Math.min(shown, visible.length))} of {num(visible.length)}. "Orders": all orders in the last
            180 days, with the last 90 in brackets.
          </span>
          {shown < visible.length && (
            <button type="button" onClick={() => setShown((s) => s + PAGE * 2)} className="font-semibold text-route">
              Show more
            </button>
          )}
        </div>
        <p className="mt-3 font-mono text-[12px] text-ink-2">source: data/{SOURCES.customers}</p>

        <p className="mt-10 text-[15px] text-ink-2">
          Want to see why a customer scores the way they do?{' '}
          <Link to="/prediction-studio" className="font-semibold text-route">
            Try the model
          </Link>
          .
        </p>
        <Link
          to="/how-its-built"
          className="lift group mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-rule bg-sheet p-6 hover:border-ink-2 sm:p-8"
        >
          <span>
            <span className="eyebrow">Next</span>
            <span className="mt-2 block font-display text-[30px] font-semibold leading-tight">
              What is it built with? <em className="text-route">How it's built.</em>
            </span>
          </span>
          <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>
    </>
  );
}
