"use client";

import {
  Activity,
  AlertTriangle,
  Building2,
  CircleDot,
  Clock,
  Crown,
  Gauge,
  Ghost,
  Gift,
  Repeat,
  ShieldCheck,
  Skull,
  Store,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import {
  useBillingBreakdown,
  useBusinessRetention,
  useGlobalStats,
  useInactiveSnapshot,
  useOnboardingFunnel,
  usePlatformHealth,
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
import { RevenueCard } from "./_components/revenue-card";
import { SetupWizardFunnelChart } from "./_components/setup-wizard-funnel-chart";
import { StampHeatmapCard } from "./_components/stamp-heatmap-card";
import { StampsChart } from "./_components/stamps-chart";
import {
  TopBusinessesAllTimeCard,
  TopBusinessesRollingCard,
} from "./_components/top-businesses-cards";
import { TopBusinessesDensityCard } from "./_components/top-businesses-density-card";
import { TopBusinessesHealthCard } from "./_components/top-businesses-health-card";
import { TopBusinessesRewardsCard } from "./_components/top-businesses-rewards-card";
import { TopBusinessesRepeatCard } from "./_components/top-businesses-repeat-card";
import { BusinessRetentionChart } from "./_components/business-retention-chart";
import { PaywallFunnelChart } from "./_components/paywall-funnel-chart";
import { PaywallCohortsChart } from "./_components/paywall-cohorts-chart";
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
  const { data: funnel, isPending: funnelPending } = useOnboardingFunnel({
    range: "90d",
  });
  const { data: health, isPending: healthPending } = usePlatformHealth();
  const { data: retention, isPending: retentionPending } =
    useBusinessRetention(16);

  const stickinessPct =
    health && health.stickiness !== null
      ? Math.round(health.stickiness * 100)
      : null;
  const repeatPct =
    health && health.repeat_cust_rate !== null
      ? Math.round(health.repeat_cust_rate * 100)
      : null;
  const retentionHeadline = retention?.headline ?? null;
  const retentionD60Pct =
    retentionHeadline !== null
      ? Math.round(retentionHeadline.rate_d60 * 100)
      : null;

  const completionRate = (() => {
    if (!funnel) return null;
    const denom = funnel.completed + funnel.abandoned;
    if (denom === 0) return null;
    return Math.round((funnel.completed / denom) * 100);
  })();
  const completionBadgeClass =
    completionRate === null
      ? undefined
      : completionRate >= 60
        ? "bg-emerald-100 text-emerald-700"
        : completionRate >= 40
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-700";

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
          label="Active Trials"
          value={billing?.trial}
          loading={billingPending}
          icon={<Clock className="h-4 w-4" />}
          badgeClass="bg-blue-100 text-blue-700"
          info={
            <>
              <p className="font-medium text-foreground">
                Businesses currently on a trial
              </p>
              <p className="mt-1 text-muted-foreground">
                Count of businesses with{" "}
                <span className="font-medium">billing_status = &apos;trial&apos;</span>.
                These haven&apos;t converted to paid yet — they don&apos;t
                contribute to MRR until they flip to{" "}
                <span className="font-medium">active</span>.
              </p>
            </>
          }
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
          label="Funnel Completion Rate"
          value={completionRate === null ? "—" : `${completionRate}%`}
          loading={funnelPending}
          icon={<TrendingUp className="h-4 w-4" />}
          badgeClass={completionBadgeClass}
          info={
            <>
              <p className="font-medium text-foreground">
                Authenticated wizard starters who completed signup (last 90d)
              </p>
              <p className="mt-1 text-muted-foreground">
                <span className="font-medium">completed ÷ (completed + abandoned)</span>{" "}
                across the post-auth onboarding wizard. Pre-auth drop-off
                (steps 1–3) is invisible here — see PostHog{" "}
                <span className="font-medium">onboarding_step_completed</span>{" "}
                for that.{" "}
                <span className="font-medium">Higher is better.</span>
              </p>
            </>
          }
        />
        <StatCard
          label="Certificates Available"
          value={stats?.certs_available}
          loading={statsPending}
          icon={<ShieldCheck className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Unassigned Apple Pass Type IDs in the pool. Each new business design consumes one. If this hits 0, new signups can't issue wallet passes."
        />
        {(() => {
          if (!stats) {
            return (
              <StatCard
                label="Cert Headroom"
                value={undefined}
                loading={statsPending}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
            );
          }
          const totalCerts = stats.certs_available + stats.certs_assigned;
          const delta = totalCerts - stats.total_businesses;
          const critical = delta <= 0;
          const warning = !critical && delta <= 10;
          const badgeClass = critical
            ? "bg-red-100 text-red-700"
            : warning
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700";
          return (
            <StatCard
              label="Cert Headroom"
              value={delta}
              loading={statsPending}
              icon={<ShieldCheck className="h-4 w-4" />}
              badgeClass={badgeClass}
              info={
                <>
                  <p className="font-medium text-foreground">
                    Pool size minus total businesses
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    ({totalCerts} total certs − {stats.total_businesses}{" "}
                    businesses). Positive = room to onboard without provisioning
                    more Pass Type IDs. Zero or negative = the pool is full and
                    new signups will fail until certificates are added.
                  </p>
                </>
              }
            />
          );
        })()}
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
        <StatCard
          label="Active Businesses · 7d"
          value={health?.active_biz_7d}
          loading={healthPending}
          icon={<Activity className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Distinct businesses with at least one stamp_added in the last 7 days — the platform's weekly active businesses (WAU)."
        />
        <StatCard
          label="Active Businesses · 30d"
          value={health?.active_biz_30d}
          loading={healthPending}
          icon={<Activity className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Distinct businesses with at least one stamp_added in the last 30 days — monthly active businesses (MAU)."
        />
        <StatCard
          label="Stickiness · WAU/MAU"
          value={stickinessPct === null ? "—" : `${stickinessPct}%`}
          loading={healthPending}
          icon={<Gauge className="h-4 w-4" />}
          badgeClass={
            stickinessPct === null
              ? undefined
              : stickinessPct >= 40
                ? "bg-emerald-100 text-emerald-700"
                : stickinessPct >= 20
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
          }
          info={
            <>
              <p className="font-medium text-foreground">How often active businesses come back</p>
              <p className="mt-1 text-muted-foreground">
                7-day active ÷ 30-day active businesses. A higher ratio means
                businesses use Stampeo most weeks of the month, not just once.{" "}
                <span className="font-medium">Higher is better.</span>
              </p>
            </>
          }
        />
        <StatCard
          label="Qualified Businesses"
          value={health?.qualified_biz}
          loading={healthPending}
          icon={<Store className="h-4 w-4" />}
          info={
            <>
              <p className="font-medium text-foreground">Businesses with more than 2 customers</p>
              <p className="mt-1 text-muted-foreground">
                Filters out demos and one-customer onboarding tests. A truer base
                count than total businesses.
              </p>
            </>
          }
        />
        <StatCard
          label="Qualified & Active"
          value={health?.qualified_active_biz}
          loading={healthPending}
          icon={<Store className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info={
            <>
              <p className="font-medium text-foreground">Real, live businesses</p>
              <p className="mt-1 text-muted-foreground">
                More than 2 customers <span className="font-medium">and</span>{" "}
                active in the last 30 days. The honest &quot;live businesses&quot;
                number to quote — immune to self-stamp demos.
              </p>
            </>
          }
        />
        <StatCard
          label="Repeat-Customer Rate"
          value={repeatPct === null ? "—" : `${repeatPct}%`}
          loading={healthPending}
          icon={<Repeat className="h-4 w-4" />}
          badgeClass={
            repeatPct === null
              ? undefined
              : repeatPct >= 40
                ? "bg-emerald-100 text-emerald-700"
                : repeatPct >= 25
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
          }
          info={
            <>
              <p className="font-medium text-foreground">Do end-customers come back?</p>
              <p className="mt-1 text-muted-foreground">
                Platform-wide share of customers who stamped on ≥2 distinct days
                ÷ customers who ever stamped. The single best proof the loyalty
                product retains. <span className="font-medium">Higher is better.</span>
              </p>
            </>
          }
        />
        <StatCard
          label="Median Days to First Stamp"
          value={
            health && health.median_days_first_stamp !== null
              ? Math.round(health.median_days_first_stamp * 10) / 10
              : "—"
          }
          loading={healthPending}
          icon={<Timer className="h-4 w-4" />}
          info="Median time from business signup to its first stamp_added, across businesses that ever stamped. Activation latency — if it creeps up, onboarding is getting harder. Lower is better."
        />
      </div>

      {/* ── Leaderboards ── */}
      <SectionHeader
        title="Leaderboards"
        description="The composite health score blends repeat rate, density, rewards and volume; the drill-downs break out each dimension. All exclude one-customer onboarding noise (≥5 customers)."
      />
      <TopBusinessesHealthCard />
      <div className="grid gap-4 lg:grid-cols-2">
        <TopBusinessesRollingCard />
        <TopBusinessesDensityCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TopBusinessesRepeatCard />
        <TopBusinessesRewardsCard />
      </div>
      <TopBusinessesAllTimeCard />

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
      <SetupWizardFunnelChart />

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
      <RevenueCard />
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

      {/* ── Retention & ad-readiness ── */}
      <SectionHeader
        title="Retention & ad-readiness"
        description="The day-60 retention of each business signup cohort. The gate: once a matured cohort holds ≥25% at day 60, paid acquisition is worth turning on (STA-199 / STA-204)."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Day-60 Retention · latest matured cohort"
          value={retentionD60Pct === null ? "—" : `${retentionD60Pct}%`}
          loading={retentionPending}
          icon={<Activity className="h-4 w-4" />}
          badgeClass={
            retentionHeadline === null
              ? undefined
              : retentionHeadline.pass
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
          }
          info={
            <>
              <p className="font-medium text-foreground">Ad-readiness gate: ≥ 25% at day 60</p>
              <p className="mt-1 text-muted-foreground">
                Share of the most recent fully-matured signup cohort still active
                (stamping) around day 60. At or above 25% means acquired
                businesses stick well enough to justify paid acquisition.
                <span className="font-medium"> Higher is better.</span>
              </p>
            </>
          }
        />
      </div>
      <BusinessRetentionChart />

      {/* ── Paywall ── */}
      <SectionHeader
        title="Hard paywall"
        description="Effect of requiring a card at the end of onboarding: top-of-funnel completion and trial→paid conversion, card-required cohort vs the grandfathered no-card baseline (STA-198 / STA-200 / STA-202)."
      />
      <PaywallFunnelChart />
      <PaywallCohortsChart />

      {/* ── Communication ── */}
      <SectionHeader
        title="Communication"
        description="How well do broadcast pushes actually reach customers? Failure modes are broken out separately so you can spot platform-specific issues."
      />
      <BroadcastDeliverabilityChart />
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
