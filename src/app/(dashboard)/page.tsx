"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CircleDot,
  Clock,
  Crown,
  Ghost,
  Gift,
  ShieldCheck,
  Skull,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import {
  useBillingBreakdown,
  useGlobalStats,
  useInactiveSnapshot,
} from "@/hooks/use-stats";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ActivationFunnelChart } from "./_components/activation-funnel-chart";
import { BroadcastDeliverabilityChart } from "./_components/broadcast-deliverability-chart";
import { BusinessSignupsChart } from "./_components/business-signups-chart";
import { CustomerSignupsChart } from "./_components/customer-signups-chart";
import { OnboardingFunnelChart } from "./_components/onboarding-funnel-chart";
import { PassLifecycleChart } from "./_components/pass-lifecycle-chart";
import { StampHeatmapCard } from "./_components/stamp-heatmap-card";
import { StampsChart } from "./_components/stamps-chart";
import {
  TopBusinessesAllTimeCard,
  TopBusinessesRollingCard,
} from "./_components/top-businesses-cards";
import { TopBusinessesDensityCard } from "./_components/top-businesses-density-card";
import { TrialCohortsChart } from "./_components/trial-cohorts-chart";

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
  const { data: inactive, isPending: inactivePending } = useInactiveSnapshot();

  const zombiePct =
    inactive && inactive.total_customers > 0
      ? Math.round((inactive.zombie_customers / inactive.total_customers) * 100)
      : null;
  const ghostPct =
    inactive && inactive.total_businesses > 0
      ? Math.round(
          (inactive.ghost_businesses_7d / inactive.total_businesses) * 100
        )
      : null;
  const zombieSuffix = zombiePct === null ? "" : ` · ${zombiePct}%`;
  const ghostSuffix = ghostPct === null ? "" : ` · ${ghostPct}%`;

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

      {/* ── Platform totals ── */}
      <SectionHeader
        title="Platform totals"
        description="Lifetime counts across every business on the platform, with month-over-month trends on customer and stamp volume."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Businesses"
          value={stats?.total_businesses}
          loading={statsPending}
          icon={<Building2 className="h-4 w-4" />}
          info="Every business row regardless of status (active, pending, suspended). Lifetime count — doesn't include businesses that were hard-deleted."
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
          info="Every customer ever enrolled across all businesses. The percentage compares customers created this calendar month vs last month."
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
          info="Every stamp_added transaction ever recorded. Trend compares this month vs last month — the primary gauge of platform usage."
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
          info="Businesses with status = 'pending' awaiting approval. Since the open-funnel rollout this should usually be 0 — a non-zero value means a business was explicitly held for review."
        />
        <StatCard
          label="Certificates Available"
          value={stats?.certs_available}
          loading={statsPending}
          icon={<ShieldCheck className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Unassigned Apple Pass Type IDs in the pool. Each new business design consumes one. If this hits 0, new signups can't issue wallet passes."
        />
        <StatCard
          label="Total Rewards"
          value={stats?.total_rewards_redeemed}
          loading={statsPending}
          icon={<Gift className="h-4 w-4" />}
          info="Rows in transactions with type = 'redeem'. Counts lifetime reward redemptions — complements total stamps by showing how many loyalty loops actually closed."
        />
        <StatCard
          label={`Zombie Customers${zombieSuffix}`}
          value={inactive?.zombie_customers}
          loading={inactivePending}
          icon={<Skull className="h-4 w-4" />}
          badgeClass={
            zombiePct !== null && zombiePct >= 30
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }
          info={
            <>
              <p className="font-medium text-foreground">Customers who enrolled but never scanned</p>
              <p className="mt-1 text-muted-foreground">
                Zero <span className="font-medium">stamp_added</span>{" "}
                transactions ever. Percentage = zombies ÷ total customers.
                Above 30% turns red — a signal that onboarding is leaky
                (customers install the pass but don&apos;t come back).{" "}
                <span className="font-medium">Lower is better.</span>
              </p>
            </>
          }
        />
        <StatCard
          label={`Ghost Businesses · 7d+${ghostSuffix}`}
          value={inactive?.ghost_businesses_7d}
          loading={inactivePending}
          icon={<Ghost className="h-4 w-4" />}
          badgeClass={
            ghostPct !== null && ghostPct >= 30
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }
          info={
            <>
              <p className="font-medium text-foreground">Businesses that signed up but never scanned</p>
              <p className="mt-1 text-muted-foreground">
                Created &gt; 7 days ago with zero{" "}
                <span className="font-medium">stamp_added</span> transactions
                ever. Percentage = ghosts ÷ total businesses. Surfaces
                post-signup activation failures — the ones most likely to churn
                before paying.{" "}
                <span className="font-medium">Lower is better.</span>
              </p>
            </>
          }
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

      {/* ── Growth ── */}
      <SectionHeader
        title="Growth"
        description="Weekly inflow of stamps, new businesses, and new customers. The signal you check to answer 'is the platform growing?'."
      />
      <StampsChart />
      <div className="grid gap-4 lg:grid-cols-2">
        <BusinessSignupsChart />
        <CustomerSignupsChart />
      </div>

      {/* ── Funnels & activation ── */}
      <SectionHeader
        title="Funnels & activation"
        description="Where prospects and new businesses drop off. Pre-signup shows the onboarding wizard; post-signup tracks whether businesses actually use the product."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <OnboardingFunnelChart />
        <ActivationFunnelChart />
      </div>

      {/* ── Retention & engagement ── */}
      <SectionHeader
        title="Retention & engagement"
        description="Do customers keep their passes installed, and when are they actually scanning? These metrics catch leaks the growth charts miss."
      />
      <PassLifecycleChart />
      <StampHeatmapCard />

      {/* ── Monetization ── */}
      <SectionHeader
        title="Monetization"
        description="How quickly trial businesses convert to paid, and the current billing mix across the platform."
      />
      <TrialCohortsChart />
      <ChartCard
        title="Billing status"
        subtitle="All businesses"
        info={
          <>
            <p className="font-medium text-foreground">Current billing mix</p>
            <p className="mt-1 text-muted-foreground">
              Breakdown of every business by{" "}
              <span className="font-medium">billing_status</span>:{" "}
              trial, active, grace (payment retry), past_due, suspended,
              cancelled. &quot;Founding partner&quot; count tracks legacy
              grandfathered accounts — the program closed on 2026-05-19.
            </p>
          </>
        }
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

      {/* ── Communication ── */}
      <SectionHeader
        title="Communication"
        description="How well do broadcast pushes actually reach customers? Failure modes are broken out separately so you can spot platform-specific issues."
      />
      <BroadcastDeliverabilityChart />

      {/* ── Leaderboards ── */}
      <SectionHeader
        title="Leaderboards"
        description="Who's driving activity right now, who's most engaged per customer, and who are the all-time heavyweights."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <TopBusinessesRollingCard />
        <TopBusinessesDensityCard />
      </div>
      <TopBusinessesAllTimeCard />
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b pb-2 pt-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
