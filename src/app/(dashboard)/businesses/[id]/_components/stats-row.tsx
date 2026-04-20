"use client";

import { CircleDot, Gift, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useBusinessStats } from "@/hooks/use-businesses";

export function StatsRow({ businessId }: { businessId: string }) {
  const { data: stats, isPending } = useBusinessStats(businessId);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Total Customers"
        value={stats?.total_customers}
        loading={isPending}
        icon={<Users className="h-4 w-4" />}
        trend={
          stats
            ? {
                current: stats.customers_this_month,
                previous: stats.customers_last_month,
              }
            : undefined
        }
      />
      <StatCard
        label="Total Stamps"
        value={stats?.total_stamps}
        loading={isPending}
        icon={<CircleDot className="h-4 w-4" />}
        trend={
          stats
            ? {
                current: stats.stamps_this_month,
                previous: stats.stamps_last_month,
              }
            : undefined
        }
      />
      <StatCard
        label="Total Rewards"
        value={stats?.total_rewards}
        loading={isPending}
        icon={<Gift className="h-4 w-4" />}
      />
    </div>
  );
}
