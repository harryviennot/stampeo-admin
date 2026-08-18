"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import { ChartCard, LegendItem } from "@/components/chart-card";
import { DeltaBadge } from "@/components/delta-badge";
import { InfoTooltip } from "@/components/info-tooltip";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { usePricingCohortComparison } from "@/hooks/use-stats";
import type { PricingCohort } from "@/lib/api";
import { formatAmount, formatAmountCompact } from "./format";

const config: ChartConfig = {
  founding: { label: "Founding rates", color: "var(--chart-3)" },
  standard: { label: "Public rates", color: "var(--chart-1)" },
};

function pct(rate: number | null | undefined): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

/**
 * One metric row: founding-era value, standard-era value, and the delta.
 *
 * The delta is suppressed until the standard-era cohort is mature. Right after
 * the switch that cohort is empty, and a "-100%" against an empty baseline is
 * noise dressed up as a finding.
 */
function MetricRow({
  label,
  info,
  founding,
  standard,
  delta,
  showDelta,
  goodDirection,
}: {
  label: string;
  info: string;
  founding: string;
  standard: string;
  delta: number | null;
  showDelta: boolean;
  goodDirection: "up" | "down";
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 border-b last:border-b-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm truncate">{label}</span>
        <InfoTooltip content={info} />
      </div>
      <span className="text-sm tabular-nums text-muted-foreground w-24 text-right">
        {founding}
      </span>
      <span className="text-sm font-semibold tabular-nums w-24 text-right">
        {standard}
      </span>
      <span className="w-24 flex justify-end">
        {showDelta && delta != null ? (
          <DeltaBadge deltaPct={goodDirection === "down" ? -delta : delta} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </span>
    </div>
  );
}

export function PricingCohortComparison() {
  const { data, isPending } = usePricingCohortComparison();
  const currency = data?.currency ?? "eur";

  const founding: PricingCohort | undefined = data?.founding;
  const standard: PricingCohort | undefined = data?.standard;
  const showDelta = !!standard?.is_mature;

  const switchDate = data?.switch_at
    ? new Date(data.switch_at).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const chartRows = [
    {
      label: "ARPA",
      founding: founding?.arpa ?? 0,
      standard: standard?.arpa ?? 0,
    },
    {
      label: "LTV",
      founding: founding?.ltv ?? 0,
      standard: standard?.ltv ?? 0,
    },
    {
      label: "Rev / 100 signups",
      founding: founding?.revenue_per_100_signups ?? 0,
      standard: standard?.revenue_per_100_signups ?? 0,
    },
  ];

  return (
    <ChartCard
      title="Founding vs public pricing"
      subtitle={
        switchDate
          ? `Signups before vs from ${switchDate}`
          : "Signups before vs after the price switch"
      }
      info={
        <>
          Did closing the founding program pay off? Conversion should fall (the
          price doubled) while ARPA and LTV rise.{" "}
          <strong>Revenue per 100 signups</strong> folds both together and is the
          number that actually settles it.
          <br />
          <br />
          Founding-era means the business carries the founding flag or signed up
          before the switch. Resellers are excluded from both cohorts: they sit
          on a separate negotiated discount.
          <br />
          <br />
          LTV is modelled as ARPA ÷ monthly churn, not observed revenue.
        </>
      }
      legend={
        <>
          <LegendItem color="var(--chart-3)" label="Founding" />
          <LegendItem color="var(--chart-1)" label="Public" />
        </>
      }
    >
      {isPending ? (
        <div className="h-[280px] animate-pulse rounded-md bg-muted/40" />
      ) : (
        <div className="space-y-4">
          {!showDelta && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Not enough data on public rates yet
                {standard
                  ? ` — ${standard.signups} signups, ${
                      standard.matured ?? 0
                    } past their trial`
                  : ""}
                . With a 30-day trial plus grace, the first real conversions
                land about a month after the switch, so conversion here reads
                &ldquo;—&rdquo; rather than 0%. Deltas stay hidden until then.
              </span>
            </div>
          )}

          <div>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 pb-1.5 border-b text-[11px] uppercase tracking-wide text-muted-foreground">
              <span>Metric</span>
              <span className="w-24 text-right">Founding</span>
              <span className="w-24 text-right">Public</span>
              <span className="w-24 text-right">Change</span>
            </div>

            <MetricRow
              label="Signups"
              info="Businesses created under each pricing regime, resellers excluded."
              founding={String(founding?.signups ?? 0)}
              standard={String(standard?.signups ?? 0)}
              delta={null}
              showDelta={false}
              goodDirection="up"
            />
            <MetricRow
              label="Signup → paid"
              info="Share of the cohort that reached a real first payment (first_paid_at). Expected to fall now that the entry price doubled."
              founding={pct(founding?.conversion_rate)}
              standard={pct(standard?.conversion_rate)}
              delta={data?.deltas.conversion_rate ?? null}
              showDelta={showDelta}
              goodDirection="up"
            />
            <MetricRow
              label="ARPA"
              info="Net MRR ÷ active businesses in the cohort. Should roughly double, since founding partners pay 50% off Starter and Growth."
              founding={formatAmount(founding?.arpa, currency)}
              standard={formatAmount(standard?.arpa, currency)}
              delta={data?.deltas.arpa ?? null}
              showDelta={showDelta}
              goodDirection="up"
            />
            <MetricRow
              label="Monthly churn"
              info={
                standard?.churn_measured
                  ? "Logo churn over the trailing 90 days, clamped to 1–25%/mo."
                  : "Borrowed from the blended rate: this cohort has no churn history yet. LTV inherits that assumption."
              }
              founding={pct(founding?.monthly_churn)}
              standard={pct(standard?.monthly_churn)}
              delta={null}
              showDelta={false}
              goodDirection="down"
            />
            <MetricRow
              label="LTV (modelled)"
              info="ARPA ÷ monthly churn. An estimate, not observed revenue, and it is only as good as the churn term above."
              founding={formatAmount(founding?.ltv, currency)}
              standard={formatAmount(standard?.ltv, currency)}
              delta={data?.deltas.ltv ?? null}
              showDelta={showDelta}
              goodDirection="up"
            />
            <MetricRow
              label="Revenue / 100 signups"
              info="Conversion rate × LTV × 100. The verdict metric: it nets the conversion drop against the ARPA gain. If this is up, the price rise worked."
              founding={formatAmount(founding?.revenue_per_100_signups, currency)}
              standard={formatAmount(standard?.revenue_per_100_signups, currency)}
              delta={data?.deltas.revenue_per_100_signups ?? null}
              showDelta={showDelta}
              goodDirection="up"
            />
          </div>

          <ChartContainer config={config} className="h-[200px] w-full">
            <BarChart data={chartRows} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                fontSize={11}
                tickFormatter={(v) => formatAmountCompact(v as number, currency)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>
                        {config[name as keyof typeof config]?.label}:{" "}
                        {formatAmount(value as number, currency)}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="founding" fill="var(--color-founding)" radius={3} />
              <Bar dataKey="standard" fill="var(--color-standard)" radius={3} />
            </BarChart>
          </ChartContainer>

          {(data?.reseller_excluded_count ?? 0) > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {data?.reseller_excluded_count} reseller account
              {data?.reseller_excluded_count === 1 ? "" : "s"} excluded from both
              cohorts.
            </p>
          )}
        </div>
      )}
    </ChartCard>
  );
}
