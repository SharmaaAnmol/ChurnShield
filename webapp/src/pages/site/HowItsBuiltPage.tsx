import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Github } from 'lucide-react';
import { Figure, Eyebrow, DataState, WhenSeen, growStyle } from '../../components/site/Figure';
import { useSiteData, SOURCES, num, type SiteData } from '../../lib/data/site-data';
import pkg from '../../../package.json';

const WRAP = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10';
export const REPO_URL = 'https://github.com/SharmaaAnmol/ChurnShield';

const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
/** "^18.3.1" -> "18", read from webapp/package.json so the page can't drift from what's installed. */
const major = (name: string) => (deps[name] ?? '').replace(/^[^\d]*/, '').split('.')[0];

const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export function HowItsBuiltPage() {
  const { data, error } = useSiteData();
  if (!data) return <DataState error={error} />;
  return (
    <>
      <section className={`${WRAP} py-16 lg:py-20`}>
        <Eyebrow>Step 6 of 6 · How it's built</Eyebrow>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <h1 className="font-display text-[44px] font-semibold leading-[1.02] sm:text-[64px]">
            From raw spreadsheets <em className="text-route">to this website</em>
          </h1>
          <p className="max-w-[560px] text-[17px] leading-[1.6] text-ink-2">
            The whole project is one pipeline in one GitHub repository. Python turns the public Olist data into a trained
            model and a set of result files; this website only displays those files, and Vercel serves it. Here is every
            step and every tool.
          </p>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="lift mt-8 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink px-5 py-2.5 text-[15px] font-semibold hover:bg-wash"
        >
          <Github className="h-4 w-4" aria-hidden /> Open the repository on GitHub
        </a>
      </section>
      <Pipeline data={data} />
      <ModelChoice data={data} />
      <Stack data={data} />
      <Serving />
      <Honesty />
      <section className={`${WRAP} pb-24`}>
        <Link
          to="/"
          className="lift group flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-rule bg-sheet p-6 hover:border-ink-2 sm:p-8"
        >
          <span>
            <span className="eyebrow">Back to the start</span>
            <span className="mt-2 block font-display text-[30px] font-semibold leading-tight">
              The problem, in one page. <em className="text-route">Home.</em>
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

function Pipeline({ data }: { data: SiteData }) {
  const { pipeline: p, eda, summary, evaluation } = data;
  const rawRows = p.raw_tables.reduce((s, t) => s + t.rows, 0);
  const inputs = summary.feature_schema.numerical_features.length + summary.feature_schema.categorical_features.length;
  const stages = [
    {
      title: 'Get the raw data',
      what: `${p.raw_tables.length} public CSV tables from the Olist Brazilian marketplace on Kaggle: orders, customers, items, payments, reviews, products, sellers and locations. ${num(rawRows)} rows in all, orders from ${monthYear(p.date_range[0])} to ${monthYear(p.date_range[1])}.`,
      tools: 'Python · kagglehub · pandas',
      file: 'data/*.csv',
    },
    {
      title: 'Check and join it',
      what: `Profile every table for duplicates, missing values and broken links, then join orders to customers and items. ${num(p.orders_with_items)} orders have items and count as purchases.`,
      tools: 'pandas',
      file: 'artifacts/data_quality_report.json',
    },
    {
      title: 'Build customer snapshots',
      what: `On ${eda.cohorts.length} quarterly cutoff dates, summarise each customer's last ${summary.observation_window_days} days into ${inputs} inputs, and record whether they bought again in the next ${summary.prediction_horizon_days}. ${num(eda.rows)} snapshots.`,
      tools: 'pandas · NumPy',
      file: 'artifacts/curated_customer_snapshots.csv',
    },
    {
      title: 'Train and choose a model',
      what: `Train ${p.model_comparison.length} candidate models on the older snapshots, compare them on later ones, and keep the best by PR-AUC: ${summary.champion_model.model_type}.`,
      tools: 'scikit-learn · joblib',
      file: 'backend/artifacts/churnshield_pipeline.joblib',
    },
    {
      title: 'Test it once',
      what: `Score the ${num(evaluation.test_population_size)} customers of the ${monthYear(evaluation.evaluation_cohort)} snapshot, kept aside until the end, and measure which inputs matter.`,
      tools: 'scikit-learn · matplotlib · seaborn',
      file: 'artifacts/final_test_metrics.json',
    },
    {
      title: 'Publish the results',
      what: 'A script copies and summarises those files into the website, the site is built, and Vercel puts it online with a small prediction API.',
      tools: 'export_webapp_data.py · React · Vercel',
      file: 'webapp/public/data/',
    },
  ];
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 1 · The pipeline" title={<>Six steps, <em className="text-route">each leaves a file</em></>}>
        <p>
          Steps 1 to 5 are in the Jupyter notebook (<span className="break-all font-mono text-[14px]">ChurnShield_Customer_Inactivity_Prediction.ipynb</span>,
          which also opens in Google Colab) and in one script, <span className="break-all font-mono text-[14px]">build_project_and_artifacts.py</span>. Each step writes a file the next step reads, so anyone can rerun it and get
          the same answer.
        </p>
      </SectionHead>
      <Figure n={1} source={SOURCES.pipeline} className="mt-8" caption="From raw data to the live site. Grey text: the file each step writes.">
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((s, i) => (
            <li key={s.title} className="flex flex-col rounded-[14px] border border-rule bg-paper p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[34px] font-semibold leading-none text-route">0{i + 1}</span>
                <h3 className="text-[17px] font-bold">{s.title}</h3>
              </div>
              <p className="mt-3 flex-1 text-[15px] leading-[1.55] text-ink-2">{s.what}</p>
              <p className="mt-4 text-[13px] font-semibold">{s.tools}</p>
              <p className="mt-1 break-all font-mono text-[12px] text-ink-2">{s.file}</p>
            </li>
          ))}
        </ol>
      </Figure>
    </section>
  );
}

