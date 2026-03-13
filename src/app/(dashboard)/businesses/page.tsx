"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  fetchBusinesses,
  activateBusiness,
  suspendBusiness,
  type Business,
} from "@/lib/api";
import { BusinessInitials, PlanBadge, StatusBadge } from "@/components/business-utils";
import { Loader2, Search } from "lucide-react";

type StatusFilter = "all" | "pending" | "active" | "suspended";
type TierFilter = "all" | "pay" | "pro";

export default function BusinessesPage() {
  return (
    <Suspense>
      <BusinessesContent />
    </Suspense>
  );
}

function BusinessesContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as StatusFilter) || "all";

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  const loadData = useCallback(async () => {
    try {
      const data = await fetchBusinesses();
      setBusinesses(data);
    } catch (err) {
      toast.error("Failed to load businesses", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActivate = async (id: string) => {
    setActing(id);
    try {
      await activateBusiness(id);
      toast.success("Business activated");
      await loadData();
    } catch (err) {
      toast.error("Failed to activate", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActing(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActing(id);
    try {
      await suspendBusiness(id);
      toast.success("Business suspended");
      await loadData();
    } catch (err) {
      toast.error("Failed to suspend", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActing(null);
    }
  };

  const filtered = useMemo(() => {
    let result = businesses;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== "all") {
      result = result.filter((b) => b.subscription_tier === tierFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.owner_email?.toLowerCase().includes(q) ||
          b.owner_name?.toLowerCase().includes(q) ||
          b.url_slug.toLowerCase().includes(q)
      );
    }

    // Sort: pending first, then by created_at desc
    result.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [businesses, statusFilter, tierFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusCounts = {
    all: businesses.length,
    pending: businesses.filter((b) => b.status === "pending").length,
    active: businesses.filter((b) => b.status === "active").length,
    suspended: businesses.filter((b) => b.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground">
          {businesses.length} business{businesses.length !== 1 && "es"} on the
          platform.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {(["all", "pending", "active", "suspended"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s}
              {statusCounts[s] > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  {statusCounts[s]}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex gap-1">
          {(["all", "pay", "pro"] as const).map((t) => (
            <Button
              key={t}
              variant={tierFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTierFilter(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No businesses match your filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((biz) => (
                  <TableRow
                    key={biz.id}
                    className={
                      biz.status === "pending" ? "bg-amber-50/50" : undefined
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {biz.logo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={biz.logo_url}
                            alt={biz.name}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <BusinessInitials
                            name={biz.name}
                            color={biz.settings?.accentColor}
                          />
                        )}
                        <div>
                          <Link
                            href={`/businesses/${biz.id}`}
                            className="font-medium hover:underline"
                          >
                            {biz.name}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">
                            /{biz.url_slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {biz.owner_name && (
                          <div className="font-medium">{biz.owner_name}</div>
                        )}
                        {biz.owner_email && (
                          <div className="text-xs text-muted-foreground">
                            {biz.owner_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {biz.settings?.category || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={biz.status} />
                    </TableCell>
                    <TableCell>
                      <PlanBadge tier={biz.subscription_tier} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {biz.status === "active" && biz.activated_at
                        ? new Date(biz.activated_at).toLocaleDateString()
                        : new Date(biz.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {biz.status === "active" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              disabled={acting === biz.id}
                            >
                              Suspend
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Suspend business?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will suspend &quot;{biz.name}&quot;. They
                                will no longer be able to stamp customers or
                                manage their account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleSuspend(biz.id)}
                              >
                                Suspend
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : biz.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={acting === biz.id}
                            onClick={() => handleActivate(biz.id)}
                          >
                            {acting === biz.id && (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            )}
                            Accept
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={acting === biz.id}
                              >
                                Deny
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Deny application?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will suspend &quot;{biz.name}&quot;. The
                                  owner will not be able to use the platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleSuspend(biz.id)}
                                >
                                  Deny
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-200 text-green-600 hover:bg-green-50"
                          disabled={acting === biz.id}
                          onClick={() => handleActivate(biz.id)}
                        >
                          {acting === biz.id && (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          )}
                          Reactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
