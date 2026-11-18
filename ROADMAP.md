# ChurnShield — Demo Roadmap

**Demo:** Tue 24 Nov 2026 · **Started:** Wed 18 Nov 2026

## Why we are changing it

Feedback from the first showing: the web app is confusing and the UI doesn't work. A review of the live site found the same:

- **Jargon instead of explanation.** "Latent risk coordinate", "Continuous Telemetry Active", "Champion Production Pipeline". A first-time viewer can't tell what the problem is or what the model does.
- **Too many pages, no story.** There are six pages of equal weight and none of them says *start here*.
- **Numbers that seem to contradict each other.** 99.3% of customers don't come back, yet 37,285 of 39,162 are labelled "Moderate risk". That's because the balanced model's scores bunch around 50%, which reads as a bug when nobody explains it.
- **The EDA is missing.** The notebook has 14 EDA figures, but the web app shows none, so the reasons the model works are never shown.
- **The backend is fragile.** The Render free tier sleeps and takes about 50s to wake. The URL in the README (`churnshield-api.onrender.com`) is dead; the live one is `churnshield-rb76.onrender.com`.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Backend | **Vercel Function** `webapp/api/predict.ts` replaces Render | Same project and domain: no CORS, no second account, no 50s cold start. The model is logistic regression, so inference is a dot product. The exact weights are already in TypeScript, and parity with the sklearn pipeline was checked before. |
| Supabase? | **Not used** | Supabase is a Postgres database with TypeScript (Deno) edge functions. It can't load the Python `.joblib` model, and the app has no data that needs a database (static files are under 1 MB). It would add a second account and keys without changing what the teacher sees. |
| Python FastAPI | Kept in `backend/` as the reference implementation | The notebook and pytest suite still prove that the TypeScript weights match the sklearn pipeline. |
| Look | **Flipwright "atelier" theme**, plus a **"Plum night" dark mode** | Blush paper `#f1e1de`, plum ink `#2c1822`, forest-green accent `#0b6e4f`, plum "plate" panels, Cormorant Garamond headlines with green italics, Archivo body, JetBrains Mono numbers, and `FIG. n` captions under every chart. |
| Structure | **Story-first: 5 pages** | Each page answers one question a first-time viewer asks, in order. |

## New site map (old → new)

| # | Page | Question it answers | Built from |
|---|---|---|---|
| 1 | **Home** | What's the problem, and what does ChurnShield do? | Overview hero, rewritten in plain English with a 3-step "Problem → Model → Action" strip and 4 headline numbers |
| 2 | **The data** (new) | What does the data look like, and what predicts a return? | New EDA page: `FIG. 1–8` from `public/data/eda.json` |
| 3 | **Try the model** | What does the model say about one customer, and why? | Prediction Studio, cut down to 5 inputs → score → top reasons → suggested action |
| 4 | **Results** | How do we know it works? | Model Performance + Feature Importance + Methodology, merged; honest metrics with a plain-English line under each |
| 5 | **Customers** | Who should the team contact first? | Customer Explorer, restyled |

## EDA figures (page 2)

All figures come from the 130,914-row feature store (`export_eda.py` → `webapp/public/data/eda.json`). Each one gets a single-sentence takeaway.

1. **Customers per snapshot.** The dataset grows from 11k to 39k customers per quarter.
2. **Who comes back?** Only 0.82% of customers buy again within 90 days. This is the class-imbalance problem.
3. **Orders before the cutoff.** 97.7% of customers bought only once.
4. **Repeat rate by lifetime orders.** 1 order: 0.77%, 2 orders: 2.3%, 3+ orders: **13.2%**. This is the strongest signal.
5. **Repeat rate by recent orders (last 90 days).** 0: 0.69%, 1: 0.87%, 2+: 3.9%.
6. **Repeat rate by days since last order.** 0–30 days: 1.16%, falling to 0.59% at 150–180 days.
7. **Spend distribution, returners vs non-returners.** The two groups overlap heavily, so spend alone is a weak signal.
8. **Top 10 states.** Repeat rates are similar everywhere; SP and RJ dominate the volume.

## Data integrity rule

The professor's requirement: **every number shown must come from this GitHub repository.**

- `export_webapp_data.py` builds every file in `webapp/public/data/` from committed artifacts: `artifacts/*`, `backend/artifacts/churnshield_pipeline.joblib`, and `artifacts/curated_customer_snapshots.csv`.
- `python export_webapp_data.py --check` regenerates them all and fails if any served file differs. Run it before every deploy.
- The model weights used in the browser and in `/api/predict` are read out of the `.joblib` pipeline. `npm run check:api` confirms the predictions match sklearn.
- New pages read numbers only through `useSiteData()` (`webapp/src/lib/data/site-data.ts`), and every figure names its source file.

**Audit of 18 Nov.** Things found and fixed:
- The "All 130k" row of `timeline_metrics.json` had never been computed: it showed PR-AUC 0.0185 and an impossible confusion matrix. Now it is computed: PR-AUC 0.0172, tn/fp/fn/tp 83,970 / 45,868 / 577 / 499.
- `customer_predictions.csv` had no generator in the repo, and it held every returning customer, which made it a biased sample. It is now a seeded random sample of 800 per cohort.
- Risk-tier counts were off by ±1 from rounding. They are now computed from exact scores.
- The browser had a hand-typed copy of the weights, with state weights rounded. It now imports `model_weights.json`.

