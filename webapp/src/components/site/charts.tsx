/**
 * Theme-aware Recharts building blocks for the redesigned pages.
 * Colours are CSS variables, so the same chart works in light and Plum-night dark mode.
 */
import { useState, type ReactNode } from 'react';
import {
  Bar,
  Cell,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RateRow } from '../../lib/data/site-data';
import { num } from '../../lib/data/site-data';
import { useFigureInView } from './Figure';
import { reducedMotion } from '../../lib/motion';

const C = {
  series1: 'var(--color-chart-1)',
  series2: 'var(--color-chart-2)',
  ink: 'var(--color-ink)',
  ink2: 'var(--color-ink-2)',
  rule: 'var(--color-rule)',
  wash: 'var(--color-wash)',
};
/** Bars grow / lines draw when the figure scrolls into view. */
export const ANIM = () => ({ isAnimationActive: !reducedMotion(), animationDuration: 900, animationEasing: 'ease-out' as const });

/** Hovering a bar dims the others so the one you point at stands out. */
export function useHoverIndex() {
  const [active, setActive] = useState<number | null>(null);
  return {
    opacity: (i: number) => (active === null || active === i ? 1 : 0.4),
    handlers: {
      onMouseMove: (st: any) => setActive(typeof st?.activeTooltipIndex === 'number' ? st.activeTooltipIndex : null),
      onMouseLeave: () => setActive(null),
    },
  };
}

/** Holds the chart's space until the figure is on screen, so its entrance animation is seen. */
export function Stage({ height, children }: { height: number; children: ReactNode }) {
  const seen = useFigureInView();
  return seen ? <>{children}</> : <div style={{ height }} aria-hidden />;
}

const TICK = { fill: C.ink2, fontSize: 12, fontFamily: 'Archivo, system-ui, sans-serif' };
const MONO = { fill: C.ink, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 };

/** Rates under 1% need two decimals to be told apart. */
export const ratePct = (v: number) => `${(v * 100).toFixed(v < 0.01 ? 2 : 1)}%`;

function TipBox({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-rule bg-sheet px-3 py-2 text-[13px] text-ink shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-ink-2">{children}</div>
    </div>
  );
}

function RateTip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  const r: RateRow = payload[0].payload;
  return (
    <TipBox title={`${r.bucket}${unit ?? ''}`}>
      <p>
        <span className="font-mono text-ink">{ratePct(r.repeat_rate)}</span> bought again
      </p>
      <p>
        {num(r.repeaters)} of {num(r.customers)} customers
      </p>
    </TipBox>
  );
}

function CountTip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const r: RateRow = payload[0].payload;
  return (
    <TipBox title={r.bucket}>
      <p>
        <span className="font-mono text-ink">{num(r.customers)}</span> customers
        {total ? ` (${((r.customers / total) * 100).toFixed(1)}%)` : ''}
      </p>
    </TipBox>
  );
}

/** Average label drawn in the right margin, outside the bars, so it never covers a value. */
function AvgLabel({ viewBox, text }: any) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.x + viewBox.width + 8} y={viewBox.y} dy={4} style={TICK} fill={C.ink2}>
      {text}
    </text>
  );
}

/** Repeat rate per bucket, with the overall average as a dashed reference line. */
export function RateBars({
  rows,
  average,
  unit,
  xLabel,
  height = 280,
}: {
  rows: RateRow[];
  average: number;
  unit?: string;
  xLabel: string;
  height?: number;
}) {
  const hover = useHoverIndex();
  return (
    <Stage height={height}>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 28, right: 64, left: 0, bottom: 20 }} barCategoryGap="22%" {...hover.handlers}>
        <CartesianGrid vertical={false} stroke={C.rule} />
        <XAxis
          dataKey="bucket"
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: C.ink2 }}
          interval={0}
          label={{ value: xLabel, position: 'insideBottom', offset: -14, ...TICK }}
        />
        <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={ratePct} width={52} />
        <Tooltip content={<RateTip unit={unit} />} cursor={{ fill: C.wash }} />
        <ReferenceLine
          y={average}
          stroke={C.ink2}
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={<AvgLabel text={`avg ${ratePct(average)}`} />}
        />
        <Bar dataKey="repeat_rate" fill={C.series1} radius={[4, 4, 0, 0]} maxBarSize={72} {...ANIM()}>
          {rows.map((r, i) => (
            <Cell key={r.bucket} fillOpacity={hover.opacity(i)} style={{ transition: 'fill-opacity 0.2s' }} />
          ))}
          <LabelList dataKey="repeat_rate" position="top" formatter={ratePct} style={MONO} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </Stage>
  );
}

/** Horizontal repeat-rate bars for a ranked list (e.g. states): labels stay readable on phones. */
export function RateRankBars({ rows, average, xLabel }: { rows: RateRow[]; average: number; xLabel: string }) {
  const hover = useHoverIndex();
  const height = rows.length * 34 + 70;
  return (
    <Stage height={height}>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 24, right: 56, left: 0, bottom: 20 }} barCategoryGap="22%" {...hover.handlers}>
        <CartesianGrid horizontal={false} stroke={C.rule} />
        <YAxis type="category" dataKey="bucket" tick={TICK} tickLine={false} axisLine={{ stroke: C.ink2 }} width={36} />
        <XAxis
          type="number"
          tick={TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={ratePct}
          label={{ value: xLabel, position: 'insideBottom', offset: -14, ...TICK }}
        />
        <Tooltip content={<RateTip />} cursor={{ fill: C.wash }} />
        <ReferenceLine
          x={average}
          stroke={C.ink2}
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{ value: `avg ${ratePct(average)}`, position: 'top', ...TICK }}
        />
        <Bar dataKey="repeat_rate" fill={C.series1} radius={[0, 4, 4, 0]} maxBarSize={22} {...ANIM()}>
          {rows.map((r, i) => (
            <Cell key={r.bucket} fillOpacity={hover.opacity(i)} style={{ transition: 'fill-opacity 0.2s' }} />
          ))}
          <LabelList dataKey="repeat_rate" position="right" formatter={ratePct} style={MONO} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </Stage>
  );
}

