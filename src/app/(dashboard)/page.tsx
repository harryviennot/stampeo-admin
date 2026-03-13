"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchGlobalStats, type GlobalStats } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import {
  Building2,
  Users,
  CircleDot,
  Clock,
  ShieldCheck,
  Gift,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchGlobalStats();
      setStats(data);
    } catch (err) {
      toast.error("Failed to load stats", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Businesses"
          value={stats?.total_businesses}
          loading={loading}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label="Total Customers"
          value={stats?.total_customers}
          loading={loading}
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
          loading={loading}
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
          label="Pending Applications"
          value={stats?.pending_businesses}
          loading={loading}
          icon={<Clock className="h-4 w-4" />}
          badgeClass={
            stats && stats.pending_businesses > 0
              ? "bg-amber-100 text-amber-700"
              : undefined
          }
        />
        <StatCard
          label="Certificates Available"
          value={stats?.certs_available}
          loading={loading}
          icon={<ShieldCheck className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Total Rewards"
          value={stats?.total_rewards_redeemed}
          loading={loading}
          icon={<Gift className="h-4 w-4" />}
        />
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pending alert */}
        {!loading && stats && stats.pending_businesses > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-amber-800">
                <Clock className="h-4 w-4" />
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 mb-3">
                {stats.pending_businesses} business
                {stats.pending_businesses !== 1 ? "es" : ""} waiting for
                approval.
              </p>
              <Link href="/businesses?status=pending">
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                  Review applications
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Business breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Business Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium">{stats?.active_businesses ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats?.pending_businesses ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-medium">{stats?.suspended_businesses ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-emerald-600">
                    {stats?.certs_available ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned</span>
                  <span className="font-medium text-blue-600">
                    {stats?.certs_assigned ?? 0}
                  </span>
                </div>
                <Link href="/certificates">
                  <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-0 text-muted-foreground">
                    Manage certificates
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
