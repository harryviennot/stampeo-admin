"use client";

/**
 * Every loyalty card on the platform, as a grid of real previews.
 *
 * The tiles render the SAME component the merchant dashboard uses
 * (components/card/WalletCard, a port of web's), fed by the same payload shape
 * as GET /designs/{id}/active — so what you see here is what the customer has
 * in their wallet, {{variables}} filled in and all.
 *
 * Structure mirrors (dashboard)/businesses/page.tsx: URL is the source of
 * truth, filters in a popover, React Query with keepPreviousData.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Loader2, Search, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FilterMenu,
  FilterSection,
  SortMenu,
  type SortOption,
} from "@/components/filter-menu";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { WalletCard } from "@/components/card/WalletCard";
import { ScaledCardWrapper } from "@/components/card/ScaledCardWrapper";
import {
  BillingStatusBadge,
  PlanBadge,
  StatusBadge,
} from "@/components/business-utils";
import { useCardDesigns } from "@/hooks/use-card-designs";
import { buildPreviewValues } from "@/lib/design-preview";
import type {
  AdminCardDesignItem,
  CardDesignListParams,
  CardDesignSortBy,
} from "@/lib/api";

const PAGE_SIZE = 24;

// ─── Filters ─────────────────────────────────────────────────────

type BillingFilter = "all" | "live" | "active" | "trial";
type ActiveFilter = "all" | "active" | "draft";
type CardTypeFilter = "all" | "stamp" | "points";
type OnboardingFilter = "all" | "yes" | "no";
type StatusFilter = "all" | "active" | "pending" | "suspended";
type TierFilter = "all" | "starter" | "growth" | "pro";

interface FilterState {
  billing: BillingFilter;
  active: ActiveFilter;
  cardType: CardTypeFilter;
  onboarding: OnboardingFilter;
  status: StatusFilter;
  tier: TierFilter;
}

/**
 * Billing defaults to "live" and active defaults to "active" on purpose: the
 * question this page answers is "what do the cards people actually carry look
 * like", not "what drafts exist". Both show as filter chips, so the narrowing
 * is visible rather than silent, and "All" is one click away.
 */
const DEFAULT_FILTERS: FilterState = {
  billing: "live",
  active: "active",
  cardType: "all",
  onboarding: "all",
  status: "all",
  tier: "all",
};

const BILLING_LABELS: Record<BillingFilter, string> = {
  all: "All",
  live: "Live (active + trial)",
  active: "Paying",
  trial: "Trialing",
};

function countActiveFilters(f: FilterState): number {
  return (Object.keys(f) as (keyof FilterState)[]).filter(
    (k) => f[k] !== DEFAULT_FILTERS[k]
  ).length;
}

// ─── Sorting ─────────────────────────────────────────────────────

interface DesignSortOption extends SortOption {
  by: CardDesignSortBy;
  dir: "asc" | "desc";
}

const SORT_OPTIONS: readonly DesignSortOption[] = [
  { key: "customers_desc", label: "Most customers", by: "customers_total", dir: "desc" },
  { key: "scans_desc", label: "Most scans (all time)", by: "scans_total", dir: "desc" },
  { key: "scans30_desc", label: "Most scans (30d)", by: "scans_30d", dir: "desc" },
  { key: "activity_desc", label: "Recently active", by: "last_activity_at", dir: "desc" },
  { key: "updated_desc", label: "Recently updated", by: "design_updated_at", dir: "desc" },
  { key: "created_desc", label: "Newest design", by: "design_created_at", dir: "desc" },
  { key: "created_asc", label: "Oldest design", by: "design_created_at", dir: "asc" },
  { key: "name_asc", label: "Business name (A–Z)", by: "business_name", dir: "asc" },
];

const DEFAULT_SORT_KEY = "customers_desc";

// ─── URL <-> state ───────────────────────────────────────────────

const FILTER_TO_PARAM: Record<keyof FilterState, string> = {
  billing: "billing",
  active: "active",
  cardType: "type",
  onboarding: "onboarding",
  status: "status",
  tier: "tier",
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
    // Trust the value — the backend re-validates, and a bad one just means an
    // empty page until the user changes the filter.
    if (raw) (filters[key] as string) = raw;
  });
  const pageRaw = parseInt(sp.get(PAGE_PARAM) ?? "1", 10);
  return {
    filters,
    sortKey: sp.get(SORT_PARAM) ?? DEFAULT_SORT_KEY,
    search: sp.get(SEARCH_PARAM) ?? "",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw - 1 : 0,
  };
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

// ─── Page ────────────────────────────────────────────────────────

export default function CardDesignsPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CardDesignsContent />
    </Suspense>
  );
}

function CardDesignsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useRef(readUrlState(new URLSearchParams(searchParams.toString())));
  const [filters, setFilters] = useState<FilterState>(initial.current.filters);
  const [sortKey, setSortKey] = useState(initial.current.sortKey);
  const [search, setSearch] = useState(initial.current.search);
  const [page, setPage] = useState(initial.current.page);

  // Skip the first run so we don't rewrite the URL the user just arrived on.
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const qs = buildUrlSearch({ filters, sortKey, search, page });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters, sortKey, search, page, pathname, router]);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const sort = SORT_OPTIONS.find((o) => o.key === sortKey) ?? SORT_OPTIONS[0];

  const params: CardDesignListParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: search.trim() || undefined,
      is_active:
        filters.active === "all" ? undefined : filters.active === "active",
      card_type: filters.cardType === "all" ? undefined : filters.cardType,
      status: filters.status === "all" ? undefined : filters.status,
      billing: filters.billing === "all" ? undefined : filters.billing,
      onboarding_finished:
        filters.onboarding === "all" ? undefined : filters.onboarding === "yes",
      tier: filters.tier === "all" ? undefined : filters.tier,
      sort_by: sort.by,
      sort_dir: sort.dir,
    }),
    [page, search, filters, sort]
  );

  const { data, isPending, isPlaceholderData, error } = useCardDesigns(params);
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Card Designs</h1>
        <p className="text-sm text-muted-foreground">
          Every loyalty card on Stampeo, rendered exactly as customers see it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search business, slug or design name…"
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
            label="Billing"
            value={filters.billing}
            options={(["all", "live", "active", "trial"] as BillingFilter[]).map(
              (v) => ({ value: v, label: BILLING_LABELS[v] })
            )}
            onChange={(v) => setFilter("billing", v)}
          />
          <FilterSection
            label="Design"
            value={filters.active}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Live card only" },
              { value: "draft", label: "Drafts only" },
            ]}
            onChange={(v) => setFilter("active", v as ActiveFilter)}
          />
          <FilterSection
            label="Program type"
            value={filters.cardType}
            options={[
              { value: "all", label: "All" },
              { value: "stamp", label: "Stamps" },
              { value: "points", label: "Points" },
            ]}
            onChange={(v) => setFilter("cardType", v as CardTypeFilter)}
          />
          <FilterSection
            label="Onboarding"
            value={filters.onboarding}
            options={[
              { value: "all", label: "All" },
              { value: "yes", label: "Finished" },
              { value: "no", label: "Not finished" },
            ]}
            onChange={(v) => setFilter("onboarding", v as OnboardingFilter)}
          />
          <FilterSection
            label="Business status"
            value={filters.status}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "suspended", label: "Suspended" },
            ]}
            onChange={(v) => setFilter("status", v as StatusFilter)}
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
            onChange={(v) => setFilter("tier", v as TierFilter)}
          />
        </FilterMenu>

        <SortMenu value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Could not load card designs. {String(error)}
          </CardContent>
        </Card>
      ) : isPending ? (
        <GridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No card designs match"
          description="Try widening the billing or design filter."
        />
      ) : (
        <>
          <div
            className={
              isPlaceholderData
                ? "grid grid-cols-1 gap-5 opacity-60 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {items.map((item) => (
              <DesignTile
                key={item.design?.id ?? `${item.business.id}-broken`}
                item={item}
              />
            ))}
          </div>

          <DataTablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
            isPlaceholder={isPlaceholderData}
          />
        </>
      )}
    </div>
  );
}

// ─── Tile ────────────────────────────────────────────────────────

function DesignTile({ item }: { item: AdminCardDesignItem }) {
  const { design, business } = item;
  const { values, locale } = buildPreviewValues(item);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        {/* The wallet card brings its own rounding and shadow, so it sits
            directly on the tile — an extra tinted panel here just reads as a
            third nested card. */}
        {design ? (
          <ScaledCardWrapper baseWidth={280} aspectRatio={1.282} minScale={0.5}>
            <WalletCard
              design={design}
              showQR={false}
              variableValues={values}
              locale={locale}
            />
          </ScaledCardWrapper>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            <p className="text-xs text-muted-foreground">
              This design could not be rendered
            </p>
            {item.render_error && (
              <p className="max-w-full truncate font-mono text-[10px] text-muted-foreground">
                {item.render_error}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/businesses/${business.id}`}
              className="truncate text-sm font-semibold hover:underline"
              title={business.name}
            >
              {business.name}
            </Link>
            {design && !design.is_active && (
              <span className="shrink-0 rounded-md border border-input px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Draft
              </span>
            )}
          </div>
          <p
            className="truncate text-xs text-muted-foreground"
            title={design?.name}
          >
            {design?.name ?? "—"}
            {design?.card_type === "points" ? " · Points" : " · Stamps"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <StatusBadge status={business.status ?? ""} />
          <BillingStatusBadge status={business.billing_status ?? undefined} />
          <PlanBadge tier={business.subscription_tier ?? ""} />
        </div>

        {/* Per-BUSINESS counts — a scan carries no design attribution, so two
            designs on one business report the same numbers. */}
        <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">
              {item.customers_total.toLocaleString()}
            </span>{" "}
            customers
          </span>
          <span>
            <span className="font-medium text-foreground">
              {item.scans_30d.toLocaleString()}
            </span>{" "}
            scans / 30d
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex h-[340px] items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
