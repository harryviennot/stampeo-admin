"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  fetchBusinessDetail,
  type BusinessActivityFilter,
  type BusinessListParams,
  type BusinessSortBy,
  type BusinessSortDir,
} from "@/lib/api";
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
import { useHeardFromStats, useOnboardingBreakdowns } from "@/hooks/use-stats";
import { adminKeys } from "@/lib/query-keys";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Filter as FilterIcon,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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

type StatusFilter = "all" | "active" | "suspended";
type BillingFilter =
  | "all"
  | "pending_checkout"
  | "trial"
  | "active"
  | "grace"
  | "past_due"
  | "cancelled"
  | "suspended";
type FoundingFilter = "all" | "yes" | "no";
type ResellerFilter = "all" | "yes" | "no";
type CardUpfrontFilter = "all" | "yes" | "no";
type ActivityFilter = "all" | BusinessActivityFilter;
type TrialEndingFilter = "all" | "7" | "14" | "0";

interface FilterState {
  status: StatusFilter;
  tier: TierFilter;
  billing: BillingFilter;
  design: DesignFilter;
  founding: FoundingFilter;
  reseller: ResellerFilter;
  cardUpfront: CardUpfrontFilter;
  activity: ActivityFilter;
  trialEnding: TrialEndingFilter;
}

const DEFAULT_FILTERS: FilterState = {
  status: "all",
  tier: "all",
  billing: "all",
  design: "all",
  founding: "all",
  reseller: "all",
  cardUpfront: "all",
  activity: "all",
  trialEnding: "all",
};

interface SortOption {
  key: string;
  label: string;
  by: BusinessSortBy;
  dir: BusinessSortDir;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "newest",         label: "Newest first",            by: "created_at",       dir: "desc" },
  { key: "oldest",         label: "Oldest first",            by: "created_at",       dir: "asc"  },
  { key: "name_asc",       label: "Name A → Z",              by: "name",             dir: "asc"  },
  { key: "name_desc",      label: "Name Z → A",              by: "name",             dir: "desc" },
  { key: "customers_desc", label: "Most customers",          by: "customers_total",  dir: "desc" },
  { key: "stamps_desc",    label: "Most stamps (all-time)",  by: "stamps_total",     dir: "desc" },
  { key: "active_desc",    label: "Most recently active",    by: "last_activity_at", dir: "desc" },
  { key: "active_asc",     label: "Inactive longest",        by: "last_activity_at", dir: "asc"  },
  { key: "trial_asc",      label: "Trial ending soonest",    by: "trial_ends_at",    dir: "asc"  },
];

const DEFAULT_SORT_KEY = "newest";

const BILLING_LABELS: Record<BillingFilter, string> = {
  all: "All",
  pending_checkout: "Pending checkout",
  trial: "Trial",
  active: "Active",
  grace: "Grace",
  past_due: "Past due",
  cancelled: "Cancelled",
  suspended: "Suspended",
};

const ACTIVITY_LABELS: Record<ActivityFilter, string> = {
  all: "All",
  active_7d: "Active (7d)",
  active_30d: "Active (30d)",
  dormant_30d: "Dormant 30d+",
  zombie: "Zombie (no customers)",
};

const TRIAL_LABELS: Record<TrialEndingFilter, string> = {
  all: "All",
  "7": "Trial ends ≤ 7d",
  "14": "Trial ends ≤ 14d",
  "0": "Trial expired",
};

function countActiveFilters(f: FilterState): number {
  return (Object.keys(f) as (keyof FilterState)[]).reduce(
    (n, k) => (f[k] !== DEFAULT_FILTERS[k] ? n + 1 : n),
    0
  );
}

// ─── URL <-> state serialization ─────────────────────────────────
// Maps each filter key to a short query-string param. Keep this tight so the
// URL stays scannable when shared. Defaults are omitted from the URL.
const FILTER_TO_PARAM: Record<keyof FilterState, string> = {
  status: "status",
  tier: "tier",
  billing: "billing",
  design: "design",
  founding: "founding",
  reseller: "reseller",
  cardUpfront: "card",
  activity: "activity",
  trialEnding: "trial",
};

const SORT_PARAM = "sort";
const SEARCH_PARAM = "q";
const PAGE_PARAM = "page";

interface UrlState {
  filters: FilterState;
  sortKey: string;
  search: string;
  page: number;
}

