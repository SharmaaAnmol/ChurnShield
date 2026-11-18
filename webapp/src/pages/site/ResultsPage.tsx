import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Figure, Eyebrow, DataState } from '../../components/site/Figure';
import { useSiteData, SOURCES, FEATURE_LABELS, pct, num, type SiteData, type CohortMetrics } from '../../lib/data/site-data';

const WRAP = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10';
const TICK = { fill: 'var(--color-ink-2)', fontSize: 12, fontFamily: 'Archivo, system-ui, sans-serif' };
const MONO = { fill: 'var(--color-ink)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 };
const SPLIT_NAME = { train: 'Training', validation: 'Validation', test: 'Test', all: 'All' } as const;

const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export function ResultsPage() {
  const { data, error } = useSiteData();
  if (!data) return <DataState error={error} />;
  const cohorts = Object.values(data.timeline)
    .filter((c) => c.split !== 'all')
    .sort((a, b) => a.timelineId.localeCompare(b.timelineId));
  return (
    <>
      <Intro data={data} />
      <HowTested data={data} cohorts={cohorts} />
      <WhatItCatches data={data} cohorts={cohorts} />
      <WhyFifty data={data} />
      <WhatItUses data={data} />
      <Limits data={data} />
      <section className={`${WRAP} pb-24`}>
        <Link
          to="/customers"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-rule bg-sheet p-6 hover:border-ink-2 sm:p-8"
        >
          <span>
            <span className="eyebrow">Next</span>
            <span className="mt-2 block font-display text-[30px] font-semibold leading-tight">
              Who should the team call first? <em className="text-route">See the customers.</em>
            </span>
          </span>
          <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>
    </>
  );
}

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 max-w-[820px] font-display text-[34px] font-semibold leading-[1.1] sm:text-[44px]">{title}</h2>
      <div className="mt-4 max-w-[700px] text-[16px] leading-[1.6] text-ink-2">{children}</div>
    </>
  );
}

