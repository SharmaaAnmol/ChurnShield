import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Figure, Eyebrow, DataState, WhenSeen } from '../../components/site/Figure';
import { useSiteData, SOURCES, pct, num, type SiteData } from '../../lib/data/site-data';

const WRAP = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10';

export function HomePage() {
  const { data, error } = useSiteData();
  if (!data) return <DataState error={error} />;
  return (
    <>
      <Hero data={data} />
      <ThreeSteps data={data} />
      <SiteGuide />
      <Windows data={data} />
      <Findings data={data} />
    </>
  );
}

function Hero({ data }: { data: SiteData }) {
  const { eda } = data;
  const per1000 = Math.round(eda.repeat_rate * 1000);
  // spread the lit dots evenly through the grid so they read as "a few, everywhere"
  const lit = new Set(Array.from({ length: per1000 }, (_, i) => Math.floor(((i + 0.5) * 1000) / per1000) + ((i * 7) % 23)));

  return (
    <section className={`${WRAP} grid items-center gap-12 py-16 lg:grid-cols-[1fr_1.05fr] lg:py-24`}>
      <div className="max-w-[620px]">
        <Eyebrow>Step 1 of 6 · A customer-retention model for online shops</Eyebrow>
        <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px] lg:text-[76px]">
          Most shoppers buy once. <em className="font-semibold text-route">We find who won't come back.</em>
        </h1>
        <p className="mt-6 text-[18px] leading-[1.6] text-ink-2">
          ChurnShield reads a customer's last {data.summary.observation_window_days} days of orders and estimates
          whether they will buy again in the next {data.summary.prediction_horizon_days} days. It was trained and
          tested on {num(eda.rows)} real customer snapshots from the Olist Brazilian online marketplace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/prediction-studio"
            className="lift inline-flex items-center gap-2 rounded-full bg-route px-6 py-3 text-[16px] font-semibold text-sheet shadow-[0_10px_24px_-12px_rgb(11_110_79/0.7)]"
          >
            Try the model <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/data"
            className="lift inline-flex items-center rounded-full border-[1.5px] border-ink px-6 py-3 text-[16px] font-semibold hover:bg-wash"
          >
            See the data
          </Link>
        </div>
      </div>

      <Figure
        n={1}
        plate
        source={SOURCES.eda}
        caption={`Of every 1,000 customers, ${per1000} bought again within ${data.summary.prediction_horizon_days} days.`}
      >
        <div className="flex items-baseline justify-between">
          <p className="eyebrow !text-[#ecd3d6]">1,000 customers, {data.summary.prediction_horizon_days} days later</p>
          <p className="font-mono text-[13px] text-[#ecd3d6]">{pct(eda.repeat_rate, 2)}</p>
        </div>
        <div
          className="mt-6 grid gap-[5px]"
          style={{ gridTemplateColumns: 'repeat(40, minmax(0, 1fr))' }}
          role="img"
          aria-label={`${per1000} of 1,000 dots are highlighted: customers who bought again.`}
        >
          <WhenSeen>
            {(seen) =>
              Array.from({ length: 1000 }, (_, i) => {
                const on = lit.has(i);
                return (
                  <span
                    key={i}
                    className={`aspect-square rounded-full ${
                      on && seen
                        ? 'dot-pop bg-[#ff8aab] shadow-[0_0_0_3px_rgb(255_138_171/0.25)]'
                        : 'bg-[#fbf1f0]/25'
                    }`}
                    // lit dots light up left to right, top to bottom
                    style={on ? { animationDelay: `${300 + i * 1.2}ms` } : undefined}
                  />
                );
              })
            }
          </WhenSeen>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <p className="font-mono text-[34px] leading-none">
            {num(eda.repeaters)} <span className="text-[18px] text-[#ecd3d6]">of {num(eda.rows)}</span>
          </p>
          <p className="max-w-[300px] text-[14px] leading-[1.5] text-[#ecd3d6]">
            snapshots ended in a repeat purchase. Telling those few apart from everyone else is the hard part.
          </p>
        </div>
      </Figure>
    </section>
  );
}

