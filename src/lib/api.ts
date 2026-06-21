import { createClient } from "@/utils/supabase/client";
import { CardDesign } from "@/types/design";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
  };
}

async function getAuthHeadersForFormData(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
  };
}

export interface PoolStats {
  total: number;
  available: number;
  assigned: number;
  revoked: number;
}

export interface PassTypeId {
  id: string;
  identifier: string;
  team_id: string;
  status: "available" | "assigned" | "revoked";
  business_id: string | null;
  business_name: string | null;
  assigned_at: string | null;
  created_at: string;
}

export type BusinessInfoEntryType =
  | "phone"
  | "website"
  | "email"
  | "address"
  | "hours"
  | "custom";

export interface BusinessInfoEntry {
  type: BusinessInfoEntryType;
  key?: string;
  label?: string;
  data: Record<string, unknown>;
}

export interface Business {
  id: string;
  name: string;
  url_slug: string;
  status: "active" | "suspended";
  subscription_tier: string;
  logo_url: string | null;
  settings: {
    category?: string;
    description?: string;
    owner_name?: string;
    accentColor?: string;
    backgroundColor?: string;
    [key: string]: unknown;
  };
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_is_reseller: boolean;
  // Best-effort country (primary location address, else owner phone prefix).
  // country_code is ISO-2; the UI derives flag + name from it.
  country?: string | null;
  country_code?: string | null;
  country_source?: "location" | "phone" | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  // Billing (from migration 48; pending_checkout from migration 87)
  billing_status?:
    | "pending_checkout"
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "grace"
    | "suspended";
  is_founding_partner?: boolean;
  trial_ends_at?: string | null;
  grace_ends_at?: string | null;
  // Hard-paywall cohort flag (migration 86)
  requires_card_upfront?: boolean;
  // Onboarding survey + business contact (sourced from businesses.settings since migration 78)
  identity_website?: string | null;
  business_info?: BusinessInfoEntry[];
  heard_from?: string | null;
  heard_from_other?: string | null;
  team_size?: string | null;
  locations_count?: string | null;
  primary_goal?: string | null;
  has_active_design?: boolean;
  // Post-signup setup-wizard progress (settings.setup_progress)
  setup_progress?: SetupProgress | null;
  // Per-row aggregates returned by the enriched-businesses RPC
  stamps_total?: number;
  stamps_30d?: number;
  stamps_7d?: number;
  customers_total?: number;
  last_activity_at?: string | null;
}

export type BusinessSortBy =
  | "created_at"
  | "activated_at"
  | "name"
  | "stamps_total"
  | "customers_total"
  | "last_activity_at"
  | "trial_ends_at";

export type BusinessSortDir = "asc" | "desc";

export type BusinessActivityFilter =
  | "active_7d"
  | "active_30d"
  | "dormant_30d"
  | "zombie";

export interface SetupProgressStep {
  chapter: string;
  step: string;
}

