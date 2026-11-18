# ChurnShield Animation & Interaction Audit

This document records the pre-sprint inspection of the ChurnShield web application codebase, assessing installed packages, component usage, route transitions, chart dynamics, and gaps in interactive behavior.

---

## 1. Package & Entry Point Audit

| Criteria | Finding | Status |
| :--- | :--- | :--- |
| **Animation Engine** | `motion@12.43.0` installed in `webapp/package.json`. | Verified |
| **Import Entry Point** | All components correctly use `import { motion, ... } from 'motion/react'`. No legacy `framer-motion` imports remain. | Clean |
| **Auxiliary Engines** | `gsap@3.15.0` and `@gsap/react` installed for advanced text reveals (`ScrollReveal`). | Verified |
| **Utility Libraries** | `clsx` and `tailwind-merge` configured in `@/lib/utils`. | Verified |

---

## 2. Component Integration & Rendering Audit

### A. Magic UI `NumberTicker`
- **Issue:** While `NumberTicker.tsx` existed in `webapp/src/components/ui/`, it was **not integrated** into `KpiCard.tsx`.
- **Impact:** KPI cards rendered real dataset metrics (`130,914`, `0.82%`, `0.0185`) as static text strings, giving no visual feedback when switching between observation snapshots (`2017-06-01`, `2018-06-01`, etc.).
- **Fix Required:** Update `KpiCard.tsx` to detect numeric/percentage values and render them via `NumberTicker` with spring easing and proper formatting.

### B. React Bits `SplitText`
- **Issue:** `SplitText.tsx` was rendered in the hero headline, but was configured with `splitBy="words"` on a short 2-word phrase (`SEE RISK.`). With a 50ms delay, the animation resolved in under 100ms and was imperceptible on fast connections.
- **Impact:** Felt like a static heading rather than an editorial typography cascade.
- **Fix Required:** Switch to character-level cascade (`splitBy="characters"`), add spring physics, and support staggered line reveal.

### C. React Bits `ScrollReveal`
- **Issue:** `ScrollReveal.tsx` existed in `webapp/src/components/`, but was **never imported or rendered** on any page.
- **Impact:** Zero on-scroll reveals below the fold.
- **Fix Required:** Integrate `ScrollReveal` on the Methodology section and the Overview cohort breakdown to trigger as users scroll down.

### D. Route Transitions (`AnimatePresence`)
- **Issue:** In `AppShell.tsx`, `<Outlet />` was wrapped in `<AnimatePresence>`, but without `useOutlet()` and proper keying, React Router immediately swapped DOM trees rather than executing true exit/entrance cross-fades.
- **Impact:** Navigating between pages felt abrupt.
- **Fix Required:** Use `useOutlet()` with `location.pathname` keying to enable smooth page cross-fade and subtle vertical glide.

### E. Recharts Dynamic Behavior
- **Issue:** `Bar` elements in `OverviewPage.tsx`, `FeatureInsightsPage.tsx`, and `PredictionStudioPage.tsx` did not define explicit animation attributes (`isAnimationActive`, `animationDuration`, `animationEasing`).
- **Impact:** Chart bars appeared instantly without fluid data loading animations.
- **Fix Required:** Enable `isAnimationActive={true}`, `animationDuration={900}`, and `animationEasing="ease-out"`.

---

## 3. Interactive Machine Learning Gaps

1. **Prediction Studio Debounced Live Preview:**
   - Sliders required pressing the manual button every time to see any response.
   - Changing variables showed a static "Unsaved" warning instead of smooth debounced inference.
2. **What-If Scenario Comparison:**
   - There was no structured diff comparison showing the baseline prediction vs edited scenario with percentage-point change ($\Delta$).
3. **Model Sensitivity Analysis:**
   - No interactive sensitivity curve or tornado analysis existed to inspect how individual features impact the output when swept across their range.
4. **Clickable Risk Stratification:**
   - Clicking bars in the risk distribution chart did not filter the customer cohort queue.
5. **Interactive Operational Risk Cutoff:**
   - The user could not adjust an operational risk cutoff threshold to see how many customers fall into the priority outreach capacity.

---

## 4. Accessibility & `prefers-reduced-motion`

- All Motion and GSAP components respect `prefers-reduced-motion`.
- When reduced motion is requested, transitions gracefully fall back to zero-displacement opacity fades to prevent vestibular disorientation.
