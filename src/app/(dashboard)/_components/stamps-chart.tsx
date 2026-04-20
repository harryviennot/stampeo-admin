"use client";

import { useMemo } from "react";
import { Award } from "lucide-react";
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
import { DeltaBadge } from "@/components/delta-badge";
import { useTimeseries } from "@/hooks/use-stats";

const config: ChartConfig = {
  stamps_added: { label: "Stamps", color: "var(--chart-3)" },
  redemptions: { label: "Redemptions", color: "var(--chart-4)" },
  stamps_trend: { label: "Stamps (4w avg)", color: "var(--chart-1)" },
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

export function StampsChart() {
  const { data, isPending } = useTimeseries({ bucket: "week", range: "12w" });
  const buckets = data?.buckets ?? [];

  const chartData = useMemo(() => {
    return buckets.map((b, i) => {
      const windowStart = Math.max(0, i - 3);
      const slice = buckets.slice(windowStart, i + 1);
      const avg =
        slice.reduce((s, x) => s + x.stamps_added, 0) / (slice.length || 1);
      return { ...b, stamps_trend: Math.round(avg) };
    });
  }, [buckets]);

  const last = buckets[buckets.length - 1];
  const prev = buckets[buckets.length - 2];
  const stampsDelta = last && prev ? wowDelta(last.stamps_added, prev.stamps_added) : null;
  const redemptionsDelta =
    last && prev ? wowDelta(last.redemptions, prev.redemptions) : null;

  const totalStamps = buckets.reduce((s, b) => s + b.stamps_added, 0);
  const totalRedemptions = buckets.reduce((s, b) => s + b.redemptions, 0);
  const redemptionRate =
    totalStamps > 0 ? Math.round((totalRedemptions / totalStamps) * 100) : 0;

  const bestWeek = useMemo(() => {
    if (buckets.length === 0) return null;
    const peak = buckets.reduce(
      (best, b) => (b.stamps_added > best.stamps_added ? b : best),
      buckets[0]
    );
    return peak.stamps_added > 0 ? peak : null;
  }, [buckets]);

  const isCurrentWeekPeak =
    bestWeek && last && bestWeek.period_start === last.period_start;

  return (
    <ChartCard
      title="Stamps & redemptions"
      subtitle="Last 12 weeks · with 4-week rolling average"
      legend={
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-3)" label="Stamps" />
          <LegendItem color="var(--chart-4)" label="Redemptions" />
          <LegendItem color="var(--chart-1)" label="4w avg" />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[320px] animate-pulse rounded bg-muted/40" />
      ) : buckets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No activity in this window
        </p>
      ) : (
        <div className="space-y-4">
          {/* Headline strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeadlineTile
              label="Stamps this week"
              value={last?.stamps_added ?? 0}
              delta={stampsDelta}
            />
            <HeadlineTile
              label="Redemptions this week"
              value={last?.redemptions ?? 0}
              delta={redemptionsDelta}
            />
            <HeadlineTile
              label="Redemption rate"
              value={`${redemptionRate}%`}
              subtitle={`${totalRedemptions.toLocaleString()} of ${totalStamps.toLocaleString()}`}
            />
            <HeadlineTile
              label="Best week"
              value={bestWeek ? bestWeek.stamps_added : "—"}
              subtitle={
                bestWeek
                  ? `${formatWeek(bestWeek.period_start)}${
                      isCurrentWeekPeak ? " · current" : ""
                    }`
                  : undefined
              }
              icon={bestWeek ? <Award className="h-3.5 w-3.5" /> : undefined}
            />
          </div>

          <ChartContainer config={config} className="h-[240px] w-full">
            <ComposedChart data={chartData} margin={{ left: 4, right: 4 }}>
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
              <Bar
                dataKey="stamps_added"
                fill="var(--color-stamps_added)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="redemptions"
                fill="var(--color-redemptions)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="stamps_trend"
                stroke="var(--color-stamps_trend)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}

function HeadlineTile({
  label,
  value,
  delta,
  subtitle,
  icon,
}: {
  label: string;
  value: number | string;
  delta?: number | null;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {delta !== undefined && delta !== null && (
          <DeltaBadge deltaPct={delta} />
        )}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {subtitle}
        </div>
      )}
    </div>
  );
}
