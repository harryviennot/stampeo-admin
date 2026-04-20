"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  CircleDot,
  Clock,
  ShieldCheck,
  Gift,
  ArrowRight,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { ChartCard, LegendItem } from "@/components/chart-card";
import { DeltaBadge } from "@/components/delta-badge";
import {
  BillingStatusBadge,
  PlanBadge,
} from "@/components/business-utils";
import {
  useBillingBreakdown,
  useGlobalStats,
  useTimeseries,
  useTopBusinesses,
} from "@/hooks/use-stats";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const signupsConfig: ChartConfig = {
  new_businesses: { label: "Businesses", color: "var(--chart-1)" },
  new_customers: { label: "Customers", color: "var(--chart-2)" },
};

const stampsConfig: ChartConfig = {
  stamps_added: { label: "Stamps", color: "var(--chart-3)" },
  redemptions: { label: "Redemptions", color: "var(--chart-4)" },
};

const billingColors: Record<string, string> = {
  trial: "var(--chart-1)",
  active: "var(--chart-2)",
  grace: "var(--chart-3)",
  past_due: "var(--chart-4)",
  suspended: "var(--chart-5)",
  cancelled: "#9ca3af",
};

const billingLabels: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  grace: "Grace",
  past_due: "Past due",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

function formatWeek(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function wowDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default function DashboardPage() {
  const { data: stats, isPending: statsPending } = useGlobalStats();
  const { data: billing, isPending: billingPending } = useBillingBreakdown();
  const { data: signups, isPending: signupsPending } = useTimeseries({
    bucket: "week",
    range: "12w",
  });
  const { data: stampsSeries, isPending: stampsPending } = useTimeseries({
    bucket: "week",
    range: "12w",
  });
  const { data: top, isPending: topPending } = useTopBusinesses(10);

  const signupsData = signups?.buckets ?? [];
  const signupsWow = (() => {
    if (signupsData.length < 2) return null;
    const last = signupsData[signupsData.length - 1];
    const prev = signupsData[signupsData.length - 2];
    return wowDelta(last.new_businesses, prev.new_businesses);
  })();

  const stampsData = stampsSeries?.buckets ?? [];
  const stampsWow = (() => {
    if (stampsData.length < 2) return null;
    const last = stampsData[stampsData.length - 1];
    const prev = stampsData[stampsData.length - 2];
    return wowDelta(last.stamps_added, prev.stamps_added);
  })();

  const billingPieData = billing
    ? (
        [
          "trial",
          "active",
          "grace",
          "past_due",
          "suspended",
          "cancelled",
        ] as const
      )
        .map((k) => ({
          name: billingLabels[k],
          key: k,
          value: billing[k] ?? 0,
          fill: billingColors[k],
        }))
        .filter((s) => s.value > 0)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Businesses"
          value={stats?.total_businesses}
          loading={statsPending}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label="Total Customers"
          value={stats?.total_customers}
          loading={statsPending}
          icon={<Users className="h-4 w-4" />}
          trend={
            stats
              ? {
                  current: stats.customers_this_month,
                  previous: stats.customers_last_month,
                }
              : undefined
          }
        />
        <StatCard
          label="Total Stamps"
          value={stats?.total_stamps}
          loading={statsPending}
          icon={<CircleDot className="h-4 w-4" />}
          trend={
            stats
              ? {
                  current: stats.stamps_this_month,
                  previous: stats.stamps_last_month,
                }
              : undefined
          }
        />
        <StatCard
          label="Pending Applications"
          value={stats?.pending_businesses}
          loading={statsPending}
          icon={<Clock className="h-4 w-4" />}
          badgeClass={
            stats && stats.pending_businesses > 0
              ? "bg-amber-100 text-amber-700"
              : undefined
          }
        />
        <StatCard
          label="Certificates Available"
          value={stats?.certs_available}
          loading={statsPending}
          icon={<ShieldCheck className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Total Rewards"
          value={stats?.total_rewards_redeemed}
          loading={statsPending}
          icon={<Gift className="h-4 w-4" />}
        />
      </div>

      {/* Pending alert */}
      {stats && stats.pending_businesses > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <Clock className="h-4 w-4" />
              Pending Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber-700">
              {stats.pending_businesses} business
              {stats.pending_businesses !== 1 ? "es" : ""} waiting for approval.
            </p>
            <Link href="/businesses?status=pending">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                Review applications
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 2x2 chart grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Signups per week"
          subtitle="Last 12 weeks"
          legend={
            <div className="flex items-center gap-3">
              <LegendItem color="var(--chart-1)" label="Businesses" />
              <LegendItem color="var(--chart-2)" label="Customers" />
            </div>
          }
          headerRight={
            <DeltaBadge deltaPct={signupsWow} label="WoW (biz)" />
          }
        >
          {signupsPending ? (
            <div className="h-[240px] animate-pulse rounded bg-muted/40" />
          ) : signupsData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No signups in this window
            </p>
          ) : (
            <ChartContainer config={signupsConfig} className="h-[240px] w-full">
              <BarChart data={signupsData} margin={{ left: 4, right: 4 }}>
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
                  dataKey="new_businesses"
                  fill="var(--color-new_businesses)"
                  radius={4}
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

        <ChartCard
          title="Stamps & redemptions"
          subtitle="Last 12 weeks"
          legend={
            <div className="flex items-center gap-3">
              <LegendItem color="var(--chart-3)" label="Stamps" />
              <LegendItem color="var(--chart-4)" label="Redemptions" />
            </div>
          }
          headerRight={
            <DeltaBadge deltaPct={stampsWow} label="WoW (stamps)" />
          }
        >
          {stampsPending ? (
            <div className="h-[240px] animate-pulse rounded bg-muted/40" />
          ) : stampsData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No activity in this window
            </p>
          ) : (
            <ChartContainer config={stampsConfig} className="h-[240px] w-full">
              <BarChart data={stampsData} margin={{ left: 4, right: 4 }}>
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
                  dataKey="stamps_added"
                  fill="var(--color-stamps_added)"
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
          title="Billing status"
          subtitle="All businesses"
          headerRight={
            billing && billing.founding_partner_count > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                <Crown className="h-3 w-3" />
                {billing.founding_partner_count} founding
              </span>
            ) : null
          }
        >
          {billingPending ? (
            <div className="h-[240px] animate-pulse rounded bg-muted/40" />
          ) : billingPieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No billing data yet
            </p>
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <ChartContainer
                config={{}}
                className="h-[220px] w-full md:max-w-[280px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={billingPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    strokeWidth={2}
                  >
                    {billingPieData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-2">
                {billingPieData.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: s.fill }}
                      />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
                {billing &&
                  billing.grace_expiring_soon &&
                  billing.grace_expiring_soon.length > 0 && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/50 p-2 text-xs">
                      <div className="flex items-center gap-1 font-medium text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        {billing.grace_expiring_soon.length} grace expiring soon
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Top businesses this week"
          subtitle="Stamps added, week-over-week"
        >
          {topPending ? (
            <div className="h-[240px] animate-pulse rounded bg-muted/40" />
          ) : !top || top.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No activity this week
            </p>
          ) : (
            <div className="divide-y text-sm">
              {top.items.map((row) => {
                const inactive =
                  !row.last_activity_at ||
                  Date.now() - new Date(row.last_activity_at).getTime() >
                    14 * 24 * 60 * 60 * 1000;
                return (
                  <Link
                    key={row.business_id}
                    href={`/businesses/${row.business_id}`}
                    className="flex items-center justify-between py-2 hover:bg-muted/40 -mx-2 px-2 rounded"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{row.name}</span>
                      <PlanBadge tier={row.tier} />
                      <BillingStatusBadge status={row.billing_status} />
                      {inactive && (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">
                          inactive 14d+
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-medium">
                        {row.stamps_this_week}
                      </span>
                      <DeltaBadge deltaPct={row.delta_pct} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