export interface SetupProgress {
  started_at: string | null;
  completed_at: string | null;
  last_step: SetupProgressStep | null;
  completed: SetupProgressStep[];
  skipped: SetupProgressStep[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface BusinessListParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "active" | "suspended";
  tier?: "starter" | "growth" | "pro";
  billing_status?:
    | "pending_checkout"
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "grace"
    | "suspended";
  has_active_design?: boolean;
  is_founding_partner?: boolean;
  owner_is_reseller?: boolean;
  requires_card_upfront?: boolean;
  category?: string;
  activity?: BusinessActivityFilter;
  trial_ending_days?: number;
  sort_by?: BusinessSortBy;
  sort_dir?: BusinessSortDir;
}

export interface UserListParams {
  limit?: number;
  offset?: number;
  search?: string;
  role?: "owner" | "admin" | "scanner" | "reseller";
}

export interface TimeseriesParams {
  bucket?: "day" | "week";
  range?: string; // e.g. "12w", "28d"
  business_id?: string;
}

export interface TimeseriesBucket {
  period_start: string;
  new_businesses: number;
  new_customers: number;
  stamps_added: number;
  redemptions: number;
}

export interface TimeseriesResponse {
  buckets: TimeseriesBucket[];
}

export interface BillingBreakdown {
  trial: number;
  active: number;
  grace: number;
  past_due: number;
  suspended: number;
  cancelled: number;
  founding_partner_count: number;
  grace_expiring_soon: Array<{
    business_id: string;
    name: string;
    grace_ends_at: string;
  }>;
}

export interface TopBusinessRow {
  business_id: string;
  name: string;
  tier: string;
  billing_status: string;
  stamps_current: number;
  stamps_prior: number;
  delta_pct: number | null;
  last_activity_at: string | null;
}

export interface TopBusinessesResponse {
  items: TopBusinessRow[];
}

export interface TopBusinessAllTimeRow {
  business_id: string;
  name: string;
  tier: string;
  billing_status: string;
  stamps_total: number;
  customers_total: number;
  last_activity_at: string | null;
}

export interface TopBusinessesAllTimeResponse {
  items: TopBusinessAllTimeRow[];
}

export interface CustomerSignupsByBusiness {
  top_businesses: Array<{
    business_id: string;
    name: string;
    total: number;
  }>;
  buckets: Array<{
    period_start: string;
    values: Record<string, number>;
  }>;
}

export interface HeardFromStat {
  source: string;
  count: number;
}

export interface UserMembership {
  user_id: string;
  business_id: string;
  role: string;
  businesses: {
    id: string;
    name: string;
    url_slug: string;
    status: string;
    logo_url: string | null;
  } | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  locale: string;
  is_reseller: boolean;
  reseller_granted_at: string | null;
  created_at: string;
  updated_at: string;
  memberships: UserMembership[];
  businesses_count: number;
  roles: string[];
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  locale: string;
  is_reseller: boolean;
  reseller_granted_at: string | null;
  reseller_discount_percent: number | null;
  created_at: string;
  updated_at: string;
  memberships: Array<{
    id: string;
    user_id: string;
    business_id: string;
    role: string;
    created_at: string;
    businesses: Business | null;
  }>;
}

export interface BusinessMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  created_at: string;
  last_active_at: string | null;
  scans_count: number | null;
  users: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    is_reseller: boolean;
  } | null;
}

export interface GlobalStats {
  total_businesses: number;
  active_businesses: number;
  pending_businesses: number;
  suspended_businesses: number;
  total_customers: number;
  customers_current_30d: number;
  customers_prior_30d: number;
  total_stamps: number;
  stamps_current_30d: number;
  stamps_prior_30d: number;
  total_rewards_redeemed: number;
  rewards_current_30d: number;
  rewards_prior_30d: number;
  certs_available: number;
  certs_assigned: number;
  certs_reclaimable: number;
  certs_reclaim_candidates: number;
}

export type ReclaimSegment = "A" | "B1" | "B2";

export interface CertReclaimView {
  is_candidate: boolean;
  billing_status: string | null;
  segment: ReclaimSegment | null;
  ever_paid: boolean;
  anchor_date: string | null;
  days_since: number | null;
  release_date: string | null;
  days_until_release: number | null;
  warnings_sent: string[];
  eligible_now: boolean;
}

export interface ReclaimCandidate {
  pass_type_id: string;
  identifier: string;
  business_id: string;
  business_name: string | null;
  segment: ReclaimSegment;
  ever_had_customers: boolean;
  ever_paid: boolean;
  anchor_date: string;
  days_since: number;
  release_date: string;
  days_until_release: number;
  warnings_sent: string[];
  eligible_now: boolean;
  auto_release: boolean;
}

export interface BusinessStats {
  total_customers: number;
  customers_current_30d: number;
  customers_prior_30d: number;
  total_stamps: number;
  stamps_current_30d: number;
  stamps_prior_30d: number;
  total_rewards: number;
  active_design: CardDesign | null;
  certificate: {
    id: string;
    identifier: string;
    status: string;
    previous_business_id?: string | null;
    released_at?: string | null;
  } | null;
  reclaim: CertReclaimView;
}

