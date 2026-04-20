"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DeltaBadge } from "@/components/delta-badge";
import { useCustomerSignupsByBusiness } from "@/hooks/use-stats";

// Curated palette: 7 distinct, harmonious Tailwind-500 hues + slate for "Other".
// Stopping at 7 keeps each segment visually parseable — with 19 rainbow slices
// it becomes noise.
const PALETTE = [
  "#6366f1", // indigo-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
];
const OTHER_COLOR = "#cbd5e1"; // slate-300

const TOP_N = 7;

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

interface Row extends Record<string, string | number> {
  period_start: string;
  other: number;
  total: number;
}

export function CustomerSignupsChart() {
  const { data, isPending } = useCustomerSignupsByBusiness({
    bucket: "week",
    range: "12w",
    top_n: TOP_N,
  });

  const topBiz = data?.top_businesses ?? [];
  const buckets = data?.buckets ?? [];

  const rows = useMemo<Row[]>(() => {
    return buckets.map((b) => {
      const row: Row = { period_start: b.period_start, other: 0, total: 0 };
      let total = 0;
      for (const tb of topBiz) {
        const v = Number(b.values[tb.business_id] ?? 0);
        row[tb.business_id] = v;
        total += v;
      }
      const other = Number(b.values.other ?? 0);
      row.other = other;
      total += other;
      row.total = total;
      return row;
    });
  }, [buckets, topBiz]);

  const totalRange = rows.reduce((s, r) => s + r.total, 0);
  const totalOther = rows.reduce((s, r) => s + r.other, 0);
  const last = rows[rows.length - 1]?.total ?? 0;
  const prev = rows[rows.length - 2]?.total ?? 0;
  const delta = wowDelta(last, prev);

  const topShare =
    totalRange > 0
      ? Math.round(((totalRange - totalOther) / totalRange) * 100)
      : 0;

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    topBiz.forEach((tb, i) => {
      cfg[tb.business_id] = {
        label: tb.name,
        color: PALETTE[i] ?? OTHER_COLOR,
      };
    });
    cfg.other = { label: "Other", color: OTHER_COLOR };
    return cfg;
  }, [topBiz]);

  return (
    <ChartCard
      title="Customer signups"
      subtitle={`Last 12 weeks · ${totalRange.toLocaleString()} total${
        totalRange > 0 ? ` · top ${TOP_N} drive ${topShare}%` : ""
      }`}
      headerRight={
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums">{last}</span>
          <DeltaBadge deltaPct={delta} label="WoW" />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : rows.length === 0 || totalRange === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No customer signups
        </p>
      ) : (
        <div className="space-y-4">
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <BarChart data={rows} margin={{ left: 4, right: 4 }}>
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
              {topBiz.map((tb, i) => (
                <Bar
                  key={tb.business_id}
                  dataKey={tb.business_id}
                  stackId="signups"
                  fill={PALETTE[i] ?? OTHER_COLOR}
                  name={tb.name}
                />
              ))}
              <Bar
                key="other"
                dataKey="other"
                stackId="signups"
                fill={OTHER_COLOR}
                name="Other"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>

          {/* Ranked leaderboard — turns 8 legend dots into a useful summary. */}
          <div className="space-y-1.5">
            {topBiz.map((tb, i) => {
              const share =
                totalRange > 0 ? (tb.total / totalRange) * 100 : 0;
              return (
                <Link
                  key={tb.business_id}
                  href={`/businesses/${tb.business_id}`}
                  className="group flex items-center gap-3 rounded px-2 py-1 hover:bg-muted/50"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: PALETTE[i] ?? OTHER_COLOR }}
                  />
                  <span className="w-4 text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:underline">
                    {tb.name}
                  </span>
                  <div className="relative h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share}%`,
                        background: PALETTE[i] ?? OTHER_COLOR,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {share.toFixed(0)}%
                  </span>
                  <span className="w-12 shrink-0 text-right text-sm tabular-nums">
                    {tb.total.toLocaleString()}
                  </span>
                </Link>
              );
            })}
            {totalOther > 0 && (
              <div className="flex items-center gap-3 px-2 py-1 text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: OTHER_COLOR }}
                />
                <span className="w-4" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  Other businesses
                </span>
                <div className="relative h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(totalOther / totalRange) * 100}%`,
                      background: OTHER_COLOR,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums">
                  {((totalOther / totalRange) * 100).toFixed(0)}%
                </span>
                <span className="w-12 shrink-0 text-right text-sm tabular-nums">
                  {totalOther.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