Known and left as is:
- `model_metadata.json` (written by the notebook) says 7,833 customers contacted, but the holdout file flags 7,832.
- Currency is shown as `$` across the site (project choice). The amounts are the dataset's own values, unconverted.

## Schedule

| Day | Date | Work | Done when |
|---|---|---|---|
| 1 | Wed 18 | Roadmap, EDA export, Vercel `/api/predict`, theme tokens and fonts | Builds locally; `/api/predict` matches the client engine |
| 2 | Thu 19 | New app shell (header, nav, footer) and **Home** page | Home explains the problem in under 30 seconds of reading |
| 3 | Fri 20 | **The data** (EDA) page, FIG. 1–8 | All 8 figures render from `eda.json` |
| 4 | Sat 21 | **Try the model** page | 5 inputs → score, reasons and action; uses `/api/predict` with a local fallback |
| 5 | Sun 22 | **Results** + **Customers** pages; delete the old pages and unused animation kits | No dead links; bundle smaller |
| 6 | Mon 23 | Polish, phone layout, copy pass, deploy to Vercel, demo run-through | Live site matches local; demo script rehearsed |
| — | Tue 24 | **Demo** | |

## Progress

- [x] Review live site and record problems
- [x] Pick backend (Vercel Function) and look (Flipwright atelier)
- [x] `export_eda.py` → `webapp/public/data/eda.json`
- [x] `webapp/api/predict.ts` + `webapp/api/health.ts`, wired into the frontend
- [x] Theme tokens and fonts in `webapp/src/styles/index.css`
- [x] Data audit: every served file regenerated from repo artifacts (`export_webapp_data.py --check`)
- [x] App shell (`SiteShell`) + Home (`pages/site/HomePage.tsx`)
- [x] Dark mode "Plum night": header toggle, follows the OS setting until the viewer picks one, remembered per browser. Every new page must be checked in both modes.
- [x] The data (EDA): `pages/site/DataPage.tsx`, FIG. 1–8 in three parts (who the customers are / what predicts a return / what doesn't). Every takeaway sentence is computed from `eda.json`, every figure has a hover tooltip and a "Show the numbers" table, and chart colours pass the dataviz colour-blindness check in both themes.
- [x] Try the model: `pages/site/TryModelPage.tsx`. Presets are 4 real held-out customers picked by fixed rules (`examples.json`), never made-up personas. 5 inputs; dependent features are recomputed with the notebook's definitions (`lib/data/customer-edit.ts`). Shows the score, the contact-list decision, what really happened, the push from each input (FIG. 2, plus all 21 features) and a plain action. Scored by `/api/predict`, with the in-browser engine as the fallback. `npm run check:api` also checks the presets reproduce sklearn and every edit stays valid API input.
- [x] Results (`pages/site/ResultsPage.tsx`, FIG. 1–5): time-based split, test confusion matrix, lift over guessing per snapshot (training snapshots marked as flattering), why scores bunch near 50%, permutation importance, known limitations. Every number from `evaluation_metrics.json`, `timeline_metrics.json`, `feature_importance.json` or `model_summary.json`.
- [x] Customers (`pages/site/CustomersPage.tsx`): ranked sample from `customer_predictions.csv`, filter by snapshot, tier and contact list, with the real outcome shown. Labelled as a seeded 800-per-snapshot sample.
- [x] Old pages, sidebar shell, animation kits, old dark theme and 13 unused packages removed; old URLs (`/predict`, `/features`, `/methodology`) redirect. Main JS bundle 466 kB → 104 kB.
- [x] Branch pushed; Vercel preview build succeeded (18 Nov).
- [x] Merged to `main`; production live. Fixed `/api/predict` crashing on Vercel (Node ESM needs `.js` import extensions and a JSON import attribute).
- [x] Day 6 clarity pass: new **How it's built** page (step 6: six-step pipeline with the file each step writes, the 7-model comparison from `model_comparison.csv`, the full technology stack with versions read from `model_summary.json` and `package.json`, how a prediction is served, the integrity checks). Every page now says "Step n of 6", Home has a "How to read this site" guide, every page links to the next, pages open at the top, footer links to GitHub. README (site map, tech stack, structure) and `docs/DEPLOYMENT_GUIDE.md` rewritten for Vercel; pre-redesign docs moved to `docs/archive/`.
- [ ] Demo run-through on the live site (phone + laptop)

## Demo script (draft)

1. **Home:** "Online shops lose most buyers after one order. We predict who won't come back in the next 90 days, so the shop knows who to win back."
2. **The data:** "97.7% buy once. People with 3+ orders come back 16× more often. That's what the model learns."
3. **Try the model:** pick "Typical" (a real test customer), then change days since last order and recent orders, and watch the score and the reasons change. Point out "What really happened": the model ranks, it doesn't know the future.
4. **Results:** "The model finds returners 1.7× better than guessing, on data it never saw. The signal is real but modest, and here's why."
5. **Customers:** the ranked list a retention team would actually use.
6. **How it's built:** "Python and scikit-learn do the data science in the notebook; a script exports the results; React shows them; Vercel hosts the site and the prediction API. Every number traces back to the repository." 