function Intro({ data }: { data: SiteData }) {
  const { evaluation: ev } = data;
  const cm = ev.confusion_matrix;
  const stats = [
    { v: `${ev.pr_auc_lift_over_dummy.toFixed(1)}×`, l: 'better than guessing at finding returners (PR-AUC)' },
    { v: `${num(cm.tp)} of ${num(cm.tp + cm.fn)}`, l: 'real returners the model flagged' },
    { v: ev.metrics.roc_auc.toFixed(2), l: 'ROC-AUC (0.5 is a coin flip, 1.0 is perfect)' },
    { v: num(ev.test_population_size), l: `test customers it had never seen (${monthYear(ev.evaluation_cohort)})` },
  ];
  return (
    <section className={`${WRAP} py-16 lg:py-20`}>
      <Eyebrow>Results</Eyebrow>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <h1 className="font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px]">
          Does it <em className="text-route">work?</em>
        </h1>
        <p className="max-w-[560px] text-[17px] leading-[1.6] text-ink-2">
          Yes, modestly. On customers from a later quarter that it never trained on, the model ranks the few who come
          back clearly above chance. It is a prioritisation tool, not a crystal ball, and this page shows both sides.
        </p>
      </div>
      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-rule bg-rule lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="bg-sheet p-6">
            <dt className="text-[14px] text-ink-2">{s.l}</dt>
            <dd className="mt-2 font-mono text-[28px] font-semibold leading-none sm:text-[34px]">{s.v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 font-mono text-[12px] text-ink-2">source: data/{SOURCES.evaluation}</p>
    </section>
  );
}

function HowTested({ data, cohorts }: { data: SiteData; cohorts: CohortMetrics[] }) {
  const { summary } = data;
  const tone = (s: CohortMetrics['split']) =>
    s === 'test' ? 'bg-ink text-paper' : s === 'validation' ? 'bg-wash text-ink border border-ink-2' : 'bg-sheet text-ink border border-rule';
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 1 · How we tested it" title={<>Trained on the past, <em className="text-route">tested on the future</em></>}>
        <p>
          We never shuffled customers randomly. The model learned from {summary.cohort_schedule.training_cohorts.length}{' '}
          earlier snapshots, we tuned it on the next one, and the final score comes from the last snapshot, which it saw
          only once, at the end. That's how it would be used for real: trained on history, run on next quarter.
        </p>
      </SectionHead>
      <Figure n={1} source={SOURCES.timeline} className="mt-8" caption="The five quarterly snapshots and what each was used for.">
        <ol className="grid gap-3 sm:grid-cols-5">
          {cohorts.map((c) => (
            <li key={c.timelineId} className={`rounded-[12px] p-4 ${tone(c.split)}`}>
              <span className="block text-[12px] font-semibold uppercase tracking-[0.08em] opacity-80">{SPLIT_NAME[c.split]}</span>
              <span className="mt-2 block font-display text-[26px] font-semibold leading-none">{monthYear(c.timelineId)}</span>
              <span className="mt-2 block font-mono text-[13px] opacity-80">{num(c.totalCustomersEvaluated)} customers</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13px] text-ink-2">
          Each snapshot looks back {summary.observation_window_days} days for the inputs and forward{' '}
          {summary.prediction_horizon_days} days for the answer, so no snapshot's answer leaks into its inputs.
        </p>
      </Figure>
    </section>
  );
}

function WhatItCatches({ data, cohorts }: { data: SiteData; cohorts: CohortMetrics[] }) {
  const { evaluation: ev } = data;
  const cm = ev.confusion_matrix;
  const cells = [
    { n: cm.tp, t: 'Flagged, and did come back', d: 'the people we want to find', strong: true },
    { n: cm.fn, t: 'Missed: came back, not flagged', d: 'returners the model ranked too low', strong: false },
    { n: cm.fp, t: 'Flagged, but did not come back', d: 'the cost of casting a wide net', strong: false },
    { n: cm.tn, t: 'Not flagged, did not come back', d: 'correctly left alone', strong: false },
  ];
  const rows = cohorts.map((c) => ({ bucket: `${monthYear(c.timelineId)} · ${SPLIT_NAME[c.split]}`, short: monthYear(c.timelineId), lift: c.prAucLiftOverDummy, c }));
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 2 · What it gets right" title={<>It finds <em className="text-route">{pct(ev.metrics.recall, 0)}</em> of the returners</>}>
        <p>
          On the test snapshot, {num(ev.actual_repeat_purchasers)} of {num(ev.test_population_size)} customers bought
          again. The model flagged {num(cm.tp)} of them as likely to return. To catch that many it also flags{' '}
          {num(cm.fp)} who don't, because returners are so rare ({pct(ev.actual_repeat_purchasers / ev.test_population_size, 2)}).
        </p>
      </SectionHead>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Figure n={2} source={SOURCES.evaluation} caption="Test snapshot: what the model said vs what happened.">
          <div className="grid grid-cols-2 gap-3">
            {cells.map((c) => (
              <div key={c.t} className={`rounded-[12px] p-4 ${c.strong ? 'bg-route-wash' : 'bg-paper'}`}>
                <p className="font-mono text-[26px] font-semibold leading-none sm:text-[32px]">{num(c.n)}</p>
                <p className="mt-2 text-[14px] font-semibold leading-snug">{c.t}</p>
                <p className="mt-1 text-[13px] text-ink-2">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-ink-2">
            "Flagged" means a predicted chance of returning of 50% or more. Precision is {pct(ev.metrics.precision, 2)}:
            low, but {(ev.metrics.precision / (ev.actual_repeat_purchasers / ev.test_population_size)).toFixed(1)}× the base rate.
          </p>
        </Figure>
        <Figure n={3} source={SOURCES.timeline} caption="How many times better than guessing, on every snapshot (PR-AUC ÷ base rate).">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows} margin={{ top: 28, right: 64, left: 0, bottom: 4 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="var(--color-rule)" />
              <XAxis dataKey="short" tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--color-ink-2)' }} interval={0} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}×`} width={40} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip content={<LiftTip />} cursor={{ fill: 'var(--color-wash)' }} />
              <ReferenceLine
                y={1}
                stroke="var(--color-ink-2)"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={({ viewBox }: any) => (
                  <text x={viewBox.x + viewBox.width + 8} y={viewBox.y} dy={4} style={TICK} fill="var(--color-ink-2)">
                    guessing
                  </text>
                )}
              />
              <Bar dataKey="lift" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false}>
                <LabelList dataKey="lift" position="top" formatter={(v: number) => `${v.toFixed(1)}×`} style={MONO} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[13px] text-ink-2">
            The first three are snapshots it trained on, so they flatter it. The honest number is the last one, the test
            snapshot: {ev.pr_auc_lift_over_dummy.toFixed(1)}×.
          </p>
        </Figure>
      </div>
    </section>
  );
}

function LiftTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { c, bucket } = payload[0].payload as { c: CohortMetrics; bucket: string };
  return (
    <div className="rounded-[10px] border border-rule bg-sheet px-3 py-2 text-[13px] text-ink shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
      <p className="font-semibold">{bucket}</p>
      <p className="mt-1 text-ink-2">
        PR-AUC <span className="font-mono text-ink">{c.prAuc.toFixed(4)}</span> vs base rate{' '}
        <span className="font-mono text-ink">{c.baseRepeatPurchaseRate.toFixed(4)}</span>
      </p>
      <p className="text-ink-2">
        recall <span className="font-mono text-ink">{pct(c.recall, 1)}</span>
      </p>
    </div>
  );
}

function WhyFifty({ data }: { data: SiteData }) {
  const test = data.timeline[data.summary.cohort_schedule.final_test_cohort];
  const d = test.riskDistribution;
  const total = d.highRisk + d.moderateRisk + d.lowRisk;
  const tiers = [
    { k: 'Low (under 40%)', n: d.lowRisk, bg: 'var(--color-chart-1)' },
    { k: 'Moderate (40–70%)', n: d.moderateRisk, bg: 'var(--color-off)' },
    { k: 'High (70% or more)', n: d.highRisk, bg: 'var(--color-chart-2)' },
  ];
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 3 · Reading the scores" title={<>Why almost everyone is <em className="text-route">"moderate"</em></>}>
        <p>
          Returners are so rare that a normal model would learn to say "won't come back" to everyone. So we trained it
          with balanced class weights: it treats the few returners as just as important as everyone else. The side
          effect is that its scores bunch around 50%. They work as a <b className="text-ink">ranking</b>, which is how
          the team uses them, but they are not literal chances.
        </p>
      </SectionHead>
      <Figure n={4} source={SOURCES.timeline} className="mt-8" caption="Test snapshot customers by inactivity-risk tier.">
        <div className="flex h-10 overflow-hidden rounded-[8px]" aria-hidden>
          {tiers.map((t) => (
            <span key={t.k} style={{ width: `${(t.n / total) * 100}%`, background: t.bg }} className="border-r-2 border-sheet last:border-r-0" />
          ))}
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.k} className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-[3px]" style={{ background: t.bg }} />
              <div>
                <dt className="text-[14px] font-semibold">{t.k}</dt>
                <dd className="mt-1 font-mono text-[15px]">
                  {num(t.n)} <span className="text-ink-2">({pct(t.n / total, 1)})</span>
                </dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[13px] text-ink-2">
          So instead of a fixed cut-off, the team contacts the riskiest 20% of each snapshot:{' '}
          {num(test.recommendedContactCount)} customers in the test snapshot.
        </p>
      </Figure>
    </section>
  );
}