function readUrlState(sp: URLSearchParams): UrlState {
  const filters: FilterState = { ...DEFAULT_FILTERS };
  (Object.keys(FILTER_TO_PARAM) as (keyof FilterState)[]).forEach((key) => {
    const raw = sp.get(FILTER_TO_PARAM[key]);
    if (raw) {
      // Trust the value — backend re-validates, and an invalid value just
      // means an empty result page until the user changes the filter.
      (filters[key] as string) = raw;
    }
  });
  const sortKey = sp.get(SORT_PARAM) ?? DEFAULT_SORT_KEY;
  const search = sp.get(SEARCH_PARAM) ?? "";
  const pageRaw = parseInt(sp.get(PAGE_PARAM) ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw - 1 : 0;
  return { filters, sortKey, search, page };
}

function buildUrlSearch(state: UrlState): string {
  const sp = new URLSearchParams();
  (Object.keys(FILTER_TO_PARAM) as (keyof FilterState)[]).forEach((key) => {
    const v = state.filters[key];
    if (v !== DEFAULT_FILTERS[key]) sp.set(FILTER_TO_PARAM[key], v);
  });
  if (state.sortKey !== DEFAULT_SORT_KEY) sp.set(SORT_PARAM, state.sortKey);
  if (state.search) sp.set(SEARCH_PARAM, state.search);
  if (state.page > 0) sp.set(PAGE_PARAM, String(state.page + 1));
  return sp.toString();
}

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: "Solo",
  small: "Small (2–5)",
  medium: "Medium (6–20)",
  large: "Large (20+)",
  "2-5": "2–5",
};

const LOCATIONS_LABELS: Record<string, string> = {
  one: "1 location",
  few: "2–5 locations",
  several: "6–20 locations",
  many: "20+ locations",
  "1": "1 location",
  "2-5": "2–5 locations",
};

const PRIMARY_GOAL_LABELS: Record<string, string> = {
  retention: "Retention",
  frequency: "Frequency",
  basket: "Bigger baskets",
  acquisition: "Acquisition",
  retain: "Retention",
};

