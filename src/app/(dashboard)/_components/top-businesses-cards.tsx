"use client";

import Link from "next/link";
import { Clock, Trophy } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { DeltaBadge } from "@/components/delta-badge";
import {
  BillingStatusBadge,
  PlanBadge,
} from "@/components/business-utils";
import {
  useTopBusinesses,
  useTopBusinessesAllTime,
} from "@/hooks/use-stats";

function isInactive(last: string | null) {
  if (!last) return true;
  return Date.now() - new Date(last).getTime() > 14 * 24 * 60 * 60 * 1000;
}

export function TopBusinessesRollingCard() {
  const { data, isPending } = useTopBusinesses(10);

  return (
    <ChartCard
      title="Top businesses · last 7 days"
      subtitle="Scans, rolling 7-day window"
      info={
        <>
          <p className="font-medium text-foreground">Where activity is happening right now</p>
          <p className="mt-1 text-muted-foreground">
            Ranks businesses by <span className="font-medium">scans</span>{" "}
            (earn transactions) in the last rolling 7 days (not calendar week). Δ compares
            vs the prior 7-day window. &quot;Inactive 14d+&quot; flags businesses that
            were top-ranked but have gone silent for two weeks.
          </p>
        </>
      }
      headerRight={
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          rolling
        </span>
      }
    >
      {isPending ? (
        <div className="h-[240px] animate-pulse rounded bg-muted/40" />
      ) : !data || data.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No activity in the last 7 days
        </p>
      ) : (
        <div className="divide-y text-sm">
          {data.items.map((row, idx) => (
            <Link
              key={row.business_id}
              href={`/businesses/${row.business_id}`}
              className="-mx-2 flex items-center justify-between gap-2 rounded px-2 py-2 hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 text-xs font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="truncate font-medium">{row.name}</span>
                <PlanBadge tier={row.tier} />
                <BillingStatusBadge status={row.billing_status} />
                {isInactive(row.last_activity_at) && (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">
                    inactive 14d+
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-medium tabular-nums">
                  {row.scans_current.toLocaleString()}
                </span>
                <DeltaBadge deltaPct={row.delta_pct} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

export function TopBusinessesAllTimeCard() {
  const { data, isPending } = useTopBusinessesAllTime(10);

  return (
    <ChartCard
      title="Top businesses · all time"
      subtitle="Lifetime scans"
      info={
        <>
          <p className="font-medium text-foreground">Who are the platform&apos;s biggest contributors?</p>
          <p className="mt-1 text-muted-foreground">
            Cumulative <span className="font-medium">scans</span>{" "}
            since each business joined. Also shows total enrolled
            customers. Useful for identifying flagship accounts for case studies,
            pricing experiments, or support prioritization.
          </p>
        </>
      }
      headerRight={
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
          <Trophy className="h-3 w-3" />
          lifetime
        </span>
      }
    >
      {isPending ? (
        <div className="h-[240px] animate-pulse rounded bg-muted/40" />
      ) : !data || data.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No businesses with scans yet
        </p>
      ) : (
        <div className="divide-y text-sm">
          {data.items.map((row, idx) => (
            <Link
              key={row.business_id}
              href={`/businesses/${row.business_id}`}
              className="-mx-2 flex items-center justify-between gap-2 rounded px-2 py-2 hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 text-xs font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="truncate font-medium">{row.name}</span>
                <PlanBadge tier={row.tier} />
                <BillingStatusBadge status={row.billing_status} />
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className="text-muted-foreground tabular-nums">
                  {row.customers_total.toLocaleString()} cust.
                </span>
                <span className="font-medium tabular-nums text-sm">
                  {row.scans_total.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
