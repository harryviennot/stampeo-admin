"use client";

import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { PlanBadge } from "@/components/business-utils";
import { useTopBusinessesHealth } from "@/hooks/use-stats";

export function TopBusinessesHealthCard() {
  const { data, isPending } = useTopBusinessesHealth(10);

  return (
    <ChartCard
      title="Health leaderboard"
      subtitle="Composite score · repeat · density · rewards · volume"
      info={
        <>
          <p className="font-medium text-foreground">
            Which businesses are healthiest overall?
          </p>
          <p className="mt-1 text-muted-foreground">
            A 0–100 score blending four normalized metrics across qualifying
            businesses (≥5 customers and active in the last 7 days, which filters
            out onboarding self-scanning):{" "}
            <span className="font-medium">repeat-customer rate ×0.40</span>,{" "}
            <span className="font-medium">scans-per-customer ×0.25</span>,{" "}
            <span className="font-medium">rewards given ×0.20</span>,{" "}
            <span className="font-medium">7-day scan volume ×0.15</span>. Volume
            is deliberately down-weighted so whales don&apos;t dominate.{" "}
            <span className="font-medium">Higher is better.</span>
          </p>
        </>
      }
      headerRight={
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
          <HeartPulse className="h-3 w-3" />
          score
        </span>
      }
    >
      {isPending ? (
        <div className="h-[240px] animate-pulse rounded bg-muted/40" />
      ) : !data || data.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No qualifying businesses
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
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className="text-muted-foreground tabular-nums">
                  {row.repeat_rate !== null
                    ? `${Math.round(row.repeat_rate * 100)}% repeat`
                    : "—"}
                </span>
                <span className="font-medium tabular-nums text-sm">
                  {row.score.toFixed(1)}
                  <span className="ml-1 text-xs text-muted-foreground">
                    / 100
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
