"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FilterMenu,
  FilterSection,
  SortMenu,
} from "@/components/filter-menu";
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
  PricingRegimeBadge,
  ResellerBadge,
  StatusBadge,
} from "@/components/business-utils";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { useBusinesses } from "@/hooks/use-businesses";
import { BusinessRowActions } from "./_components/row-actions";
import { useHeardFromStats, useOnboardingBreakdowns } from "@/hooks/use-stats";
import { adminKeys } from "@/lib/query-keys";
import { GATE_REASON_LABELS, checkoutGateReason } from "@/lib/checkout-gate";
import { Inbox, Loader2, Search } from "lucide-react";
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
// Client-side: the Billing=pending_checkout filter over-selects, it also
// catches businesses still legitimately mid-wizard. This narrows to the ones
// the 402 gate is actually blocking right now.
type GatedFilter = "all" | "gated" | "open";

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
  gated: GatedFilter;
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
  gated: "all",
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
  { key: "scans_desc",     label: "Most scans (all-time)",   by: "scans_total",     dir: "desc" },
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

const GATED_LABELS: Record<GatedFilter, string> = {
  all: "All",
  gated: "Blocked by checkout gate",
  open: "Not blocked",
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
  gated: "gated",
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

  // Server-side filters do the paging; the gate verdict is derived client-side
  // (it depends on the customer count the RPC already returns), so it narrows
  // the current page rather than the whole result set.
  const allItems = data?.items ?? [];
  const items =
    filters.gated === "all"
      ? allItems
      : allItems.filter((biz) =>
          filters.gated === "gated"
            ? checkoutGateReason(biz) !== null
            : checkoutGateReason(biz) === null
        );
  const total = data?.total ?? 0;

  const resetPage = () => setPage(0);

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
          activeCount={countActiveFilters(filters)}
          onClear={() => {
            setFilters(DEFAULT_FILTERS);
            setPage(0);
          }}
        >
          <FilterSection
            label="Status"
            value={filters.status}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
            onChange={(v) => resetPageOnFilterChange("status", v as StatusFilter)}
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
            onChange={(v) => resetPageOnFilterChange("tier", v as TierFilter)}
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
            onChange={(v) => resetPageOnFilterChange("billing", v as BillingFilter)}
          />
          <FilterSection
            label="Checkout gate"
            value={filters.gated}
            options={(["all", "gated", "open"] as GatedFilter[]).map((v) => ({
              value: v,
              label: GATED_LABELS[v],
            }))}
            onChange={(v) => resetPageOnFilterChange("gated", v as GatedFilter)}
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
            onChange={(v) => resetPageOnFilterChange("activity", v as ActivityFilter)}
          />
          <FilterSection
            label="Trial ending"
            value={filters.trialEnding}
            options={(["all", "7", "14", "0"] as TrialEndingFilter[]).map((v) => ({
              value: v,
              label: TRIAL_LABELS[v],
            }))}
            onChange={(v) => resetPageOnFilterChange("trialEnding", v as TrialEndingFilter)}
          />
          <FilterSection
            label="Loyalty card"
            value={filters.design}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Has active design" },
              { value: "none", label: "No design" },
            ]}
            onChange={(v) => resetPageOnFilterChange("design", v as DesignFilter)}
          />
          <FilterSection
            label="Founding partner"
            value={filters.founding}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Founding only" },
              { value: "no", label: "Non-founding" },
            ]}
            onChange={(v) => resetPageOnFilterChange("founding", v as FoundingFilter)}
          />
          <FilterSection
            label="Owner is reseller"
            value={filters.reseller}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Reseller-owned" },
              { value: "no", label: "Not reseller" },
            ]}
            onChange={(v) => resetPageOnFilterChange("reseller", v as ResellerFilter)}
          />
          <FilterSection
            label="Card upfront"
            value={filters.cardUpfront}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Card required (default)" },
              { value: "no", label: "No-card (legacy / granted)" },
            ]}
            onChange={(v) => resetPageOnFilterChange("cardUpfront", v as CardUpfrontFilter)}
          />
        </FilterMenu>

        <SortMenu value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
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
                  <TableHead className="text-right">Scans</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((biz) => {
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
                            <div className="mt-0.5">
                              <PricingRegimeBadge
                                isFounding={!!biz.is_founding_partner}
                              />
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
                          {biz.requires_card_upfront === false && (
                            <span
                              className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700"
                              title="No-card exception (legacy or superadmin-granted no-card trial)"
                            >
                              no-card
                            </span>
                          )}
                          {(() => {
                            const reason = checkoutGateReason(biz);
                            return reason ? (
                              <span
                                className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700"
                                title={GATE_REASON_LABELS[reason]}
                              >
                                gated
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanBadge tier={biz.subscription_tier} />
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {biz.customers_total ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {biz.scans_total ?? 0}
                        {biz.scans_7d ? (
                          <span className="ml-1 text-xs text-emerald-600">
                            +{biz.scans_7d}
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
                        <div className="flex justify-end">
                          <BusinessRowActions business={biz} />
                        </div>
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