function WhatItUses({ data }: { data: SiteData }) {
  const top = [...data.importance].sort((a, b) => a.rank - b.rank).slice(0, 10);
  const max = top[0].importance_mean + top[0].importance_std;
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 4 · What it relies on" title={<>Recent orders <em className="text-route">matter most</em></>}>
        <p>
          To measure how much the model needs each input, we shuffled that one column and checked how much worse the
          ranking got (the drop in PR-AUC). The bigger the drop, the more the model relies on it. Recent buying behaviour
          leads, which matches what the data page showed.
        </p>
      </SectionHead>
      <Figure n={5} source={SOURCES.importance} className="mt-8" caption="Top 10 inputs by permutation importance (drop in PR-AUC when shuffled).">
        <ul className="grid gap-3">
          {top.map((f) => (
            <li key={f.feature} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[260px_1fr_90px]">
              <span className="text-[14px]">
                <span className="font-semibold">{FEATURE_LABELS[f.feature] ?? f.feature}</span>{' '}
                <span className="font-mono text-[11px] text-ink-2">{f.feature}</span>
              </span>
              <div className="relative h-5">
                <span
                  className="absolute inset-y-0 left-0 rounded-r-[4px] bg-[var(--color-chart-1)]"
                  style={{ width: `${(f.importance_mean / max) * 100}%` }}
                />
                {/* whisker: ± one standard deviation across shuffles */}
                <span
                  className="absolute top-1/2 h-px bg-ink"
                  style={{
                    left: `${(Math.max(0, f.importance_mean - f.importance_std) / max) * 100}%`,
                    width: `${((f.importance_mean + f.importance_std - Math.max(0, f.importance_mean - f.importance_std)) / max) * 100}%`,
                  }}
                />
              </div>
              <span className="text-right font-mono text-[13px]">{f.importance_mean.toFixed(4)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-ink-2">The thin line shows ± one standard deviation across repeated shuffles.</p>
      </Figure>
    </section>
  );
}

function Limits({ data }: { data: SiteData }) {
  const { summary } = data;
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 5 · Limits" title={<>What it <em className="text-route">can't</em> tell you</>}>
        <p>Recorded with the model's metadata in the repository, and worth saying out loud.</p>
      </SectionHead>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {summary.known_limitations.map((l) => (
          <li key={l} className="rounded-[18px] border border-rule bg-sheet p-6 text-[15px] leading-[1.6]">
            {l}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-[12px] text-ink-2">source: data/{SOURCES.summary}</p>
    </section>
  );
}
