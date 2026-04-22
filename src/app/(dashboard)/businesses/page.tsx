"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
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
import { fetchBusinessDetail, type BusinessListParams } from "@/lib/api";
import {
  BusinessInitials,
  BillingStatusBadge,
  PlanBadge,
  ResellerBadge,
  StatusBadge,
} from "@/components/business-utils";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import {
  useActivateBusiness,
  useBusinesses,
  useSuspendBusiness,
} from "@/hooks/use-businesses";
import { useHeardFromStats } from "@/hooks/use-stats";
import { adminKeys } from "@/lib/query-keys";
import { Loader2, Search, Inbox } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const HEARD_FROM_LABELS: Record<string, string> = {
  google: "Google / Search",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  article: "Article / Blog",
  friend: "Friend / Colleague",
  business: "A Stampeo business",
  other: "Other",
};

const HEARD_FROM_COLORS: Record<string, string> = {
  google: "#4285F4",
  instagram: "#E1306C",
  tiktok: "#010101",
  linkedin: "#0A66C2",
  article: "#F59E0B",
  friend: "#10B981",
  business: "#8B5CF6",
  other: "#6B7280",
};

type StatusFilter = "all" | "pending" | "active" | "suspended";
type TierFilter = "all" | "starter" | "growth" | "pro";
type DesignFilter = "all" | "active" | "none";

const PAGE_SIZE = 25;

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

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
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [designFilter, setDesignFilter] = useState<DesignFilter>("all");
  const [page, setPage] = useState(0);

  const params: BusinessListParams = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    tier: tierFilter === "all" ? undefined : tierFilter,
    has_active_design:
      designFilter === "all" ? undefined : designFilter === "active",
  };

  const { data, isPending, isPlaceholderData } = useBusinesses(params);
  const { data: heardFromStats } = useHeardFromStats();
  const activate = useActivateBusiness();
  const suspend = useSuspendBusiness();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const resetPage = () => setPage(0);

  const handleActivate = (id: string, name: string) => {
    activate.mutate(id, {
      onSuccess: () => toast.success(`Activated ${name}`),
      onError: (err) =>
        toast.error("Failed to activate", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  const handleSuspend = (id: string, name: string) => {
    suspend.mutate(id, {
      onSuccess: () => toast.success(`Suspended ${name}`),
      onError: (err) =>
        toast.error("Failed to suspend", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  const prefetchDetail = (id: string) => {
    qc.prefetchQuery({
      queryKey: adminKeys.businesses.detail(id),
      queryFn: () => fetchBusinessDetail(id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground">
          {total} business{total !== 1 && "es"} on the platform.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="relative flex-1 min-w-[220px] lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {(["all", "pending", "active", "suspended"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(s);
                resetPage();
              }}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {(["all", "starter", "growth", "pro"] as const).map((t) => (
            <Button
              key={t}
              variant={tierFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTierFilter(t);
                resetPage();
              }}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              { key: "all", label: "Card: all" },
              { key: "active", label: "Card: active" },
              { key: "none", label: "Card: none" },
            ] as const
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={designFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDesignFilter(key);
                resetPage();
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Heard From Pie Chart */}
      {heardFromStats && heardFromStats.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-4">
              Where are businesses hearing about us?
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={heardFromStats.map((s) => ({
                      name: HEARD_FROM_LABELS[s.source] || s.source,
                      value: s.count,
                      source: s.source,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {heardFromStats.map((s) => (
                      <Cell
                        key={s.source}
                        fill={HEARD_FROM_COLORS[s.source] || "#6B7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Businesses"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No businesses match your filters"
              description="Try adjusting search or clearing filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((biz) => {
                  const busy =
                    (activate.isPending &&
                      activate.variables === biz.id) ||
                    (suspend.isPending && suspend.variables === biz.id);
                  return (
                    <TableRow key={biz.id}>
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
                              onMouseEnter={() => prefetchDetail(biz.id)}
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
                            <div className="flex items-center gap-1.5 font-medium">
                              {biz.owner_name}
                              {biz.owner_is_reseller && <ResellerBadge />}
                            </div>
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
                        <BillingStatusBadge status={biz.billing_status} />
                      </TableCell>
                      <TableCell>
                        <PlanBadge tier={biz.subscription_tier} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(
                          biz.status === "active" && biz.activated_at
                            ? biz.activated_at
                            : biz.created_at
                        ).toLocaleString(undefined, DATE_TIME_OPTS)}
                      </TableCell>
                      <TableCell>
                        {biz.status === "active" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={busy}
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
                                  onClick={() =>
                                    handleSuspend(biz.id, biz.name)
                                  }
                                >
                                  Suspend
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-600 hover:bg-green-50"
                            disabled={busy}
                            onClick={() => handleActivate(biz.id, biz.name)}
                          >
                            {busy && (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            )}
                            {biz.status === "pending"
                              ? "Approve"
                              : "Reactivate"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {items.length > 0 && (
            <div className="border-t">
              <DataTablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                isPlaceholder={isPlaceholderData}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
