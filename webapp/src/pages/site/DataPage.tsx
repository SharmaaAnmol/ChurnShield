import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Figure, Eyebrow, DataState } from '../../components/site/Figure';
import { CountBars, NumbersTable, RateBars, RateRankBars, SpendLines, ratePct } from '../../components/site/charts';
import { useSiteData, SOURCES, pct, num, type RateRow, type SiteData } from '../../lib/data/site-data';

const WRAP = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10';

const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const times = (a: number, b: number) => `${(a / b).toFixed(1)}×`;

export function DataPage() {
  const { data, error } = useSiteData();
  if (!data) return <DataState error={error} />;
  return (
    <>
      <Intro data={data} />
      <WhoAreThey data={data} />
      <WhatPredicts data={data} />
      <WhatDoesNot data={data} />
      <NextStep />
    </>
  );
}

function Intro({ data }: { data: SiteData }) {
  const { eda, summary } = data;
  const stats = [
    { v: num(eda.rows), l: 'customer snapshots' },
    { v: num(eda.unique_customers), l: 'different customers' },
    { v: String(eda.cohorts.length), l: 'quarterly snapshots' },
    { v: pct(eda.repeat_rate, 2), l: `bought again within ${summary.prediction_horizon_days} days` },
  ];
  return (
    <section className={`${WRAP} py-16 lg:py-20`}>
      <Eyebrow>Step 2 of 6 · Exploratory data analysis</Eyebrow>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <h1 className="font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px]">
          What the data <em className="text-route">shows</em>
        </h1>
        <p className="max-w-[560px] text-[17px] leading-[1.6] text-ink-2">
          Before training anything, we looked at who the customers are and what separates the few who come back. Each
          snapshot is one customer on one cutoff date: their last {summary.observation_window_days} days of orders, and
          whether they ordered again in the next {summary.prediction_horizon_days}. Source: {summary.dataset_source}.
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
      <p className="mt-3 font-mono text-[12px] text-ink-2">source: data/{SOURCES.eda}</p>
    </section>
  );
}

