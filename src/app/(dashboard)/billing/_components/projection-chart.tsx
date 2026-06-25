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
  optimistic: { label: "Optimistic", color: "var(--chart-2)" },
  realistic: { label: "Realistic", color: "var(--chart-1)" },
  pessimistic: { label: "Pessimistic", color: "var(--chart-4)" },
};

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

  const points =
    data?.scenarios.realistic.mrr.map((_, i) => ({
      label: monthLabel(i),
      optimistic: data.scenarios.optimistic.mrr[i],
      realistic: data.scenarios.realistic.mrr[i],
      pessimistic: data.scenarios.pessimistic.mrr[i],
    })) ?? [];

  const a = data?.assumptions;

  return (
    <ChartCard
      title="MRR projection · next 12 months"
      subtitle="Pessimistic · realistic · optimistic — net of permanent discounts"
      info={
        <>
          <p className="font-medium text-foreground">
            Where MRR is heading under three scenarios
          </p>
          <p className="mt-1 text-muted-foreground">
            Starts from current net MRR and evolves each month as{" "}
            <span className="font-medium">prior × (1 − churn) + new MRR</span>.
            New MRR is the average net revenue from newly-activated paying
            businesses per month (card payers only). Scenarios scale churn and
            acquisition up or down; the curve trends toward a stable equilibrium
            rather than collapsing.
          </p>
        </>
      }
      legend={
        a ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            churn {(a.churn_rate * 100).toFixed(1)}%/mo · +
            {formatAmount(a.new_mrr_per_month, currency)}/mo new
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
