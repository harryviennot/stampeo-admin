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
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  // Billing (from migration 48)
  billing_status?:
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "grace"
    | "suspended";
  is_founding_partner?: boolean;
  trial_ends_at?: string | null;
  grace_ends_at?: string | null;
  // Onboarding survey + business contact (sourced from businesses.settings since migration 78)
  identity_website?: string | null;
  business_info?: BusinessInfoEntry[];
  heard_from?: string | null;
  heard_from_other?: string | null;
  team_size?: string | null;
  locations_count?: string | null;
  primary_goal?: string | null;
  has_active_design?: boolean;
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
    | "trial"
    | "active"
    | "past_due"
    | "cancelled"
    | "grace"
    | "suspended";
  has_active_design?: boolean;
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
  customers_this_month: number;
  customers_last_month: number;
  total_stamps: number;
  stamps_this_month: number;
  stamps_last_month: number;
  total_rewards_redeemed: number;
  certs_available: number;
  certs_assigned: number;
}

export interface BusinessStats {
  total_customers: number;
  customers_this_month: number;
  customers_last_month: number;
  total_stamps: number;
  stamps_this_month: number;
  stamps_last_month: number;
  total_rewards: number;
  active_design: CardDesign | null;
  certificate: {
    id: string;
    identifier: string;
    status: string;
  } | null;
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

export interface SetupWizardFunnelResponse {
  started: number;
  completed: number;
  steps: SetupWizardFunnelStep[];
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
