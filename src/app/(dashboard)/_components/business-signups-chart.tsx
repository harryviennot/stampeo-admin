"use client";

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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DeltaBadge } from "@/components/delta-badge";
import { useTimeseries } from "@/hooks/use-stats";
import { useBusinesses } from "@/hooks/use-businesses";

function miniInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const config: ChartConfig = {
  new_businesses: { label: "New businesses", color: "var(--chart-1)" },
};

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function wowDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function BusinessSignupsChart() {
  const { data, isPending } = useTimeseries({ bucket: "week", range: "12w" });
  const { data: recent, isPending: recentPending } = useBusinesses({
    limit: 5,
  });
  const buckets = data?.buckets ?? [];
  const recentItems = recent?.items ?? [];

  const totalRange = buckets.reduce((s, b) => s + b.new_businesses, 0);
  const lastWeek = buckets[buckets.length - 1]?.new_businesses ?? 0;
  const prevWeek = buckets[buckets.length - 2]?.new_businesses ?? 0;
  const delta = wowDelta(lastWeek, prevWeek);

  return (
    <ChartCard
      title="Business signups"
      subtitle={`${totalRange} in last 12 weeks`}
      info={
        <>
          <p className="font-medium text-foreground">New businesses created per week</p>
          <p className="mt-1 text-muted-foreground">
            Counts <span className="font-medium">businesses.created_at</span> grouped
            by ISO week over the last 12 weeks. Includes all statuses (active, pending,
            suspended). WoW compares the latest week vs the previous one.
          </p>
        </>
      }
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

      <div className="mt-5 border-t pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Latest signups
          </h4>
          <Link
            href="/businesses"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            View all →
          </Link>
        </div>
        {recentPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No businesses yet
          </p>
        ) : (
          <ul className="space-y-1">
            {recentItems.slice(0, 5).map((biz) => (
              <li key={biz.id}>
                <Link
                  href={`/businesses/${biz.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  {biz.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={biz.logo_url}
                      alt={biz.name}
                      className="h-8 w-8 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
                      style={{
                        backgroundColor:
                          biz.settings?.accentColor || "#6366f1",
                      }}
                    >
                      {miniInitials(biz.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {biz.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {biz.owner_email || biz.owner_name || `/${biz.url_slug}`}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {formatWhen(biz.created_at)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ChartCard>
  );
}
