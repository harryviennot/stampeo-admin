"use client";

import Link from "next/link";
import { Repeat } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { PlanBadge } from "@/components/business-utils";
import { useTopBusinessesRepeat } from "@/hooks/use-stats";

export function TopBusinessesRepeatCard() {
  const { data, isPending } = useTopBusinessesRepeat(10);

  return (
    <ChartCard
      title="Repeat-customer leaderboard"
      subtitle="Share of customers who came back"
      info={
        <>
          <p className="font-medium text-foreground">
            Whose customers actually return?
          </p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium">Repeat rate</span> = customers who
            stamped on ≥2 distinct days ÷ customers who ever stamped. Using
            distinct days (not raw stamps) means a single multi-stamp onboarding
            visit doesn&apos;t count as a return. Limited to businesses with ≥5
            customers. <span className="font-medium">Higher is better.</span>
          </p>
        </>
      }
      headerRight={
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">
          <Repeat className="h-3 w-3" />
          repeat
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
                  {row.repeat_customers.toLocaleString()}/
                  {row.customers_total.toLocaleString()}
                </span>
                <span className="font-medium tabular-nums text-sm">
                  {Math.round(row.repeat_rate * 100)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
