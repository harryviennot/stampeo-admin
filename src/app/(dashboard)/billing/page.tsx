"use client";

import {
  AlertTriangle,
  Coins,
  CreditCard,
  Gift,
  Hourglass,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeltaBadge } from "@/components/delta-badge";
import { InfoTooltip } from "@/components/info-tooltip";
import { LazyMount } from "@/components/lazy-mount";
import { useBillingOverview } from "@/hooks/use-stats";
import type { BillingOverview } from "@/lib/api";
import { ProjectionChart } from "./_components/projection-chart";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { MrrByTierChart } from "./_components/mrr-by-tier-chart";
import { UpcomingPaymentsTable } from "./_components/upcoming-payments-table";
import { AtRiskTable } from "./_components/at-risk-table";
import { formatAmount } from "./_components/format";

function KpiCard({
  label,
  value,
  loading,
  icon,
  badgeClass,
  info,
  footer,
}: {
  label: string;
  value: React.ReactNode;
  loading: boolean;
  icon: React.ReactNode;
  badgeClass?: string;
  info?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
              {info && <InfoTooltip content={info} />}
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {loading ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" />
              ) : (
                value
              )}
            </p>
            {!loading && footer && (
              <div className="text-xs text-muted-foreground">{footer}</div>
            )}
          </div>
          <Badge
            className={badgeClass ?? "bg-secondary text-secondary-foreground"}
            variant="secondary"
          >
            {icon}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function LeakageCard({
  data,
  loading,
}: {
  data: BillingOverview | undefined;
  loading: boolean;
}) {
  const currency = data?.currency ?? "eur";
  const leak = data?.discount_leakage;
  const gross = data?.gross_mrr ?? 0;
  const net = data?.net_mrr ?? 0;
  const waivedPct = gross > 0 ? Math.round(((gross - net) / gross) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold">Discount leakage</h3>
          <InfoTooltip
            content={
              <>
                <p className="font-medium text-foreground">
                  Gross list price vs money perceived
                </p>
                <p className="mt-1 text-muted-foreground">
                  Permanent (forever) coupons and 100%-off comps are excluded
                  from MRR. This shows how much list-price revenue is given away
                  each month and how many accounts are fully comped.
                </p>
              </>
            }
          />
        </div>

        {loading ? (
          <div className="mt-4 h-20 animate-pulse rounded bg-muted/40" />
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Gross MRR</p>
                <p className="text-lg font-bold tabular-nums text-muted-foreground">
                  {formatAmount(gross, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net MRR</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatAmount(net, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waived / mo</p>
                <p className="text-lg font-bold tabular-nums text-amber-600">
                  {formatAmount((data?.discount_leakage?.monthly_waived) ?? 0, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fully comped</p>
                <p className="text-lg font-bold tabular-nums">
                  {leak?.fully_comped_count ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                {leak?.discounted_count ?? 0} discounted account
                {(leak?.discounted_count ?? 0) === 1 ? "" : "s"}
              </span>
              {waivedPct > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                  <Gift className="h-3 w-3" />
                  {waivedPct}% of list MRR given away
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const { data, isPending } = useBillingOverview();
  const currency = data?.currency ?? "eur";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing &amp; Revenue</h1>
        <p className="text-muted-foreground">
          Money actually perceived — coupons and comps excluded from MRR &amp; ARR.
        </p>
      </div>

      {data?.stripe_error && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Stripe lookup had trouble — some figures may be incomplete.{" "}
            <span className="text-amber-700">{data.stripe_error}</span>
          </span>
        </div>
      )}

      {/* KPI row — responsive 2 → 3 → 6 across */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Net MRR"
          value={formatAmount(data?.net_mrr, currency)}
          loading={isPending}
          icon={<TrendingUp className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Monthly recurring revenue net of permanent discounts. A 100%-off comp counts as 0."
        />
        <KpiCard
          label="ARR"
          value={formatAmount(data?.net_arr, currency)}
          loading={isPending}
          icon={<Coins className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Net MRR × 12."
        />
        <KpiCard
          label="Active paying"
          value={data?.active_count ?? 0}
          loading={isPending}
          icon={<Users className="h-4 w-4" />}
          info="Businesses with billing_status = active."
        />
        <KpiCard
          label="ARPA"
          value={formatAmount(data?.arpa, currency)}
          loading={isPending}
          icon={<CreditCard className="h-4 w-4" />}
          info="Average net revenue per active account (net MRR ÷ active count)."
        />
        <KpiCard
          label="Collected (mo)"
          value={formatAmount(data?.this_month_collected, currency)}
          loading={isPending}
          icon={<Wallet className="h-4 w-4" />}
          badgeClass="bg-blue-100 text-blue-700"
          info="Cash settled via Stripe so far this calendar month (post-discount)."
          footer={
            <DeltaBadge deltaPct={data?.mom_growth_pct ?? null} label="vs last mo" />
          }
        />
        <KpiCard
          label="Trial pipeline"
          value={formatAmount(data?.trial_pipeline_mrr, currency)}
          loading={isPending}
          icon={<Hourglass className="h-4 w-4" />}
          badgeClass="bg-violet-100 text-violet-700"
          info="Net MRR sitting in trials that have a card on file, if they all convert. No-card trials are excluded (no intent to pay)."
          footer={
            <>
              {`${data?.trial_pipeline_count ?? 0} with card`}
              {(data?.no_card_trial_count ?? 0) > 0 &&
                ` · ${data?.no_card_trial_count} no card (excluded)`}
            </>
          }
        />
      </div>

      <LeakageCard data={data} loading={isPending} />

      {/* Projection + revenue trend */}
      <LazyMount minHeight={320} className="grid gap-6 lg:grid-cols-2">
        <ProjectionChart />
        <RevenueTrendChart />
      </LazyMount>

      {/* Tier mix + upcoming payments */}
      <LazyMount minHeight={300} className="grid gap-6 lg:grid-cols-2">
        <MrrByTierChart data={data} isPending={isPending} />
        <UpcomingPaymentsTable />
      </LazyMount>

      {/* At-risk + founding note */}
      <LazyMount minHeight={260} className="grid gap-6 lg:grid-cols-2">
        <AtRiskTable />
        <Card className="border-violet-200 bg-violet-50/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-violet-700" />
              <h3 className="text-sm font-semibold text-violet-900">
                Founding-partner pricing
              </h3>
            </div>
            <p className="mt-2 text-sm text-violet-800">
              Founding partners pay 50% off Starter &amp; Growth —{" "}
              <span className="font-semibold">€10</span> /{" "}
              <span className="font-semibold">€20</span>, with Pro at full{" "}
              <span className="font-semibold">€60</span>. Founding pricing closes
              at the end of summer (date TBD) — after that, fresh signups pay
              public rates and net MRR from new business should rise.
            </p>
            <p className="mt-2 text-xs text-violet-700">
              Existing founding partners keep their rate; their discount is baked
              into the Stripe price, so it&apos;s already reflected in net MRR
              above.
            </p>
          </CardContent>
        </Card>
      </LazyMount>
    </div>
  );
}
