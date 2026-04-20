"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { PlanBadge } from "@/components/business-utils";
import { useTopBusinessesDensity } from "@/hooks/use-stats";

export function TopBusinessesDensityCard() {
  const { data, isPending } = useTopBusinessesDensity(10);

  return (
    <ChartCard
      title="Density leaderboard · 7d"
      subtitle="Stamps per customer · rolling 7 days"
      headerRight={
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
          <TrendingUp className="h-3 w-3" />
          density
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
          {data.items.map((row, idx) => {
            // Note: API returns tier but not billing_status — pass tier only.
            return (
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
                    {row.stamps_per_customer.toFixed(2)}
                    <span className="text-xs text-muted-foreground ml-1">
                      / cust
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