function Section({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro: string; children: ReactNode }) {
  return (
    <section className={`${WRAP} border-t-[1.5px] border-ink pt-14 pb-6`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end">
        <h2 className="font-display text-[40px] font-semibold leading-none sm:text-[52px]">{title}</h2>
        <p className="max-w-[520px] text-[17px] leading-[1.6] text-ink-2 lg:justify-self-end">{intro}</p>
      </div>
      <div className="mt-10 grid gap-12">{children}</div>
    </section>
  );
}

/** One figure: the question, the computed answer, the chart, its caption and its numbers. */
function Fig({
  n,
  question,
  answer,
  caption,
  source = SOURCES.eda,
  table,
  children,
}: {
  n: number;
  question: string;
  answer: ReactNode;
  caption: string;
  source?: string;
  table?: { rows: RateRow[]; bucketLabel: string };
  children: ReactNode;
}) {
  return (
    <Figure n={n} caption={caption} source={source}>
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div>
          <h3 className="text-[20px] font-bold leading-snug">{question}</h3>
          <p className="mt-3 text-[16px] leading-[1.6] text-ink-2">{answer}</p>
        </div>
        <div className="min-w-0">
          {children}
          {table && <NumbersTable rows={table.rows} bucketLabel={table.bucketLabel} />}
        </div>
      </div>
    </Figure>
  );
}

const B = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-ink">{children}</strong>;

function WhoAreThey({ data }: { data: SiteData }) {
  const { eda, summary } = data;
  const cohorts = eda.cohorts.map((r) => ({ ...r, bucket: monthYear(r.bucket) }));
  const first = cohorts[0];
  const last = cohorts[cohorts.length - 1];
  const rates = eda.cohorts.map((r) => r.repeat_rate);
  const once = eda.by_order_count[0];
  const train = summary.cohort_schedule.training_cohorts.map(monthYear).join(', ');

  return (
    <Section
      eyebrow="Part 1"
      title={<>Who are the <em className="text-route">customers?</em></>}
      intro="A growing marketplace, where almost everyone buys once and leaves. That shapes everything the model can learn."
    >
      <Fig
        n={1}
        question="How many customers are in each snapshot?"
        answer={
          <>
            The marketplace grew fast: from <B>{num(first.customers)}</B> active customers in {first.bucket} to{' '}
            <B>{num(last.customers)}</B> in {last.bucket}.
          </>
        }
        caption={`Customers per quarterly snapshot. The model trains on ${train}, is tuned on ${monthYear(summary.cohort_schedule.validation_cohort)}, and is tested on ${monthYear(summary.cohort_schedule.final_test_cohort)}.`}
        table={{ rows: cohorts, bucketLabel: 'Snapshot' }}
      >
        <CountBars rows={cohorts} xLabel="Snapshot (cutoff date)" />
      </Fig>

      <Fig
        n={2}
        question="How many of them come back?"
        answer={
          <>
            Very few. In every snapshot, only <B>{ratePct(Math.min(...rates))}</B> to <B>{ratePct(Math.max(...rates))}</B> of
            customers bought again within {summary.prediction_horizon_days} days. A model that always says "won't come
            back" is right over {pct(1 - eda.repeat_rate, 0)} of the time and useless, so accuracy is the wrong score here.
          </>
        }
        caption="Share of customers who bought again within the outcome window, per snapshot. Dashed line: all snapshots together."
        table={{ rows: cohorts, bucketLabel: 'Snapshot' }}
      >
        <RateBars rows={cohorts} average={eda.repeat_rate} xLabel="Snapshot (cutoff date)" />
      </Fig>

      <Fig
        n={3}
        question="How many orders does a typical customer have?"
        answer={
          <>
            One. <B>{pct(eda.one_order_share)}</B> of snapshots have a single order in the last{' '}
            {summary.observation_window_days} days ({num(once.customers)} of {num(eda.rows)}). Repeat buyers are rare, which
            is exactly why they matter.
          </>
        }
        caption={`Customers by number of orders in the ${summary.observation_window_days}-day lookback. Labels show the share of all snapshots.`}
        table={{ rows: eda.by_order_count, bucketLabel: 'Orders' }}
      >
        <CountBars rows={eda.by_order_count} xLabel="Orders before the cutoff" showShare />
      </Fig>
    </Section>
  );
}

function WhatPredicts({ data }: { data: SiteData }) {
  const { eda, summary } = data;
  const oc = eda.by_order_count;
  const ro = eda.by_recent_orders;
  const rc = eda.by_recency;
  const ocTop = oc[oc.length - 1];
  const roTop = ro[ro.length - 1];

  return (
    <Section
      eyebrow="Part 2"
      title={<>What predicts a <em className="text-route">return?</em></>}
      intro="Three habits separate returning customers from the rest. These are the signals the model leans on."
    >
      <Fig
        n={4}
        question="Do loyal customers come back more?"
        answer={
          <>
            Yes, by far the strongest signal. Customers with <B>{ocTop.bucket} orders</B> came back{' '}
            <B>{ratePct(ocTop.repeat_rate)}</B> of the time, {times(ocTop.repeat_rate, oc[0].repeat_rate)} more often than
            one-time buyers ({ratePct(oc[0].repeat_rate)}).
          </>
        }
        caption={`Repeat rate by number of orders in the lookback. Dashed line: average across all ${num(eda.rows)} snapshots.`}
        table={{ rows: oc, bucketLabel: 'Orders' }}
      >
        <RateBars rows={oc} average={eda.repeat_rate} unit=" orders" xLabel="Orders before the cutoff" />
      </Fig>

      <Fig
        n={5}
        question="Does recent activity matter?"
        answer={
          <>
            Yes. Customers with <B>{roTop.bucket} orders in the last 90 days</B> came back{' '}
            <B>{ratePct(roTop.repeat_rate)}</B> of the time, {times(roTop.repeat_rate, ro[0].repeat_rate)} the rate of
            customers with none ({ratePct(ro[0].repeat_rate)}).
          </>
        }
        caption="Repeat rate by number of orders in the 90 days before the cutoff."
        table={{ rows: ro, bucketLabel: 'Orders in last 90 days' }}
      >
        <RateBars rows={ro} average={eda.repeat_rate} unit=" recent orders" xLabel="Orders in the last 90 days" />
      </Fig>

      <Fig
        n={6}
        question="Does it matter how long ago they last ordered?"
        answer={
          <>
            Yes. The longer since the last order, the less likely a return:{' '}
            <B>{ratePct(rc[0].repeat_rate)}</B> for customers seen in the last {rc[0].bucket} days, falling to{' '}
            <B>{ratePct(rc[rc.length - 1].repeat_rate)}</B> at {rc[rc.length - 1].bucket} days.
          </>
        }
        caption={`Repeat rate by days between the last order and the cutoff (lookback is ${summary.observation_window_days} days).`}
        table={{ rows: rc, bucketLabel: 'Days since last order' }}
      >
        <RateBars rows={rc} average={eda.repeat_rate} unit=" days since last order" xLabel="Days since last order" />
      </Fig>
    </Section>
  );
}

function WhatDoesNot({ data }: { data: SiteData }) {
  const { eda, summary } = data;
  const sp = eda.by_spend;
  const spRates = sp.map((r) => r.repeat_rate);
  const st = eda.by_state_top10;
  const stRates = st.map((r) => r.repeat_rate);
  const topShare = st[0].customers / eda.rows;

  return (
    <Section
      eyebrow="Part 3"
      title={<>What <em className="text-route">doesn't</em> help much</>}
      intro="Some things you might expect to matter barely move the needle. Knowing this keeps the model honest."
    >
      <Fig
        n={7}
        question="Do big spenders come back more?"
        answer={
          <>
            Not really. Customers who came back and customers who didn't have almost the same spending pattern; the two
            lines overlap. By spend band, repeat rates only range from <B>{ratePct(Math.min(...spRates))}</B> to{' '}
            <B>{ratePct(Math.max(...spRates))}</B>.
          </>
        }
        caption="Spend distribution of each group (each line sums to 100%). Solid: came back. Dashed: did not."
        table={{ rows: sp, bucketLabel: 'Spend band' }}
      >
        <SpendLines
          bins={eda.spend_histogram}
          xLabel={`Total spend in the last ${summary.observation_window_days} days (log scale)`}
        />
      </Fig>

      <Fig
        n={8}
        question="Does where they live matter?"
        answer={
          <>
            Location mostly sets volume, not loyalty. {st[0].bucket} alone holds <B>{pct(topShare, 0)}</B> of snapshots,
            but across the ten biggest states the repeat rate stays between <B>{ratePct(Math.min(...stRates))}</B> and{' '}
            <B>{ratePct(Math.max(...stRates))}</B>.
          </>
        }
        caption="Repeat rate in the ten states with the most customers, largest at the top. Hover a bar for its customer count."
        table={{ rows: st, bucketLabel: 'State' }}
      >
        <RateRankBars rows={st} average={eda.repeat_rate} xLabel="Repeat rate" />
      </Fig>
    </Section>
  );
}

function NextStep() {
  return (
    <section className={`${WRAP} pt-10`}>
      <div className="flex flex-col gap-6 rounded-[18px] border-[1.5px] border-ink bg-sheet p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-[34px] font-semibold leading-tight">
            The model learns these patterns. <em className="text-route">Try it on one customer.</em>
          </p>
          <p className="mt-2 text-[16px] text-ink-2">Change the orders and the days since the last order, and watch the score move.</p>
        </div>
        <Link
          to="/prediction-studio"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-route px-6 py-3 text-[16px] font-semibold text-sheet"
        >
          Try the model
        </Link>
      </div>
    </section>
  );
}
