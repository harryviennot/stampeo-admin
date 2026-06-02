"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { PlanBadge } from "@/components/business-utils";
import { useTopBusinessesRewards } from "@/hooks/use-stats";

export function TopBusinessesRewardsCard() {
  const { data, isPending } = useTopBusinessesRewards(10);

  return (
    <ChartCard
      title="Rewards leaderboard · 7d"
      subtitle="Rewards redeemed · rolling 7 days"
      info={
        <>
          <p className="font-medium text-foreground">
            Who is actually closing loyalty loops?
          </p>
          <p className="mt-1 text-muted-foreground">
            Count of{" "}
            <span className="font-medium">reward_redeemed</span> transactions in
            the last 7 days. Rewards are the moment a customer gets paid back —
            the clearest signal a program is working end-to-end. Limited to
            businesses with ≥5 customers.{" "}
            <span className="font-medium">Higher is better.</span>
          </p>
        </>
      }
      headerRight={
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
          <Gift className="h-3 w-3" />
          rewards
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
                  {row.customers_total.toLocaleString()} cust.
                </span>
                <span className="font-medium tabular-nums text-sm">
                  {row.rewards.toLocaleString()}
                  <span className="ml-1 text-xs text-muted-foreground">
                    rewards
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
