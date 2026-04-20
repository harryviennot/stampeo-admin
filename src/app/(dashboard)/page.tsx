"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CircleDot,
  Clock,
  Crown,
  Gift,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import { useBillingBreakdown, useGlobalStats } from "@/hooks/use-stats";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BusinessSignupsChart } from "./_components/business-signups-chart";
import { CustomerSignupsChart } from "./_components/customer-signups-chart";
import { StampsChart } from "./_components/stamps-chart";
import {
  TopBusinessesAllTimeCard,
  TopBusinessesRollingCard,
} from "./_components/top-businesses-cards";

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

export default function DashboardPage() {
  const { data: stats, isPending: statsPending } = useGlobalStats();
  const { data: billing, isPending: billingPending } = useBillingBreakdown();

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

      {/* Stamps + headline strip (full width) */}
      <StampsChart />

      {/* Signups: businesses + customers (stacked by top 19 + other) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BusinessSignupsChart />
        <CustomerSignupsChart />
      </div>

      {/* Top businesses: rolling + all-time on their own row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopBusinessesRollingCard />
        <TopBusinessesAllTimeCard />
      </div>

      {/* Billing status — its own row */}
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
          <div className="h-[220px] animate-pulse rounded bg-muted/40" />
        ) : billingPieData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No billing data yet
          </p>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <ChartContainer config={{}} className="h-[220px] w-full md:max-w-[280px]">
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
            <div className="flex-1 space-y-1.5">
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
                  <span className="font-medium tabular-nums">{s.value}</span>
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
    </div>
  );
}