function ModelChoice({ data }: { data: SiteData }) {
  const rows = data.pipeline.model_comparison;
  const max = Math.max(...rows.map((r) => r.val_pr_auc));
  const best = rows[0];
  const dummy = rows.find((r) => r.model.startsWith('Dummy'));
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 2 · Why this model" title={<>We tried {rows.length} models. <em className="text-route">The simplest won.</em></>}>
        <p>
          Every candidate was scored by PR-AUC: how well it puts the rare returners at the top of the list. On the
          validation snapshot, {best.model} scored highest ({best.val_pr_auc.toFixed(4)}), ahead of the tree-based
          models{dummy ? `, and well above the "always guess the average" baseline (${dummy.val_pr_auc.toFixed(4)})` : ''}. It
          is also the easiest to explain: every input has one weight, which is how the Try-the-model page can show its
          reasons.
        </p>
      </SectionHead>
      <Figure n={2} source={SOURCES.pipeline} className="mt-8" caption="Validation PR-AUC per candidate model (higher is better).">
        <WhenSeen>
          {(seen) => (
        <ul className="grid gap-1">
          {rows.map((r, i) => {
            const win = r === best;
            const base = r === dummy;
            return (
              <li
                key={r.model}
                className="-mx-2 grid items-center gap-x-4 gap-y-1 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-wash sm:grid-cols-[210px_1fr_80px]"
              >
                <span className={`text-[14px] ${win ? 'font-bold' : 'font-semibold'}`}>
                  {r.model}
                  {win && <span className="ml-2 rounded-full bg-route px-2 py-0.5 text-[11px] text-sheet">chosen</span>}
                  {base && <span className="ml-2 text-[12px] font-normal text-ink-2">(baseline)</span>}
                </span>
                <div className="relative h-5">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px]"
                    style={{
                      width: seen ? `${(r.val_pr_auc / max) * 100}%` : 0,
                      ...growStyle(i),
                      background: win ? 'var(--color-chart-1)' : base ? 'var(--color-off)' : 'var(--color-chart-2)',
                    }}
                  />
                </div>
                <span className="text-right font-mono text-[13px]">{r.val_pr_auc.toFixed(4)}</span>
              </li>
            );
          })}
        </ul>
          )}
        </WhenSeen>
        <details className="mt-5 text-[14px]">
          <summary className="cursor-pointer select-none font-semibold text-route">Show the numbers</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b-[1.5px] border-ink text-ink-2">
                  <th className="py-2 pr-4 font-semibold">Model</th>
                  <th className="py-2 pr-4 text-right font-semibold">Cross-validation PR-AUC</th>
                  <th className="py-2 pr-4 text-right font-semibold">Validation PR-AUC</th>
                  <th className="py-2 pr-4 text-right font-semibold">Validation ROC-AUC</th>
                  <th className="py-2 text-right font-semibold">Training time</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {rows.map((r) => (
                  <tr key={r.model} className="border-b border-rule">
                    <td className="py-2 pr-4 font-ui text-[14px]">{r.model}</td>
                    <td className="py-2 pr-4 text-right">
                      {r.cv_pr_auc_mean.toFixed(4)} ± {r.cv_pr_auc_std.toFixed(4)}
                    </td>
                    <td className="py-2 pr-4 text-right">{r.val_pr_auc.toFixed(4)}</td>
                    <td className="py-2 pr-4 text-right">{r.val_roc_auc.toFixed(4)}</td>
                    <td className="py-2 text-right">{r.fit_time_seconds.toFixed(2)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-ink-2">
            Cross-validation: trained on the earliest snapshot(s), scored on the next one, rolling forward through the
            training period. Validation: the {monthYear(data.summary.cohort_schedule.validation_cohort)} snapshot.
          </p>
        </details>
      </Figure>
    </section>
  );
}

function Stack({ data }: { data: SiteData }) {
  const env = data.summary.environment ?? {};
  const v = (k: string) => (env[k] ? ` ${env[k].split('.').slice(0, 2).join('.')}` : '');
  const groups: Array<{ title: string; note: string; items: Array<[string, string]> }> = [
    {
      title: 'Data and machine learning',
      note: 'Versions as recorded when the model was trained (model_summary.json).',
      items: [
        ['Python', 'The language for the whole data and modelling side.'],
        ['Jupyter Notebook', 'The main deliverable: every step with its output and charts. Opens in Google Colab.'],
        [`pandas${v('pandas_version')}`, 'Loading the CSVs, joining tables, building the customer snapshots.'],
        [`NumPy${v('numpy_version')}`, 'The number crunching underneath pandas and the features.'],
        [`scikit-learn${v('scikit_learn_version')}`, 'The models, the preprocessing pipeline, the metrics and permutation importance.'],
        [`joblib${v('joblib_version')}`, 'Saving the trained pipeline to one file.'],
        ['matplotlib + seaborn', 'The figures inside the notebook.'],
        ['kagglehub', 'Downloading the Olist dataset from Kaggle.'],
      ],
    },
    {
      title: 'This website',
      note: 'Versions from webapp/package.json.',
      items: [
        [`React ${major('react')}`, 'The pages and the interactive parts, like the sliders on Try the model.'],
        [`TypeScript ${major('typescript')}`, 'JavaScript with types, so data mistakes show up before the site ships.'],
        [`Vite ${major('vite')}`, 'Builds the site into small static files.'],
        [`Tailwind CSS ${major('tailwindcss')}`, 'Styling, including the light and dark themes.'],
        [`Recharts ${major('recharts')}`, 'The bar and line charts.'],
        [`React Router ${major('react-router-dom')}`, 'Moving between the pages.'],
        ['PapaParse', 'Reading the customer CSV in the browser.'],
        ['Lucide', 'The icons.'],
      ],
    },
    {
      title: 'Hosting and deployment',
      note: 'webapp/vercel.json and webapp/api/.',
      items: [
        ['GitHub', 'Holds the code, data files and history. Every push to the main branch redeploys the site.'],
        ['Vercel', 'Builds and hosts the website on a global network.'],
        ['Vercel Functions (Node.js)', 'Run /api/predict and /api/health on demand, with no server to keep awake.'],
      ],
    },
    {
      title: 'Reference API and tests',
      note: 'backend/ and webapp/scripts/.',
      items: [
        ['FastAPI + pydantic + uvicorn', 'The original Python prediction API. Kept in backend/ as the reference the Vercel Function copies.'],
        ['pytest', 'Tests for that Python API.'],
        ['Check scripts', 'export_webapp_data.py --check and npm run check:api (see Part 5).'],
      ],
    },
  ];
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 3 · Technology" title={<>What we used, <em className="text-route">and what for</em></>}>
        <p>Python does the data science; the website and its hosting only present what Python produced.</p>
      </SectionHead>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title} className="rounded-[18px] border border-rule bg-sheet p-6 sm:p-8">
            <h3 className="font-display text-[28px] font-semibold leading-tight">{g.title}</h3>
            <dl className="mt-4 grid gap-3">
              {g.items.map(([name, what]) => (
                <div key={name} className="grid gap-x-4 gap-y-0.5 border-b border-rule pb-3 last:border-b-0 sm:grid-cols-[200px_1fr]">
                  <dt className="text-[15px] font-semibold">{name}</dt>
                  <dd className="text-[15px] leading-[1.5] text-ink-2">{what}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 font-mono text-[12px] text-ink-2">{g.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Serving() {
  const boxes = [
    { t: 'Your browser', d: 'Opens a page and loads the result files from /data.' },
    { t: 'Vercel', d: 'Serves the built site and the files in webapp/public/data/.' },
    { t: '/api/predict', d: 'A Vercel Function. Takes 21 inputs, checks them, returns the score.' },
    { t: 'Model weights', d: 'Read out of the trained scikit-learn file by export_webapp_data.py.' },
  ];
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 4 · How a prediction reaches you" title={<>One model, <em className="text-route">two places it runs</em></>}>
        <p>
          A logistic regression is just a weighted sum, so we export the trained weights from the scikit-learn file and
          run the same sum in the Vercel Function. If the function can't be reached, the page runs the identical
          weights in your browser and says so under the score.
        </p>
      </SectionHead>
      <Figure n={3} source={SOURCES.weights} className="mt-8" caption="What happens when you move a slider on Try the model.">
        <ol className="grid gap-3 md:grid-cols-4">
          {boxes.map((b, i) => (
            <li key={b.t} className="relative rounded-[14px] border-[1.5px] border-ink bg-paper p-5">
              <p className="font-mono text-[12px] text-ink-2">{i + 1}</p>
              <p className="mt-1 text-[17px] font-bold">{b.t}</p>
              <p className="mt-2 text-[14px] leading-[1.5] text-ink-2">{b.d}</p>
              {i < boxes.length - 1 && (
                <ArrowRight className="absolute -right-[18px] top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-route md:block" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </Figure>
    </section>
  );
}

function Honesty() {
  const checks = [
    {
      cmd: 'python export_webapp_data.py --check',
      what: 'Rebuilds every file the website shows from the repository and fails if any one differs. Nothing on the site is typed in by hand.',
    },
    {
      cmd: 'npm run check:api',
      what: 'Scores 40 real customers through /api/predict and compares with scikit-learn. The largest difference allowed is 0.0001.',
    },
    {
      cmd: 'source: data/…',
      what: 'Every figure on the site names the file it was drawn from, so any number can be traced back.',
    },
  ];
  return (
    <section className={`${WRAP} pb-16`}>
      <SectionHead eyebrow="Part 5 · Keeping it honest" title={<>Every number traces back <em className="text-route">to the repository</em></>}>
        <p>Three checks make sure the website can't drift from what the notebook actually produced.</p>
      </SectionHead>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {checks.map((c) => (
          <li key={c.cmd} className="rounded-[18px] border border-rule bg-sheet p-6">
            <p className="break-words font-mono text-[13px] font-semibold text-route">{c.cmd}</p>
            <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">{c.what}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
