"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { DeltaBadge } from "@/components/delta-badge";
import { useTimeseries } from "@/hooks/use-stats";

const scansConfig: ChartConfig = {
  scans_added: { label: "Scans", color: "var(--chart-3)" },
  redemptions: { label: "Redemptions", color: "var(--chart-4)" },
};

const customersConfig: ChartConfig = {
  new_customers: { label: "New customers", color: "var(--chart-2)" },
};

function formatWeek(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function wowDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function ChartsRow({ businessId }: { businessId: string }) {
  const { data, isPending } = useTimeseries({
    bucket: "week",
    range: "12w",
    business_id: businessId,
  });

  const buckets = data?.buckets ?? [];
  const scansWow = (() => {
    if (buckets.length < 2) return null;
    const last = buckets[buckets.length - 1];
    const prev = buckets[buckets.length - 2];
    return wowDelta(last.scans_added, prev.scans_added);
  })();
  const customersWow = (() => {
    if (buckets.length < 2) return null;
    const last = buckets[buckets.length - 1];
    const prev = buckets[buckets.length - 2];
    return wowDelta(last.new_customers, prev.new_customers);
  })();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Scans & redemptions"
        subtitle="Last 12 weeks"
        legend={
          <div className="flex items-center gap-3">
            <LegendItem color="var(--chart-3)" label="Scans" />
            <LegendItem color="var(--chart-4)" label="Redemptions" />
          </div>
        }
        headerRight={<DeltaBadge deltaPct={scansWow} label="WoW" />}
      >
        {isPending ? (
          <div className="h-[220px] animate-pulse rounded bg-muted/40" />
        ) : buckets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No activity
          </p>
        ) : (
          <ChartContainer config={scansConfig} className="h-[220px] w-full">
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
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => formatWeek(v as string)}
                  />
                }
              />
              <Bar
                dataKey="scans_added"
                fill="var(--color-scans_added)"
                radius={4}
              />
              <Bar
                dataKey="redemptions"
                fill="var(--color-redemptions)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard
        title="New customers per week"
        subtitle="Last 12 weeks"
        headerRight={<DeltaBadge deltaPct={customersWow} label="WoW" />}
      >
        {isPending ? (
          <div className="h-[220px] animate-pulse rounded bg-muted/40" />
        ) : buckets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No signups
          </p>
        ) : (
          <ChartContainer
            config={customersConfig}
            className="h-[220px] w-full"
          >
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
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => formatWeek(v as string)}
                  />
                }
              />
              <Bar
                dataKey="new_customers"
                fill="var(--color-new_customers)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </ChartCard>
    </div>
  );
}
