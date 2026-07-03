"use client";

import { CircleDot, Gift, Skull, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import {
  useBusinessInactiveSnapshot,
  useBusinessStats,
} from "@/hooks/use-businesses";

export function StatsRow({ businessId }: { businessId: string }) {
  const { data: stats, isPending } = useBusinessStats(businessId);
  const { data: inactive, isPending: inactivePending } =
    useBusinessInactiveSnapshot(businessId);

  const zombiePct =
    inactive && inactive.total_customers > 0
      ? Math.round((inactive.zombie_customers / inactive.total_customers) * 100)
      : null;
  const zombieSuffix = zombiePct === null ? "" : ` · ${zombiePct}%`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Customers"
        value={stats?.total_customers}
        loading={isPending}
        icon={<Users className="h-4 w-4" />}
        subValue={
          stats ? { current: stats.customers_current_30d, label: "in last 30d" } : undefined
        }
        trend={
          stats
            ? {
                current: stats.customers_current_30d,
                previous: stats.customers_prior_30d,
              }
            : undefined
        }
        info="Every customer ever enrolled with this business. The 30d line shows enrollments in the last 30 days; the trend compares that against the prior 30 days."
      />
      <StatCard
        label="Total Scans"
        value={stats?.total_scans}
        loading={isPending}
        icon={<CircleDot className="h-4 w-4" />}
        subValue={
          stats ? { current: stats.scans_current_30d, label: "in last 30d" } : undefined
        }
        trend={
          stats
            ? {
                current: stats.scans_current_30d,
                previous: stats.scans_prior_30d,
              }
            : undefined
        }
        info="Every scan (stamp_added or points_earned transaction) for this business. The 30d line and trend (last 30 days vs prior 30) are the primary gauge of real usage."
      />
      <StatCard
        label="Total Rewards"
        value={stats?.total_rewards}
        loading={isPending}
        icon={<Gift className="h-4 w-4" />}
        info="Lifetime reward_redeemed transactions. Shows how many loyalty loops this business has actually closed."
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
            <p className="font-medium text-foreground">
              Enrolled but never scanned
            </p>
            <p className="mt-1 text-muted-foreground">
              Customers of this business with zero{" "}
              <span className="font-medium">scans</span> ever.
              Signals onboarding friction (e.g. customers who installed the pass
              but never returned to earn anything).{" "}
              <span className="font-medium">Lower is better.</span>
            </p>
          </>
        }
      />
    </div>
  );
}
