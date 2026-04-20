"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { DeltaBadge } from "@/components/delta-badge";
import { useTimeseries } from "@/hooks/use-stats";

const config: ChartConfig = {
  new_businesses: { label: "New businesses", color: "var(--chart-1)" },
};

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function wowDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function BusinessSignupsChart() {
  const { data, isPending } = useTimeseries({ bucket: "week", range: "12w" });
  const buckets = data?.buckets ?? [];

  const totalRange = buckets.reduce((s, b) => s + b.new_businesses, 0);
  const lastWeek = buckets[buckets.length - 1]?.new_businesses ?? 0;
  const prevWeek = buckets[buckets.length - 2]?.new_businesses ?? 0;
  const delta = wowDelta(lastWeek, prevWeek);

  return (
    <ChartCard
      title="Business signups"
      subtitle={`${totalRange} in last 12 weeks`}
      headerRight={
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums">{lastWeek}</span>
          <DeltaBadge deltaPct={delta} label="WoW" />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[240px] animate-pulse rounded bg-muted/40" />
      ) : buckets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No business signups
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
              width={28}
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
            <Bar
              dataKey="new_businesses"
              fill="var(--color-new_businesses)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
