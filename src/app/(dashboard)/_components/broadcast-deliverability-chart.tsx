"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartCard, LegendItem } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useBroadcastDeliverability } from "@/hooks/use-stats";

const config: ChartConfig = {
  apple_ok: { label: "Apple delivered", color: "var(--chart-2)" },
  google_ok: { label: "Google delivered", color: "var(--chart-3)" },
  google_not_inst: { label: "Google (no app)", color: "var(--chart-4)" },
  google_throttled: { label: "Google throttled", color: "#9ca3af" },
  skipped_no_push: { label: "No push token", color: "var(--chart-5)" },
  apple_fail: { label: "Apple failed", color: "#ef4444" },
  google_fail: { label: "Google failed", color: "#f97316" },
};

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function BroadcastDeliverabilityChart() {
  const { data, isPending } = useBroadcastDeliverability({
    bucket: "week",
    range: "12w",
  });
  const buckets = data?.buckets ?? [];

  const totals = buckets.reduce(
    (acc, b) => {
      acc.total += b.total;
      acc.reachable += b.reachable;
      acc.apple_ok += b.apple_ok;
      acc.google_ok += b.google_ok;
      return acc;
    },
    { total: 0, reachable: 0, apple_ok: 0, google_ok: 0 }
  );

  const deliveryRate =
    totals.reachable > 0
      ? Math.round(
          ((totals.apple_ok + totals.google_ok) / totals.reachable) * 100
        )
      : null;

  return (
    <ChartCard
      title="Broadcast deliverability"
      subtitle={`Last 12 weeks · ${totals.total.toLocaleString()} recipients queued`}
      headerRight={
        deliveryRate !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {deliveryRate}% delivered / reachable
          </span>
        ) : null
      }
      legend={
        <div className="flex flex-wrap items-center gap-3">
          <LegendItem color="var(--chart-2)" label="Apple ok" />
          <LegendItem color="var(--chart-3)" label="Google ok" />
          <LegendItem color="var(--chart-4)" label="No app" />
          <LegendItem color="var(--chart-5)" label="No push" />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[240px] animate-pulse rounded bg-muted/40" />
      ) : buckets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No broadcasts in this window
        </p>
      ) : (
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={buckets} margin={{ left: 4, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period_start"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatWeek}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              fontSize={11}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => formatWeek(v as string)}
                />
              }
            />
            <Bar dataKey="apple_ok" stackId="a" fill="var(--color-apple_ok)" />
            <Bar dataKey="google_ok" stackId="a" fill="var(--color-google_ok)" />
            <Bar
              dataKey="google_not_inst"
              stackId="a"
              fill="var(--color-google_not_inst)"
            />
            <Bar
              dataKey="google_throttled"
              stackId="a"
              fill="var(--color-google_throttled)"
            />
            <Bar
              dataKey="skipped_no_push"
              stackId="a"
              fill="var(--color-skipped_no_push)"
            />
            <Bar
              dataKey="apple_fail"
              stackId="a"
              fill="var(--color-apple_fail)"
            />
            <Bar
              dataKey="google_fail"
              stackId="a"
              fill="var(--color-google_fail)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