const BREAKDOWN_PALETTE = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#0EA5E9",
];
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
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  // URL is the source of truth on mount. Subsequent state changes are pushed
  // back into the URL by the effect below, so the back/forward buttons and
  // shared links always restore the same view.
  const initial = readUrlState(
    new URLSearchParams(searchParams?.toString() ?? "")
  );

  const [search, setSearch] = useState(initial.search);
  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [sortKey, setSortKey] = useState<string>(initial.sortKey);
  const [page, setPage] = useState(initial.page);

  // Sync state -> URL via replace (so filter tweaks don't pollute browser
  // history). The mount render already matches the URL, so we skip the first
  // run to avoid a redundant router call.
  const hasMounted = useRef(false);
  useEffect(() => {
    const qs = buildUrlSearch({ filters, sortKey, search, page });
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const current = searchParams?.toString() ?? "";
    if (qs !== current) {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [filters, sortKey, search, page, pathname, router, searchParams]);

  const sort =
    SORT_OPTIONS.find((s) => s.key === sortKey) ?? SORT_OPTIONS[0];

  const params: BusinessListParams = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: search.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    tier: filters.tier === "all" ? undefined : filters.tier,
    billing_status: filters.billing === "all" ? undefined : filters.billing,
    has_active_design:
      filters.design === "all" ? undefined : filters.design === "active",
    is_founding_partner:
      filters.founding === "all" ? undefined : filters.founding === "yes",
    owner_is_reseller:
      filters.reseller === "all" ? undefined : filters.reseller === "yes",
    requires_card_upfront:
      filters.cardUpfront === "all" ? undefined : filters.cardUpfront === "yes",
    activity: filters.activity === "all" ? undefined : filters.activity,
    trial_ending_days:
      filters.trialEnding === "all" ? undefined : Number(filters.trialEnding),
    sort_by: sort.by,
    sort_dir: sort.dir,
  };

  const resetPageOnFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const { data, isPending, isPlaceholderData } = useBusinesses(params);
  const { data: heardFromStats } = useHeardFromStats();
  const { data: breakdowns } = useOnboardingBreakdowns();
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

      {/* Search + Filter/Sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-[220px] lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        <FilterMenu
          filters={filters}
          onChange={resetPageOnFilterChange}
          onClear={() => {
            setFilters(DEFAULT_FILTERS);
            setPage(0);
          }}
        />

        <SortMenu value={sortKey} onChange={setSortKey} />
      </div>

      {/* Onboarding survey snapshot — four pies across one row on wide screens. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heardFromStats && heardFromStats.length > 0 && (
          <BreakdownPie
            title="Where they heard about us"
            data={heardFromStats.map((s) => ({
              key: s.source,
              name: HEARD_FROM_LABELS[s.source] || s.source,
              value: s.count,
              fill: HEARD_FROM_COLORS[s.source] || "#6B7280",
            }))}
          />
        )}
        {breakdowns?.team_size && breakdowns.team_size.length > 0 && (
          <BreakdownPie
            title="Team size"
            data={breakdowns.team_size.map((b, i) => ({
              key: b.value,
              name: TEAM_SIZE_LABELS[b.value] || b.value,
              value: b.count,
              fill: BREAKDOWN_PALETTE[i % BREAKDOWN_PALETTE.length],
            }))}
          />
        )}
        {breakdowns?.locations_count &&
          breakdowns.locations_count.length > 0 && (
            <BreakdownPie
              title="Locations"
              data={breakdowns.locations_count.map((b, i) => ({
                key: b.value,
                name: LOCATIONS_LABELS[b.value] || b.value,
                value: b.count,
                fill: BREAKDOWN_PALETTE[i % BREAKDOWN_PALETTE.length],
              }))}
            />
          )}
        {breakdowns?.primary_goal && breakdowns.primary_goal.length > 0 && (
          <BreakdownPie
            title="Primary goal"
            data={breakdowns.primary_goal.map((b, i) => ({
              key: b.value,
              name: PRIMARY_GOAL_LABELS[b.value] || b.value,
              value: b.count,
              fill: BREAKDOWN_PALETTE[i % BREAKDOWN_PALETTE.length],
            }))}
          />
        )}
      </div>

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
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Stamps</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Joined</TableHead>
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
                      <TableCell>
                        <StatusBadge status={biz.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <BillingStatusBadge status={biz.billing_status} />
                          {biz.requires_card_upfront && (
                            <span
                              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700"
                              title="Hard-paywall cohort (card required up front)"
                            >
                              card
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanBadge tier={biz.subscription_tier} />
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {biz.customers_total ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {biz.stamps_total ?? 0}
                        {biz.stamps_7d ? (
                          <span className="ml-1 text-xs text-emerald-600">
                            +{biz.stamps_7d}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {biz.last_activity_at
                          ? new Date(biz.last_activity_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(biz.created_at).toLocaleString(
                          undefined,
                          DATE_TIME_OPTS
                        )}
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
                            Reactivate
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

interface BreakdownDatum {
  key: string;
  name: string;
  value: number;
  fill: string;
}

function BreakdownPie({
  title,
  data,
}: {
  title: string;
  data: BreakdownDatum[];
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, "Businesses"]} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconSize={8}
                formatter={(v) => (
                  <span className="text-muted-foreground">{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterMenuProps {
  filters: FilterState;
  onChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClear: () => void;
}

function FilterMenu({ filters, onChange, onClear }: FilterMenuProps) {
  const active = countActiveFilters(filters);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filter
          {active > 0 && (
            <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
              {active}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Filters</span>
          <button
            type="button"
            onClick={onClear}
            disabled={active === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-3">
          <FilterSection
            label="Status"
            value={filters.status}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
            onChange={(v) => onChange("status", v as StatusFilter)}
          />
          <FilterSection
            label="Plan"
            value={filters.tier}
            options={[
              { value: "all", label: "All" },
              { value: "starter", label: "Starter" },
              { value: "growth", label: "Growth" },
              { value: "pro", label: "Pro" },
            ]}
            onChange={(v) => onChange("tier", v as TierFilter)}
          />
          <FilterSection
            label="Billing"
            value={filters.billing}
            options={(
              [
                "all",
                "pending_checkout",
                "trial",
                "active",
                "grace",
                "past_due",
                "cancelled",
                "suspended",
              ] as BillingFilter[]
            ).map((v) => ({ value: v, label: BILLING_LABELS[v] }))}
            onChange={(v) => onChange("billing", v as BillingFilter)}
          />
          <FilterSection
            label="Activity"
            value={filters.activity}
            options={(
              [
                "all",
                "active_7d",
                "active_30d",
                "dormant_30d",
                "zombie",
              ] as ActivityFilter[]
            ).map((v) => ({ value: v, label: ACTIVITY_LABELS[v] }))}
            onChange={(v) => onChange("activity", v as ActivityFilter)}
          />
          <FilterSection
            label="Trial ending"
            value={filters.trialEnding}
            options={(
              ["all", "7", "14", "0"] as TrialEndingFilter[]
            ).map((v) => ({ value: v, label: TRIAL_LABELS[v] }))}
            onChange={(v) => onChange("trialEnding", v as TrialEndingFilter)}
          />
          <FilterSection
            label="Loyalty card"
            value={filters.design}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Has active design" },
              { value: "none", label: "No design" },
            ]}
            onChange={(v) => onChange("design", v as DesignFilter)}
          />
          <FilterSection
            label="Founding partner"
            value={filters.founding}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Founding only" },
              { value: "no", label: "Non-founding" },
            ]}
            onChange={(v) => onChange("founding", v as FoundingFilter)}
          />
          <FilterSection
            label="Owner is reseller"
            value={filters.reseller}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Reseller-owned" },
              { value: "no", label: "Not reseller" },
            ]}
            onChange={(v) => onChange("reseller", v as ResellerFilter)}
          />
          <FilterSection
            label="Card upfront"
            value={filters.cardUpfront}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Card upfront" },
              { value: "no", label: "Legacy (no card)" },
            ]}
            onChange={(v) => onChange("cardUpfront", v as CardUpfrontFilter)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterSection<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs transition-colors",
              value === opt.value
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-background hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SortMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const current = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-muted-foreground">Sort:</span>
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1">
        <ul>
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.key}>
              <button
                type="button"
                onClick={() => onChange(opt.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                  opt.key === value
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/60"
                )}
              >
                <span>{opt.label}</span>
                {opt.key === value && <Check className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
