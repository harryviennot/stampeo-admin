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

export interface Business {
  id: string;
  name: string;
  url_slug: string;
  status: "pending" | "active" | "suspended";
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
  owner_is_reseller: boolean;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  // Onboarding discovery fields (admin-only)
  website?: string | null;
  phone?: string | null;
  heard_from?: string | null;
  heard_from_other?: string | null;
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

export async function fetchBusinesses(): Promise<Business[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/businesses`, { headers });
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

export async function fetchUsers(): Promise<AdminUser[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/users`, { headers });
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

export async function grantReseller(userId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/grant-reseller`,
    { method: "POST", headers }
  );
  if (!res.ok) throw new Error(await res.text());
}

export async function revokeReseller(userId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/revoke-reseller`,
    { method: "POST", headers }
  );
  if (!res.ok) throw new Error(await res.text());
}
