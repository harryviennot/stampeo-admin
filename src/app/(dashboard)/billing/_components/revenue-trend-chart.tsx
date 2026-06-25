"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, LegendItem } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useRevenueTrend } from "@/hooks/use-stats";
import { formatAmount, formatAmountCompact, monthShort } from "./format";

const config: ChartConfig = {
  collected: { label: "Collected", color: "var(--chart-1)" },
  net_mrr: { label: "Net MRR", color: "var(--chart-2)" },
};

export function RevenueTrendChart() {
  const { data, isPending } = useRevenueTrend(12);
  const currency = data?.currency ?? "eur";
  const buckets = data?.buckets ?? [];
  const hasMrrHistory = buckets.some((b) => b.net_mrr !== null);
  const total = buckets.reduce((s, b) => s + b.collected, 0);

  return (
    <ChartCard
      title="Revenue trend"
      subtitle="Collected per month — money actually received"
      info={
        <>
          <p className="font-medium text-foreground">
            Cash collected each month
          </p>
          <p className="mt-1 text-muted-foreground">
            Sums <span className="font-medium">amount_paid</span> across Stripe
            invoices settled that month (already net of every coupon). The Net
            MRR line appears once daily snapshots have accrued history.
          </p>
        </>
      }
      legend={
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-1)" label="Collected" />
          {hasMrrHistory && <LegendItem color="var(--chart-2)" label="Net MRR" />}
        </div>
      }
      headerRight={
        <span className="text-sm font-bold tabular-nums">
          {formatAmount(total, currency)}
        </span>
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : buckets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No revenue yet
        </p>
      ) : (
        <ChartContainer config={config} className="h-[260px] w-full">
          <ComposedChart data={buckets} margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickFormatter={monthShort}
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
                  labelFormatter={(v) => monthShort(v as string)}
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium tabular-nums">
                        {formatAmount(value as number, currency)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="collected"
              fill="var(--color-collected)"
              radius={4}
              maxBarSize={48}
            />
            {hasMrrHistory && (
              <Line
                dataKey="net_mrr"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
