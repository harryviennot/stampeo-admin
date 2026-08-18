"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useBillingProjections } from "@/hooks/use-stats";
import { formatAmount, formatAmountCompact } from "./format";

const config: ChartConfig = {
  actual: { label: "Actual", color: "var(--foreground)" },
  optimistic: { label: "Optimistic", color: "var(--chart-2)" },
  realistic: { label: "Realistic", color: "var(--chart-1)" },
  pessimistic: { label: "Pessimistic", color: "var(--chart-4)" },
};

// Low confidence has to read as a warning: a projection off two departures
// must not render with the same authority as one off two hundred.
const confidenceStyles: Record<"low" | "medium" | "high", string> = {
  low: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  medium: "bg-muted text-muted-foreground",
  high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

/** "2026-06" -> a short localized month label, matching the forecast axis. */
function shortMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

function monthLabel(offset: number): string {
  if (offset === 0) return "Now";
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString(undefined, { month: "short" });
}

export function ProjectionChart() {
  const { data, isPending } = useBillingProjections();
  const currency = data?.currency ?? "eur";

  // Trailing actuals first, then the forecast. The handover point carries BOTH
  // an `actual` and the three scenario values, so the solid history line meets
  // the projection instead of leaving a gap at "Now".
  const history = data?.history ?? [];
  const historyPoints = history.map((h) => ({
    label: shortMonth(h.month),
    actual: h.net_mrr,
  }));

  const forecastPoints =
    data?.scenarios.realistic.mrr.map((_, i) => ({
      label: monthLabel(i),
      optimistic: data.scenarios.optimistic.mrr[i],
      realistic: data.scenarios.realistic.mrr[i],
      pessimistic: data.scenarios.pessimistic.mrr[i],
      // Only "Now" is both the last actual and the first forecast point.
      ...(i === 0 ? { actual: data.scenarios.realistic.mrr[0] } : {}),
    })) ?? [];

  const points = [...historyPoints, ...forecastPoints];

  // Month-over-month growth across the actuals, which is the honest check on
  // whether the projected new-MRR run rate is believable.
  const lastActual = history.at(-1)?.net_mrr;
  const prevActual = history.at(-2)?.net_mrr;
  const actualGrowthPct =
    lastActual != null && prevActual ? ((lastActual - prevActual) / prevActual) * 100 : null;

  const a = data?.assumptions;

  return (
    <ChartCard
      title="MRR projection · next 12 months"
      subtitle="Solid line is real month-end MRR; dashed is the forecast band"
      info={
        <>
          <p className="font-medium text-foreground">
            Where MRR is heading under three scenarios
          </p>
          <p className="mt-1 text-muted-foreground">
            The solid line left of <span className="font-medium">Now</span> is
            real month-end net MRR, so the forecast can be checked against what
            the book has actually been doing rather than taken on trust. If the
            projected slope looks nothing like the actual one, trust the actuals.
          </p>
          <p className="mt-1 text-muted-foreground">
            Starts from current net MRR and evolves each month as{" "}
            <span className="font-medium">prior × (1 − churn) + new MRR</span>.
            The first months come from the trials already on hand, weighted by
            the measured trial→paid rate; later months use the acquisition run
            rate.
          </p>
          <p className="mt-1 text-muted-foreground">
            <strong>Churn is measured on paying customers only.</strong> A trial
            that expires without ever paying is a conversion failure, not churn,
            so it is excluded. The rate is weighted by customer-months at risk
            and pulled toward a 3%/mo prior while the sample is thin
            {a?.churn_events !== undefined && a?.exposure_months !== undefined
              ? ` (currently ${a.churn_events} ${
                  a.churn_events === 1 ? "departure" : "departures"
                } over ${Math.round(a.exposure_months)} customer-months)`
              : ""}
            .
          </p>
          <p className="mt-1 text-muted-foreground">
            <strong>New business is priced at public rates.</strong> Every
            current payer is a grandfathered founding partner on €10/€20, but
            new signups pay €20/€40, so the run rate is repriced forward rather
            than extrapolated
            {a?.conversion_haircut !== undefined
              ? ` — then discounted ${Math.round(
                  (1 - a.conversion_haircut) * 100
                )}% for the conversion the price rise costs, ${
                  a.haircut_measured ? "measured" : "assumed"
                } while the post-4-Aug cohort is young`
              : ""}
            . Grandfathered partners keep their real rate in the starting MRR.
          </p>
          {a?.window_months !== undefined && !a.window_is_full && (
            <p className="mt-1 text-muted-foreground">
              <strong>Window widens on its own.</strong> Churn is measured over
              the {a.window_months} month
              {a.window_months === 1 ? "" : "s"} of paid history that exist,
              growing to {a.window_target_months ?? 6} as the book ages. No
              change needed — the band narrows as the sample grows.
            </p>
          )}
        </>
      }
      legend={
        a ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            {a.confidence && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  confidenceStyles[a.confidence]
                }`}
                title={
                  a.confidence === "low"
                    ? "Thin sample — treat the spread, not the line, as the answer"
                    : "Sample size behind churn and conversion"
                }
              >
                {a.confidence} confidence
              </span>
            )}
            <span>
              churn {(a.churn_rate * 100).toFixed(1)}%/mo
              {a.window_months !== undefined
                ? ` over ${a.window_months}mo`
                : ""}{" "}
              · +{formatAmount(a.new_mrr_per_month, currency)}/mo new
              {actualGrowthPct != null && (
                <>
                  {" · "}
                  <span title="Real month-over-month growth across the last two completed months">
                    last mo actual {actualGrowthPct > 0 ? "+" : ""}
                    {Math.round(actualGrowthPct)}%
                  </span>
                </>
              )}
            </span>
          </span>
        ) : undefined
      }
    >
      {isPending ? (
        <div className="h-[280px] animate-pulse rounded bg-muted/40" />
      ) : points.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No projection data
        </p>
      ) : (
        <>
          <ChartContainer config={config} className="h-[280px] w-full">
            <ComposedChart data={points} margin={{ left: 4, right: 8 }}>
              <defs>
                <linearGradient id="realisticFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                fontSize={11}
                tickFormatter={(v) => formatAmountCompact(v as number, currency)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="capitalize text-muted-foreground">
                          {name}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatAmount(value as number, currency)}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="realistic"
                stroke="transparent"
                fill="url(#realisticFill)"
                isAnimationActive={false}
              />
              <Line
                dataKey="actual"
                stroke="var(--foreground)"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
                isAnimationActive={false}
                connectNulls={false}
              />
              <Line
                dataKey="optimistic"
                stroke="var(--chart-2)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="realistic"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="pessimistic"
                stroke="var(--chart-4)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>

          {data && a?.churn_rate_low !== undefined &&
            a?.churn_rate_high !== undefined && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground tabular-nums">
                Scenarios span the measured churn band{" "}
                {(a.churn_rate_low * 100).toFixed(1)}–
                {(a.churn_rate_high * 100).toFixed(1)}%/mo
                {a.trial_conversion_sample
                  ? ` and the ${a.trial_conversion_sample}-trial conversion sample`
                  : ""}
                , not fixed multipliers.
              </p>
            )}

          {data && (
            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
              {(["pessimistic", "realistic", "optimistic"] as const).map(
                (k) => (
                  <div key={k}>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {k} ARR
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {formatAmount(data.scenarios[k].arr_eoy, currency)}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}