export async function fetchGlobalStats(): Promise<GlobalStats> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBusinessStats(
  businessId: string
): Promise<BusinessStats> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/businesses/${businessId}/stats`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPoolStats(): Promise<PoolStats> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/pass-type-ids/pool`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPassTypeIds(): Promise<PassTypeId[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/pass-type-ids/`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadCertificate(
  formData: FormData
): Promise<{ id: string; identifier: string; status: string }> {
  const headers = await getAuthHeadersForFormData();
  const res = await fetch(`${API_BASE_URL}/pass-type-ids/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchHeardFromStats(): Promise<HeardFromStat[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/heard-from-stats`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface SetupWizardFunnelStep {
  chapter: string;
  step: string;
  reached: number;
}

export interface SetupWizardStuckStep {
  chapter: string;
  step: string;
  count: number;
}

export interface SetupWizardFunnelResponse {
  started: number;
  completed: number;
  // Card-upfront cohort: businesses requiring a card upfront, and how many of
  // them attached one (have a Stripe subscription). Drives the terminal bar.
  card_upfront_started: number;
  card_attached: number;
  steps: SetupWizardFunnelStep[];
  // In-progress businesses bucketed by where their last_step is parked.
  stuck: SetupWizardStuckStep[];
}

export async function fetchSetupWizardFunnel(
  params: RangeParams = {}
): Promise<SetupWizardFunnelResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/setup-wizard-funnel${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface OnboardingBreakdownBucket {
  value: string;
  count: number;
}

export interface OnboardingBreakdownsResponse {
  team_size: OnboardingBreakdownBucket[];
  locations_count: OnboardingBreakdownBucket[];
  primary_goal: OnboardingBreakdownBucket[];
}

export async function fetchOnboardingBreakdowns(): Promise<OnboardingBreakdownsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/stats/onboarding-breakdowns`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function buildQuery(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function fetchBusinesses(
  params: BusinessListParams = {}
): Promise<Paginated<Business>> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}/admin/businesses${qs}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function activateBusiness(id: string): Promise<Business> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/businesses/${id}/activate`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function suspendBusiness(id: string): Promise<Business> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/businesses/${id}/suspend`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteBusiness(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/businesses/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function revokePassTypeId(
  id: string
): Promise<{ id: string; identifier: string; status: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/pass-type-ids/${id}/revoke`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchReclaimCandidates(): Promise<ReclaimCandidate[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/pass-type-ids/reclaim-candidates`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function releasePassTypeId(
  id: string
): Promise<{ id: string; identifier: string; status: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/pass-type-ids/${id}/release`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchUsers(
  params: UserListParams = {}
): Promise<Paginated<AdminUser>> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}/admin/users${qs}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTimeseries(
  params: TimeseriesParams = {}
): Promise<TimeseriesResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}/admin/stats/timeseries${qs}`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBillingBreakdown(): Promise<BillingBreakdown> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/stats/billing`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface RevenueTrialBreakdownRow {
  tier: string;
  is_founding: boolean;
  count: number;
  unit_amount: number;
  subtotal: number;
}

export interface MissingPriceBusiness {
  id: string;
  name: string;
  tier: string;
  is_founding: boolean;
  has_price_id: boolean;
}

export interface RevenueSnapshot {
  currency: string;
  this_month_start: string;
  last_month_start: string;
  next_month_start: string;
  active_count: number;
  actives_missing_price: number;
  missing_price_businesses: MissingPriceBusiness[];
  price_lookup_error: boolean;
  active_mrr: number;
  active_breakdown: RevenueTrialBreakdownRow[];
  converting_trial_count: number;
  converting_trial_mrr: number;
  next_month_mrr: number;
  last_month_revenue: number;
  last_month_invoice_count: number;
  stripe_error: string | null;
}

export async function fetchRevenueSnapshot(): Promise<RevenueSnapshot> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/stats/revenue`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTopBusinesses(
  limit: number = 10
): Promise<TopBusinessesResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/top-businesses?limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTopBusinessesAllTime(
  limit: number = 10
): Promise<TopBusinessesAllTimeResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/top-businesses-all-time?limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CustomerSignupsByBizParams {
  bucket?: "day" | "week";
  range?: string;
  top_n?: number;
}

export async function fetchCustomerSignupsByBusiness(
  params: CustomerSignupsByBizParams = {}
): Promise<CustomerSignupsByBusiness> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/customer-signups-by-business${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CustomerSignupsTopPerBucketSlot {
  rank: number;
  business_id: string;
  name: string;
  count: number;
}

export interface CustomerSignupsTopPerBucket {
  buckets: Array<{
    period_start: string;
    slots: CustomerSignupsTopPerBucketSlot[];
    other: number;
    total: number;
  }>;
}

export async function fetchCustomerSignupsTopPerBucket(
  params: CustomerSignupsByBizParams = {}
): Promise<CustomerSignupsTopPerBucket> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/customer-signups-top-per-bucket${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Stats: new analytics endpoints ─────────────────────────────

export interface RangeParams {
  range?: string; // e.g. "30d", "90d", "12w"
}

export interface BucketRangeParams {
  bucket?: "day" | "week";
  range?: string;
}

export interface OnboardingFunnelStep {
  step: number;
  reached: number;
}

export interface OnboardingFunnelResponse {
  steps: OnboardingFunnelStep[];
  completed: number;
  abandoned: number;
}

export async function fetchOnboardingFunnel(
  params: RangeParams = {}
): Promise<OnboardingFunnelResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/onboarding-funnel${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface ActivationFunnelResponse {
  created: number;
  has_active_design: number;
  has_first_customer: number;
  has_first_stamp: number;
}

export async function fetchActivationFunnel(
  params: RangeParams = {}
): Promise<ActivationFunnelResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/activation-funnel${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface InactiveSnapshotResponse {
  zombie_customers: number;
  ghost_businesses_7d: number;
  ghost_businesses_30d: number;
  total_customers: number;
  total_businesses: number;
}

export async function fetchInactiveSnapshot(): Promise<InactiveSnapshotResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/inactive-snapshot`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface PassLifecycleBucket {
  period_start: string;
  card_added: number;
  card_deleted: number;
  card_re_added: number;
}

export interface PassLifecycleResponse {
  buckets: PassLifecycleBucket[];
}

export async function fetchPassLifecycle(
  params: BucketRangeParams = {}
): Promise<PassLifecycleResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/pass-lifecycle${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBusinessPassLifecycle(
  businessId: string,
  params: BucketRangeParams = {}
): Promise<PassLifecycleResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/businesses/${businessId}/stats/pass-lifecycle${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface BusinessInactiveSnapshotResponse {
  zombie_customers: number;
  total_customers: number;
}

export async function fetchBusinessInactiveSnapshot(
  businessId: string
): Promise<BusinessInactiveSnapshotResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/businesses/${businessId}/stats/inactive-snapshot`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface TrialCohortRow {
  cohort_week: string;
  cohort_size: number;
  converted_w1: number;
  converted_w2: number;
  converted_w4: number;
  converted_w8: number;
}

export interface TrialCohortsResponse {
  cohorts: TrialCohortRow[];
}

export async function fetchTrialCohorts(
  weeks: number = 12
): Promise<TrialCohortsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/trial-cohorts?weeks=${weeks}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface BroadcastDeliverabilityBucket {
  period_start: string;
  total: number;
  reachable: number;
  apple_ok: number;
  apple_fail: number;
  google_ok: number;
  google_fail: number;
  google_not_inst: number;
  google_throttled: number;
  skipped_no_push: number;
}

export interface BroadcastDeliverabilityResponse {
  buckets: BroadcastDeliverabilityBucket[];
}

export async function fetchBroadcastDeliverability(
  params: BucketRangeParams = {}
): Promise<BroadcastDeliverabilityResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/broadcast-deliverability${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface StampHeatmapCell {
  dow: number;
  hour: number;
  stamps: number;
}

export interface StampHeatmapResponse {
  cells: StampHeatmapCell[];
}

export async function fetchStampHeatmap(
  params: RangeParams = {}
): Promise<StampHeatmapResponse> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/stamp-heatmap${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface DensityRow {
  business_id: string;
  name: string;
  tier: string;
  stamps_7d: number;
  customers_total: number;
  stamps_per_customer: number;
  last_activity_at: string | null;
}

export interface TopBusinessesDensityResponse {
  items: DensityRow[];
}

export async function fetchTopBusinessesDensity(
  limit: number = 10
): Promise<TopBusinessesDensityResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/top-businesses-density?limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Analytics: platform health, retention, paywall, leaderboards ───

export interface PlatformHealth {
  active_biz_7d: number;
  active_biz_30d: number;
  stickiness: number | null;
  qualified_biz: number;
  qualified_active_biz: number;
  median_cust_active: number | null;
  repeat_cust_rate: number | null;
  median_days_first_stamp: number | null;
}

export async function fetchPlatformHealth(): Promise<PlatformHealth> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/stats/platform-health`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface BusinessRetentionCohortRow {
  cohort_week: string;
  cohort_size: number;
  retained_d7: number | null;
  retained_d14: number | null;
  retained_d30: number | null;
  retained_d60: number | null;
  retained_d90: number | null;
  rate_d7: number | null;
  rate_d14: number | null;
  rate_d30: number | null;
  rate_d60: number | null;
  rate_d90: number | null;
}

export interface BusinessRetentionHeadline {
  cohort_week: string;
  cohort_size: number;
  rate_d60: number;
  gate: number;
  pass: boolean;
}

export interface BusinessRetentionResponse {
  cohorts: BusinessRetentionCohortRow[];
  headline: BusinessRetentionHeadline | null;
}

export async function fetchBusinessRetention(
  weeks: number = 16
): Promise<BusinessRetentionResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/business-retention?weeks=${weeks}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface PaywallFunnelGroup {
  requires_card: boolean;
  cohort_size: number;
  reached_checkout: number;
  trial_started: number;
  activated: number;
  paid: number;
}

export interface PaywallFunnelResponse {
  groups: PaywallFunnelGroup[];
}

export async function fetchPaywallFunnel(
  weeks: number = 12
): Promise<PaywallFunnelResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/paywall-funnel?weeks=${weeks}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface PaywallCohortRow {
  cohort_week: string;
  requires_card: boolean;
  cohort_size: number;
  converted_w1: number | null;
  converted_w2: number | null;
  converted_w4: number | null;
  converted_w8: number | null;
}

export interface PaywallCohortsResponse {
  cohorts: PaywallCohortRow[];
}

export async function fetchPaywallCohorts(
  weeks: number = 12
): Promise<PaywallCohortsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/paywall-cohorts?weeks=${weeks}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface RewardsLeaderboardRow {
  business_id: string;
  name: string;
  tier: string;
  billing_status: string;
  rewards: number;
  customers_total: number;
  last_activity_at: string | null;
}

export interface TopBusinessesRewardsResponse {
  items: RewardsLeaderboardRow[];
}

export async function fetchTopBusinessesRewards(
  limit: number = 10
): Promise<TopBusinessesRewardsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/top-businesses-rewards?limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface RepeatLeaderboardRow {
  business_id: string;
  name: string;
  tier: string;
  billing_status: string;
  repeat_rate: number;
  repeat_customers: number;
  customers_total: number;
  last_activity_at: string | null;
}

export interface TopBusinessesRepeatResponse {
  items: RepeatLeaderboardRow[];
}

export async function fetchTopBusinessesRepeat(
  limit: number = 10
): Promise<TopBusinessesRepeatResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/top-businesses-repeat?limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface HealthLeaderboardRow {
  business_id: string;
  name: string;
  tier: string;
  billing_status: string;
  customers_total: number;
  stamps_7d: number;
  rewards_7d: number;
  repeat_rate: number | null;
  n_vol: number;
  n_density: number;
  n_repeat: number;
  n_rewards: number;
  score: number;
  last_activity_at: string | null;
}

export interface TopBusinessesHealthResponse {
  items: HealthLeaderboardRow[];
}

export async function fetchTopBusinessesHealth(
  limit: number = 10
): Promise<TopBusinessesHealthResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/stats/top-businesses-health?limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface SubscriptionInvoice {
  id: string;
  number: string | null;
  status: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  amount_remaining: number | null;
  currency: string | null;
  created: number | null;
  paid_at: number | null;
  period_start: number | null;
  period_end: number | null;
  price_id: string | null;
  price_nickname: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

export interface SubscriptionTierChange {
  id: string;
  created: number | null;
  new_price_id: string | null;
  old_price_id: string | null;
  new_tier: string | null;
  old_tier: string | null;
}

export interface BusinessSubscription {
  business_id: string;
  subscription_tier: string | null;
  billing_status: Business["billing_status"] | null;
  is_founding_partner: boolean;
  trial_ends_at: string | null;
  grace_ends_at: string | null;
  billing_period_end: string | null;
  cancelled_at: string | null;
  reseller_discount_applied: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_price_meta: { tier: string; kind: "public" | "founding" } | null;
  total_paid: number;
  total_paid_currency: string;
  paid_invoice_count: number;
  invoices: SubscriptionInvoice[];
  tier_changes: SubscriptionTierChange[];
  stripe_error: string | null;
}

export async function fetchBusinessSubscription(
  id: string
): Promise<BusinessSubscription> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/businesses/${id}/subscription`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBusinessDetail(id: string): Promise<Business> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/businesses/${id}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchUserDetail(
  userId: string
): Promise<AdminUserDetail> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBusinessMembers(
  businessId: string
): Promise<BusinessMember[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/businesses/${businessId}/members`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function grantReseller(userId: string, discountPercent: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/grant-reseller`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ discount_percent: discountPercent }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}

export async function updateResellerDiscount(
  userId: string,
  discountPercent: number,
  applyToExisting: boolean
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/update-reseller-discount`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        discount_percent: discountPercent,
        apply_to_existing: applyToExisting,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}

export async function revokeReseller(userId: string, removeExistingDiscounts: boolean): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/revoke-reseller`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ remove_existing_discounts: removeExistingDiscounts }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}

// ─── Impersonation access sessions ──────────────────────────────

export interface AccessSessionRef {
  id: string | null;
  name?: string | null;
  email?: string | null;
  url_slug?: string | null;
  logo_url?: string | null;
}

export interface AccessSession {
  id: string;
  business_id: string;
  business: AccessSessionRef | null;
  superadmin_user_id: string;
  superadmin: AccessSessionRef | null;
  target_user_id: string;
  target: AccessSessionRef | null;
  target_role: "owner" | "admin" | "scanner" | string;
  selection_mode: "by_role" | "by_user" | string;
  reason: string;
  granted_at: string;
  expires_at: string;
  ended_at: string | null;
  ended_reason: string | null;
  event_count: number;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AccessSessionEvent {
  id: string;
  action_type: string;
  created_at: string;
  metadata: Record<string, unknown>;
  actor_user_id: string | null;
  actor: AccessSessionRef | null;
  impersonation_session_id: string | null;
  business_id: string | null;
  target_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AccessSessionListParams {
  limit?: number;
  offset?: number;
  business_id?: string;
  superadmin_user_id?: string;
  status?: "active" | "ended" | "expired";
}

export interface AccessSessionDetail {
  session: AccessSession;
  events: AccessSessionEvent[];
}

export async function fetchAccessSessions(
  params: AccessSessionListParams = {}
): Promise<Paginated<AccessSession>> {
  const headers = await getAuthHeaders();
  const qs = buildQuery(params);
  const res = await fetch(
    `${API_BASE_URL}/admin/impersonation/sessions${qs}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAccessSession(
  sessionId: string
): Promise<AccessSessionDetail> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/impersonation/sessions/${sessionId}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Email template previews ────────────────────────────────────

export interface EmailTemplateRef {
  category: "transactional" | "lifecycle" | "campaigns" | string;
  name: string;
}

export async function fetchEmailTemplates(): Promise<EmailTemplateRef[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/emails/list`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Returns raw rendered HTML — write it into an iframe via `srcdoc`.
 * `extraParams` carries the parameterized-preview knobs (digest
 * health/insight/action, nurture ns). */
export async function fetchEmailPreviewHtml(
  category: string,
  name: string,
  locale: "fr" | "en" | "es",
  extraParams?: Record<string, string>
): Promise<string> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ locale, ...extraParams });
  const res = await fetch(
    `${API_BASE_URL}/admin/emails/${category}/${name}?${params.toString()}`,
    { headers }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}

// ─── Email lifecycle flows ──────────────────────────────────────

export interface EmailFlowStep {
  day_offset: number | null;
  label: string;
  email_key: string;
  preview: { category: string; name: string; ns?: string } | null;
  format: "designed" | "plain";
  category: string;
  trigger?: string;
  pillar?: string;
  seasonal?: boolean;
  deferred?: boolean;
  note?: string;
}

export interface EmailFlow {
  state: string;
  title: string;
  description: string;
  entry_condition: string;
  trigger: string;
  anchor?: string;
  cadence?: string;
  cadence_days?: number;
  steps: EmailFlowStep[];
  transitions_to: string[];
}

export async function fetchEmailFlows(): Promise<EmailFlow[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/emails/flows`, { headers });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.flows as EmailFlow[];
}

// ─── Changelog authoring ────────────────────────────────────────

export type ChangelogCategory = "feature" | "improvement" | "fix";
export type ChangelogRole = "owner" | "admin" | "scanner";

export interface ChangelogArea {
  slug: string;
  label_fr: string;
  label_en: string;
  label_es: string | null;
  color: string;
  sort_order: number;
}

export interface ChangelogItem {
  id: string;
  release_id: string;
  category: ChangelogCategory;
  area: string | null;
  affects: ChangelogRole[];
  title_fr: string;
  title_en: string | null;
  title_es: string | null;
  body_fr: string | null;
  body_en: string | null;
  body_es: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChangelogRelease {
  id: string;
  status: "draft" | "published";
  version: string | null;
  title_fr: string | null;
  title_en: string | null;
  title_es: string | null;
  body_fr: string | null;
  body_en: string | null;
  body_es: string | null;
  image_url_fr: string | null;
  image_url_en: string | null;
  image_url_es: string | null;
  period: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  changelog_items?: ChangelogItem[];
}

export interface ChangelogDraftResponse {
  draft: ChangelogRelease;
  areas: ChangelogArea[];
  suggested_version: string;
}

export interface ChangelogItemInput {
  category: ChangelogCategory;
  area?: string | null;
  affects?: ChangelogRole[];
  title_fr: string;
  title_en?: string | null;
  title_es?: string | null;
  body_fr?: string | null;
  body_en?: string | null;
  body_es?: string | null;
  sort_order?: number;
}

export interface ChangelogReleaseInput {
  title_fr?: string | null;
  title_en?: string | null;
  title_es?: string | null;
  body_fr?: string | null;
  body_en?: string | null;
  body_es?: string | null;
  image_url_fr?: string | null;
  image_url_en?: string | null;
  image_url_es?: string | null;
}

export async function fetchChangelogDraft(): Promise<ChangelogDraftResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/changelog/draft`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchChangelogReleases(): Promise<ChangelogRelease[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/changelog/releases`, { headers });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.releases as ChangelogRelease[];
}

export async function fetchChangelogRelease(id: string): Promise<ChangelogRelease> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/changelog/releases/${id}`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.release as ChangelogRelease;
}

export async function updateChangelogRelease(
  id: string,
  payload: ChangelogReleaseInput
): Promise<ChangelogRelease> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/changelog/releases/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.release as ChangelogRelease;
}

export async function uploadChangelogImage(file: File): Promise<string> {
  const headers = await getAuthHeadersForFormData();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/admin/changelog/upload-image`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.url as string;
}

export async function createChangelogItem(
  releaseId: string,
  payload: ChangelogItemInput
): Promise<ChangelogItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/changelog/releases/${releaseId}/items`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.item as ChangelogItem;
}

export async function updateChangelogItem(
  id: string,
  payload: Partial<ChangelogItemInput>
): Promise<ChangelogItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/changelog/items/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.item as ChangelogItem;
}

export async function deleteChangelogItem(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/changelog/items/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function publishChangelogRelease(
  id: string,
  version: string
): Promise<ChangelogRelease> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/changelog/releases/${id}/publish`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ version }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.release as ChangelogRelease;
}

// Re-send the product-update email for an already-published release to every
// eligible recipient (resets that week's dedupe on the backend).
export async function resendChangelogRelease(
  id: string
): Promise<ChangelogRelease> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/changelog/releases/${id}/resend`,
    {
      method: "POST",
      headers,
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.release as ChangelogRelease;
}
