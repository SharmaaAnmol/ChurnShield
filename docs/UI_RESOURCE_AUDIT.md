# ChurnShield UI Resource & Component Audit

This document details all open-source UI libraries, animation primitives, typography fonts, and custom components integrated into the ChurnShield analytics platform.

---

## 1. Animation Toolkit Architecture

All animations and interactive UI components are organized in dedicated directories under `webapp/src/components/`:

```
webapp/src/components/
├── animations/
│   └── index.ts                 <-- Central barrel export for all animation components
├── ui/
│   ├── react-bits/              <-- React Bits component registry
│   │   ├── SplitText.tsx
│   │   ├── ShinyText.tsx
│   │   ├── BlurText.tsx
│   │   ├── DecryptedText.tsx
│   │   ├── ScrollReveal.tsx
│   │   └── index.ts
│   ├── magic-ui/                <-- Magic UI component registry
│   │   ├── NumberTicker.tsx
│   │   ├── BorderBeam.tsx
│   │   ├── AnimatedShinyText.tsx
│   │   ├── ShimmerButton.tsx
│   │   ├── Meteors.tsx
│   │   ├── PulsatingButton.tsx
│   │   └── index.ts
│   └── Spotlight.tsx            <-- Aceternity UI radial spotlight glow
```

### Quick Import Examples

```tsx
// Option A: Central barrel import
import { SplitText, ShinyText, NumberTicker, BorderBeam, ShimmerButton } from '@/components/animations';

// Option B: React Bits library import
import { SplitText, BlurText, DecryptedText } from '@/components/ui/react-bits';

// Option C: Magic UI library import
import { NumberTicker, BorderBeam, ShimmerButton, Meteors } from '@/components/ui/magic-ui';

// Option D: Motion for React direct primitives
import { motion, AnimatePresence, useSpring } from 'motion/react';
```

---

## 2. Integrated Free UI & Animation Primitives

### A. React Bits Primitives ([reactbits.dev](https://reactbits.dev/))
- **License:** MIT License
- **Framework:** `motion/react` & `gsap`

1. **`SplitText`**: Staggered character or word reveal with custom delays, eases, and highlighting.
2. **`ShinyText`**: Subtle, editorial light-sweep telemetry shimmer across badges or headlines.
3. **`BlurText`**: Multi-word or multi-letter blur-in animation with directional translation.
4. **`DecryptedText`**: Interactive cyber/matrix scramble text decoder effect on hover or viewport entry.
5. **`ScrollReveal`**: GSAP ScrollTrigger-driven reveal for long-form editorial sections.

---

### B. Magic UI Primitives ([magicui.design](https://magicui.design/))
- **License:** MIT License
- **Framework:** `motion/react` + Tailwind CSS

1. **`NumberTicker`**: Smooth spring-based numerical ticker using `useSpring` and `useTransform`.
2. **`BorderBeam`**: Traveling animated laser/glow perimeter border beam around cards.
3. **`AnimatedShinyText`**: High-performance gradient shine pass over technical text.
4. **`ShimmerButton`**: Metallic/conic gradient shimmering CTA action button.
5. **`Meteors`**: Falling celestial streak background effect for hero containers.
6. **`PulsatingButton`**: Pulsing radar ripple button for active alerts and live status.

---

### C. Aceternity UI Primitives ([ui.aceternity.com](https://ui.aceternity.com/))
- **License:** MIT License

1. **`Spotlight`**: Ambient radial forest-green illumination without raster asset bloat.

---

## 3. Design Token Palette

| Token | CSS Variable | Hex Code | Visual Semantic Role |
| :--- | :--- | :--- | :--- |
| **Charcoal Void** | `--color-background` | `#090B09` | Deepest surface baseline, page backdrop |
| **Surface Base** | `--color-surface` | `#111611` | Primary cards, panels, top navigation bar |
| **Surface Elevated** | `--color-surface-elevated` | `#171D18` | Elevated containers, table row hover, inputs |
| **Surface Forest** | `--color-surface-forest` | `#102016` | Accent pill backdrops, recommendation cards |
| **Forest Green Base** | `--color-forest` | `#214D35` | Active state tabs, model health indicators |
| **Forest Green Highlight** | `--color-forest-highlight` | `#447A56` | Primary badges, metric lifts, repeat probability |
| **Crimson Red Base** | `--color-crimson` | `#C82038` | Primary CTA buttons, decision boundaries, high risk |
| **Crimson Red Highlight** | `--color-crimson-highlight` | `#E33B4F` | Urgent risk alerts, active selection lines |
| **Warm Ivory** | `--color-text-primary` | `#F2F0E8` | High-contrast editorial headlines, primary copy |
| **Slate Sage** | `--color-text-secondary` | `#A6AEA5` | Subtitles, muted labels, secondary metrics |
| **Hairline Olive** | `--color-border-subtle` | `#29332B` | Hairline dividers, crisp card boundaries |

---

## 4. Active Page Integration Matrix

| Page / Route | Animation & Interaction Capabilities | Integrated Components |
| :--- | :--- | :--- |
| **AppShell Layout** (`/`) | Page-to-page cross-fade route transitions | `AnimatePresence mode="wait"`, `useOutlet()`, `motion.main` |
| **Overview** (`/`) | Editorial character cascade header reveal<br>Spring-eased KPI metric tickers<br>Clickable risk distribution bars filtering queue<br>Operational risk cutoff slider ($30\% - 90\%$) with live ROI<br>Below-the-fold narrative scroll reveal<br>Animated Recharts bars | `SplitText` (characters), `NumberTicker`, `BorderBeam`, `Spotlight`, `ScrollReveal`, Recharts `Bar` |
| **Prediction Studio** (`/prediction-studio`) | 350ms debounced live model inference<br>Direct stepper buttons & accessible numeric inputs<br>What-If Scenario Comparison (A vs B with feature diff table & $\Delta$ percentage points)<br>Feature Sensitivity Analysis (recency, spend, orders, freight)<br>Animated probability gauges & waterfall charts | `runLocalModelInference`, `predictCustomer`, Recharts `LineChart`, Recharts `BarChart`, `RadarChart`, `AnimatePresence` |
| **Feature Insights** (`/features`) | Smooth Recharts bar entrance animations<br>Category tab switching & feature detail drawer | Recharts `BarChart` (`isAnimationActive={true}`) |
| **Methodology** (`/methodology`) | Interactive business ROI simulator<br>Editorial narrative text scroll reveal | `ScrollReveal`, custom range controls |
| **Customer Explorer** (`/customers`) | Tier filtering, pagination, slide-over customer detail drawer | `CustomerDrawer`, `AnimatePresence` |


---

## 4. Verification & Production Build Status

- **Framework:** React 18 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`)
- **Animation Engine:** `motion/react` (^12.0.0)
- **TypeScript Compilation:** 0 errors (`tsc && vite build` passed in 1.73s)
- **Bundle Optimization:** Chunks split into `vendor-charts`, `vendor-motion`, `vendor-react`, and `vendor-icons`
