"use client";

import { useMemo, useState } from "react";
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
import { SegmentedToggle } from "@/components/segmented-toggle";
import { useTimeseries } from "@/hooks/use-stats";

type Mode = "weekly" | "daily";

const config: ChartConfig = {
  scans_added: { label: "Scans", color: "var(--chart-3)" },
  redemptions: { label: "Redemptions", color: "var(--chart-4)" },
  scans_trend: { label: "Scans (4w avg)", color: "var(--chart-1)" },
};

function formatBucket(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function ScansChart() {
  const [mode, setMode] = useState<Mode>("weekly");
  const isDaily = mode === "daily";

  const { data, isPending } = useTimeseries(
    isDaily
      ? { bucket: "day", range: "30d" }
      : { bucket: "week", range: "12w" }
  );
  const buckets = data?.buckets ?? [];

  // 4-week rolling average only makes sense on weekly buckets.
  const chartData = useMemo(() => {
    if (isDaily) return buckets;
    return buckets.map((b, i) => {
      const windowStart = Math.max(0, i - 3);
      const slice = buckets.slice(windowStart, i + 1);
      const avg =
        slice.reduce((s, x) => s + x.scans_added, 0) / (slice.length || 1);
      return { ...b, scans_trend: Math.round(avg) };
    });
  }, [buckets, isDaily]);

  const last = buckets[buckets.length - 1];
  const prev = buckets[buckets.length - 2];
  const scansDelta = last && prev ? delta(last.scans_added, prev.scans_added) : null;
  const redemptionsDelta =
    last && prev ? delta(last.redemptions, prev.redemptions) : null;

  const totalScans = buckets.reduce((s, b) => s + b.scans_added, 0);
  const totalRedemptions = buckets.reduce((s, b) => s + b.redemptions, 0);
  const redemptionRate =
    totalScans > 0 ? Math.round((totalRedemptions / totalScans) * 100) : 0;

  const best = useMemo(() => {
    if (buckets.length === 0) return null;
    const peak = buckets.reduce(
      (b, x) => (x.scans_added > b.scans_added ? x : b),
      buckets[0]
    );
    return peak.scans_added > 0 ? peak : null;
  }, [buckets]);

  const isCurrentPeak = best && last && best.period_start === last.period_start;
  const latestLabel = isDaily ? "today" : "this week";
  const bestLabel = isDaily ? "Best day" : "Best week";

  return (
    <ChartCard
      title="Scans & redemptions"
      subtitle={
        isDaily
          ? "Last 30 days · daily"
          : "Last 12 weeks · with 4-week rolling average"
      }
      info={
        <>
          <p className="font-medium text-foreground">Platform-wide scan activity</p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium">Scans</span>: rows in{" "}
            <span className="font-medium">transactions</span> with{" "}
            type <span className="font-medium">stamp_added or points_earned</span>.{" "}
            <span className="font-medium">Redemptions</span>:{" "}
            type = <span className="font-medium">&apos;redeem&apos;</span>. Redemption
            rate = redemptions / scans. Switch to daily for a per-day line over
            the last 30 days.
          </p>
        </>
      }
      legend={
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-3)" label="Scans" />
          <LegendItem color="var(--chart-4)" label="Redemptions" />
          {!isDaily && <LegendItem color="var(--chart-1)" label="4w avg" />}
        </div>
      }
      headerRight={
        <SegmentedToggle<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "daily", label: "Daily" },
          ]}
        />
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
              label={`Scans ${latestLabel}`}
              value={last?.scans_added ?? 0}
              delta={scansDelta}
            />
            <HeadlineTile
              label={`Redemptions ${latestLabel}`}
              value={last?.redemptions ?? 0}
              delta={redemptionsDelta}
            />
            <HeadlineTile
              label="Redemption rate"
              value={`${redemptionRate}%`}
              subtitle={`${totalRedemptions.toLocaleString()} of ${totalScans.toLocaleString()}`}
            />
            <HeadlineTile
              label={bestLabel}
              value={best ? best.scans_added : "—"}
              subtitle={
                best
                  ? `${formatBucket(best.period_start)}${
                      isCurrentPeak ? " · current" : ""
                    }`
                  : undefined
              }
              icon={best ? <Award className="h-3.5 w-3.5" /> : undefined}
            />
          </div>

          {/* One ComposedChart for both modes (swapping the chart component type
              under Recharts v3's ResponsiveContainer can fail to re-init). Daily
              renders two Lines (scans + redemptions); weekly renders Bars + the
              4-week trend Line. `key` forces a clean remount between modes. */}
          <ChartContainer config={config} className="h-[240px] w-full">
            <ComposedChart
              key={mode}
              data={chartData}
              margin={{ left: 4, right: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="period_start"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatBucket}
                fontSize={11}
                minTickGap={isDaily ? 24 : 5}
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
                    labelFormatter={(v) => formatBucket(v as string)}
                  />
                }
              />
              {isDaily ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="scans_added"
                    stroke="var(--color-scans_added)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="redemptions"
                    stroke="var(--color-redemptions)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="scans_added"
                    fill="var(--color-scans_added)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="redemptions"
                    fill="var(--color-redemptions)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="scans_trend"
                    stroke="var(--color-scans_trend)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </>
              )}
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
