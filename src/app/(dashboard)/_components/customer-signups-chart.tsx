"use client";

import { useMemo, useState } from "react";
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
import { SegmentedToggle } from "@/components/segmented-toggle";
import {
  useCustomerSignupsByBusiness,
  useCustomerSignupsTopPerBucket,
} from "@/hooks/use-stats";
import type { CustomerSignupsTopPerBucketSlot } from "@/lib/api";

type Mode = "overall" | "per_week";

// Curated palette: distinct, harmonious Tailwind-500 hues + slate for "Other".
const PALETTE = [
  "#6366f1", // indigo-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
];
const OTHER_COLOR = "#cbd5e1"; // slate-300

// "Overall" ranks by total across the window; "per week" ranks each week's own
// businesses. Per-week shows 8 so single-week breakouts surface.
const TOP_N_OVERALL = 7;
const TOP_N_PER_WEEK = 8;

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

interface OverallRow extends Record<string, string | number> {
  period_start: string;
  other: number;
  total: number;
}

interface PerWeekRow {
  period_start: string;
  other: number;
  total: number;
  __slots: CustomerSignupsTopPerBucketSlot[];
  [rankKey: string]: number | string | CustomerSignupsTopPerBucketSlot[];
}

export function CustomerSignupsChart() {
  const [mode, setMode] = useState<Mode>("overall");
  const isPerWeek = mode === "per_week";

  const { data: overallData, isPending: overallPending } =
    useCustomerSignupsByBusiness(
      { bucket: "week", range: "12w", top_n: TOP_N_OVERALL },
      { enabled: !isPerWeek }
    );
  const { data: perWeekData, isPending: perWeekPending } =
    useCustomerSignupsTopPerBucket(
      { bucket: "week", range: "12w", top_n: TOP_N_PER_WEEK },
      { enabled: isPerWeek }
    );

  const topBiz = overallData?.top_businesses ?? [];
  const overallBuckets = overallData?.buckets ?? [];

  const overallRows = useMemo<OverallRow[]>(() => {
    return overallBuckets.map((b) => {
      const row: OverallRow = { period_start: b.period_start, other: 0, total: 0 };
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
  }, [overallBuckets, topBiz]);

  const perWeekRows = useMemo<PerWeekRow[]>(() => {
    return (perWeekData?.buckets ?? []).map((b) => {
      const row: PerWeekRow = {
        period_start: b.period_start,
        other: b.other,
        total: b.total,
        __slots: b.slots,
      };
      for (let r = 1; r <= TOP_N_PER_WEEK; r++) {
        const slot = b.slots.find((s) => s.rank === r);
        row[`rank_${r}`] = slot ? slot.count : 0;
      }
      return row;
    });
  }, [perWeekData]);

  // Shared headline figures derived from whichever dataset is active.
  const totalsByBucket = isPerWeek
    ? perWeekRows.map((r) => r.total)
    : overallRows.map((r) => r.total);
  const totalRange = totalsByBucket.reduce((s, t) => s + t, 0);
  const last = totalsByBucket[totalsByBucket.length - 1] ?? 0;
  const prev = totalsByBucket[totalsByBucket.length - 2] ?? 0;
  const delta = wowDelta(last, prev);

  const totalOther = overallRows.reduce((s, r) => s + r.other, 0);
  const topShare =
    totalRange > 0
      ? Math.round(((totalRange - totalOther) / totalRange) * 100)
      : 0;

  const overallConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    topBiz.forEach((tb, i) => {
      cfg[tb.business_id] = { label: tb.name, color: PALETTE[i] ?? OTHER_COLOR };
    });
    cfg.other = { label: "Other", color: OTHER_COLOR };
    return cfg;
  }, [topBiz]);

  const perWeekConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (let r = 1; r <= TOP_N_PER_WEEK; r++) {
      cfg[`rank_${r}`] = { label: `#${r}`, color: PALETTE[r - 1] ?? OTHER_COLOR };
    }
    cfg.other = { label: "Other", color: OTHER_COLOR };
    return cfg;
  }, []);

  const isPending = isPerWeek ? perWeekPending : overallPending;
  const isEmpty = isPerWeek
    ? perWeekRows.length === 0 || totalRange === 0
    : overallRows.length === 0 || totalRange === 0;

  return (
    <ChartCard
      title="Customer signups"
      subtitle={
        isPerWeek
          ? `Last 12 weeks · each week's top ${TOP_N_PER_WEEK}`
          : `Last 12 weeks · ${totalRange.toLocaleString()} total${
              totalRange > 0 ? ` · top ${TOP_N_OVERALL} drive ${topShare}%` : ""
            }`
      }
      info={
        <>
          <p className="font-medium text-foreground">New customers per week, stacked by business</p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium">Top overall</span> ranks businesses by
            total over the whole window, so a business with one standout week is
            buried in &quot;Other&quot;. <span className="font-medium">Top per week</span>{" "}
            ranks each week&apos;s own businesses (#1 to #{TOP_N_PER_WEEK}),
            surfacing single-week breakouts. Colours are by rank in that mode;
            hover for the business names.
          </p>
        </>
      }
      headerRight={
        <div className="flex items-center gap-3">
          {!isPerWeek && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tabular-nums">{last}</span>
              <DeltaBadge deltaPct={delta} label="WoW" />
            </div>
          )}
          <SegmentedToggle<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "overall", label: "Top overall" },
              { value: "per_week", label: "Top per week" },
            ]}
          />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : isEmpty ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No customer signups
        </p>
      ) : isPerWeek ? (
        <div className="space-y-3">
          <ChartContainer config={perWeekConfig} className="h-[240px] w-full">
            <BarChart data={perWeekRows} margin={{ left: 4, right: 4 }}>
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
              <ChartTooltip content={<PerWeekTooltip />} />
              {Array.from({ length: TOP_N_PER_WEEK }, (_, i) => (
                <Bar
                  key={`rank_${i + 1}`}
                  dataKey={`rank_${i + 1}`}
                  stackId="signups"
                  fill={PALETTE[i] ?? OTHER_COLOR}
                  name={`#${i + 1}`}
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

          {/* Rank legend — identity rotates per week, so colours mean rank. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {Array.from({ length: TOP_N_PER_WEEK }, (_, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: PALETTE[i] ?? OTHER_COLOR }}
                />
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: OTHER_COLOR }}
              />
              <span className="text-xs text-muted-foreground">Other</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ChartContainer config={overallConfig} className="h-[240px] w-full">
            <BarChart data={overallRows} margin={{ left: 4, right: 4 }}>
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

          {/* Ranked leaderboard — turns legend dots into a useful summary. */}
          <div className="space-y-1.5">
            {topBiz.map((tb, i) => {
              const share = totalRange > 0 ? (tb.total / totalRange) * 100 : 0;
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

function PerWeekTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PerWeekRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const slots = row.__slots ?? [];
  return (
    <div className="rounded-lg border bg-background p-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{formatWeek(row.period_start)}</div>
      <div className="space-y-0.5">
        {slots.map((s) => (
          <div key={s.business_id} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: PALETTE[s.rank - 1] ?? OTHER_COLOR }}
            />
            <span className="max-w-[160px] flex-1 truncate">{s.name}</span>
            <span className="tabular-nums">{s.count}</span>
          </div>
        ))}
        {row.other > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: OTHER_COLOR }}
            />
            <span className="flex-1">Other</span>
            <span className="tabular-nums">{row.other}</span>
          </div>
        )}
      </div>
    </div>
  );
}