/** Customer counts per bucket. */
export function CountBars({
  rows,
  xLabel,
  showShare = false,
  height = 280,
}: {
  rows: RateRow[];
  xLabel: string;
  showShare?: boolean;
  height?: number;
}) {
  const total = rows.reduce((s, r) => s + r.customers, 0);
  const label = (v: number) => (showShare ? `${((v / total) * 100).toFixed(1)}%` : num(v));
  const hover = useHoverIndex();
  return (
    <Stage height={height}>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 28, right: 8, left: 0, bottom: 20 }} barCategoryGap="22%" {...hover.handlers}>
        <CartesianGrid vertical={false} stroke={C.rule} />
        <XAxis
          dataKey="bucket"
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: C.ink2 }}
          interval={0}
          label={{ value: xLabel, position: 'insideBottom', offset: -14, ...TICK }}
        />
        <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={(v) => num(v)} width={64} />
        <Tooltip content={<CountTip total={showShare ? total : 0} />} cursor={{ fill: C.wash }} />
        <Bar dataKey="customers" fill={C.series1} radius={[4, 4, 0, 0]} maxBarSize={72} {...ANIM()}>
          {rows.map((r, i) => (
            <Cell key={r.bucket} fillOpacity={hover.opacity(i)} style={{ transition: 'fill-opacity 0.2s' }} />
          ))}
          <LabelList dataKey="customers" position="top" formatter={label} style={MONO} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </Stage>
  );
}

export interface SpendBin {
  from: number;
  to: number;
  inactive_share: number;
  repeat_share: number;
}

function SpendTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const b: SpendBin & { label: string } = payload[0].payload;
  return (
    <TipBox title={`Spend ${b.label}`}>
      <p>
        <span className="font-mono text-ink">{(b.repeat_share * 100).toFixed(1)}%</span> of returners
      </p>
      <p>
        <span className="font-mono text-ink">{(b.inactive_share * 100).toFixed(1)}%</span> of non-returners
      </p>
    </TipBox>
  );
}

const money = (v: number) => `$${v >= 100 ? Math.round(v) : v.toFixed(0)}`;

/** Two spend distributions on one shared % axis (same unit, so one axis is honest). */
export function SpendLines({ bins, xLabel, height = 300 }: { bins: SpendBin[]; xLabel: string; height?: number }) {
  const data = bins.map((b) => ({ ...b, label: `${money(b.from)}–${money(b.to)}`, mid: money(Math.sqrt(b.from * b.to)) }));
  return (
    <Stage height={height}>
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 20 }}>
        <CartesianGrid vertical={false} stroke={C.rule} />
        <XAxis
          dataKey="mid"
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: C.ink2 }}
          interval="preserveStartEnd"
          minTickGap={18}
          label={{ value: xLabel, position: 'insideBottom', offset: -14, ...TICK }}
        />
        <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `${+(v * 100).toFixed(1)}%`} width={48} />
        <Tooltip content={<SpendTip />} cursor={{ stroke: C.ink2, strokeDasharray: '3 3' }} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="plainline"
          wrapperStyle={{ ...TICK, paddingBottom: 8 }}
          formatter={(v) => <span style={{ color: 'var(--color-ink-2)' }}>{v}</span>}
        />
        <Line
          name="Came back"
          dataKey="repeat_share"
          stroke={C.series1}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: C.series1, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          {...ANIM()}
        />
        <Line
          name="Did not come back"
          dataKey="inactive_share"
          stroke={C.series2}
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={{ r: 3.5, fill: C.series2, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          {...ANIM()}
          animationBegin={250}
        />
      </LineChart>
    </ResponsiveContainer>
    </Stage>
  );
}

/** "Show the numbers" table under each figure: the same rows the chart draws. */
export function NumbersTable({ rows, bucketLabel }: { rows: RateRow[]; bucketLabel: string }) {
  return (
    <details className="mt-4 text-[14px]">
      <summary className="cursor-pointer select-none font-semibold text-route">Show the numbers</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="border-b-[1.5px] border-ink text-ink-2">
              <th className="py-2 pr-4 font-semibold">{bucketLabel}</th>
              <th className="py-2 pr-4 text-right font-semibold">Customers</th>
              <th className="py-2 pr-4 text-right font-semibold">Came back</th>
              <th className="py-2 text-right font-semibold">Repeat rate</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px]">
            {rows.map((r) => (
              <tr key={r.bucket} className="border-b border-rule">
                <td className="py-2 pr-4 font-ui text-[14px]">{r.bucket}</td>
                <td className="py-2 pr-4 text-right">{num(r.customers)}</td>
                <td className="py-2 pr-4 text-right">{num(r.repeaters)}</td>
                <td className="py-2 text-right">{ratePct(r.repeat_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