function ThreeSteps({ data }: { data: SiteData }) {
  const { eda, summary, timeline } = data;
  const inputs = summary.feature_schema.numerical_features.length + summary.feature_schema.categorical_features.length;
  const test = timeline[summary.cohort_schedule.final_test_cohort];
  const steps = [
    {
      title: 'The problem',
      body: 'Online shops spend money winning customers back, but they cannot tell who is about to leave. Nobody cancels a shop account. They just stop buying.',
      stat: pct(eda.one_order_share),
      statLabel: 'of customers bought only once',
    },
    {
      title: 'What the model does',
      body: 'For each customer it reads facts from their order history: how recently and how often they ordered, how much they spent, shipping costs, and their state. It outputs the chance they buy again.',
      stat: String(inputs),
      statLabel: 'inputs per customer',
    },
    {
      title: 'What the shop does',
      body: 'Rank customers from most to least likely to leave, and send win-back offers to the top 20% first instead of emailing everyone.',
      stat: num(test.recommendedContactCount),
      statLabel: `customers to contact in the test quarter`,
    },
  ];

  return (
    <section className={`${WRAP} border-t-[1.5px] border-ink pt-16`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
        <h2 className="font-display text-[44px] font-semibold leading-none sm:text-[56px]">In three steps</h2>
        <p className="max-w-[520px] text-[17px] leading-[1.6] text-ink-2 lg:justify-self-end">
          The whole project in one line: <span className="text-ink">use past orders to predict who stops buying, so a shop knows where to spend its retention budget.</span>
        </p>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-[18px] border-[1.5px] border-ink bg-sheet p-6">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-route" aria-hidden="true" />
              <span className="h-[2px] flex-1 bg-route" aria-hidden="true" />
            </div>
            <p className="mt-6 font-display text-[44px] font-semibold leading-none">0{i + 1}</p>
            <h3 className="mt-3 text-[20px] font-bold">{s.title}</h3>
            <p className="mt-3 flex-1 text-[16px] leading-[1.6] text-ink-2">{s.body}</p>
            <p className="mt-6 border-t border-rule pt-4">
              <span className="font-mono text-[28px] font-semibold text-route">{s.stat}</span>{' '}
              <span className="text-[14px] text-ink-2">{s.statLabel}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const GUIDE = [
  { to: '/data', title: 'The data', q: 'What do the customers look like, and what hints that someone will come back?' },
  { to: '/prediction-studio', title: 'Try the model', q: 'What does the model say about one real customer, and why?' },
  { to: '/model', title: 'Results', q: 'How do we know it works on customers it never saw?' },
  { to: '/customers', title: 'Customers', q: 'Who should the shop contact first?' },
  { to: '/how-its-built', title: "How it's built", q: 'Which steps and tools turn raw data into this site?' },
];

function SiteGuide() {
  return (
    <section className={`${WRAP} pt-20`}>
      <h2 className="font-display text-[36px] font-semibold leading-none sm:text-[44px]">
        How to read <em className="text-route">this site</em>
      </h2>
      <p className="mt-4 max-w-[640px] text-[16px] leading-[1.6] text-ink-2">
        Each page answers one question, in order. Follow them left to right, or jump to the one you need.
      </p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {GUIDE.map((g, i) => (
          <li key={g.to}>
            <Link
              to={g.to}
              className="lift group flex h-full flex-col rounded-[14px] border border-rule bg-sheet p-5 hover:border-ink"
            >
              <span className="font-mono text-[12px] text-ink-2">Step {i + 2}</span>
              <span className="mt-1 text-[18px] font-bold">{g.title}</span>
              <span className="mt-2 flex-1 text-[14px] leading-[1.5] text-ink-2">{g.q}</span>
              <ArrowRight className="mt-4 h-4 w-4 text-route transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

const DAY_MS = 86_400_000;
const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function Windows({ data }: { data: SiteData }) {
  const { summary } = data;
  const look = summary.observation_window_days;
  const ahead = summary.prediction_horizon_days;
  const cutoff = new Date(`${summary.cohort_schedule.final_test_cohort}T00:00:00Z`);
  const start = new Date(cutoff.getTime() - look * DAY_MS);
  const end = new Date(cutoff.getTime() + ahead * DAY_MS);
  const lookShare = (look / (look + ahead)) * 100;

  return (
    <section className={`${WRAP} pt-20`}>
      <Figure
        n={2}
        source={SOURCES.summary}
        caption={`How one prediction is set up, using the test snapshot of ${fmtDate(cutoff)}. The model only ever sees the past.`}
      >
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-[36px] font-semibold leading-[1.05]">
              Look back, then <em className="text-route">predict ahead</em>
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">
              Each snapshot freezes time on a cutoff date. Facts come only from before it; the answer comes only from after it.
            </p>
          </div>
          <div>
            <div className="flex min-h-16 overflow-hidden rounded-[10px] border-[1.5px] border-ink text-center text-[13px] font-semibold leading-tight sm:text-[15px]">
              <div className="flex items-center justify-center bg-wash px-2 py-3" style={{ width: `${lookShare}%` }}>
                Last {look} days: what the model reads
              </div>
              <div className="flex flex-1 items-center justify-center border-l-[3px] border-signal bg-route-wash px-2 py-3 text-route">
                Next {ahead} days: did they buy?
              </div>
            </div>
            <div
              className="mt-2 grid font-mono text-[12px] text-ink-2"
              style={{ gridTemplateColumns: `${lookShare}% 1fr` }}
            >
              <div className="flex justify-between gap-2">
                <span>{fmtDate(start)}</span>
                <span className="pr-2 text-right text-signal">
                  cutoff ▲
                  <br />
                  {fmtDate(cutoff)}
                </span>
              </div>
              <span className="text-right">{fmtDate(end)}</span>
            </div>
          </div>
        </div>
      </Figure>
    </section>
  );
}

function Findings({ data }: { data: SiteData }) {
  const { eda, summary, timeline } = data;
  const test = timeline[summary.cohort_schedule.final_test_cohort];
  const once = eda.by_order_count[0];
  const most = eda.by_order_count[eda.by_order_count.length - 1];
  const cards = [
    {
      big: pct(most.repeat_rate),
      line: `of customers with ${most.bucket} orders bought again, against ${pct(once.repeat_rate, 2)} of one-time buyers. Past loyalty is the clearest signal.`,
      source: SOURCES.eda,
    },
    {
      big: `${test.prAucLiftOverDummy.toFixed(1)}×`,
      line: 'better than random guessing at ranking who comes back (PR-AUC), on a quarter the model never saw during training.',
      source: SOURCES.timeline,
    },
    {
      big: `${num(test.confusionMatrix.tp)} of ${num(test.actualRepeatPurchasers)}`,
      line: `returning customers were correctly flagged as likely to return (recall ${pct(test.recall)}).`,
      source: SOURCES.timeline,
    },
    {
      big: num(test.totalCustomersEvaluated),
      line: `customers in the untouched test quarter. Only ${pct(test.baseRepeatPurchaseRate, 2)} of them came back, which is why this is hard.`,
      source: SOURCES.timeline,
    },
  ];

  return (
    <section className={`${WRAP} pt-24`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
        <h2 className="font-display text-[44px] font-semibold leading-none sm:text-[56px]">
          What we <em className="text-route">found</em>
        </h2>
        <p className="max-w-[520px] text-[17px] leading-[1.6] text-ink-2 lg:justify-self-end">
          Measured on the June 2018 test quarter, which was kept aside until the very end.{' '}
          <Link to="/model" className="font-semibold text-route underline-offset-4 hover:underline">
            See all results
          </Link>
          .
        </p>
      </div>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <li key={c.big} className="flex flex-col rounded-[18px] border border-rule bg-sheet p-6">
            <p className="font-mono text-[34px] font-semibold leading-none">{c.big}</p>
            <p className="mt-4 flex-1 text-[15px] leading-[1.6] text-ink-2">{c.line}</p>
            <p className="mt-5 font-mono text-[12px] text-ink-2">source: data/{c.source}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-[18px] border-[1.5px] border-signal bg-signal-wash p-6">
        <p className="eyebrow !text-signal">Honest limits</p>
        <ul className="mt-3 grid gap-2 text-[15px] leading-[1.6]">
          {summary.known_limitations.map((l) => (
            <li key={l}>— {l}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
