import { createClient } from "@/utils/supabase/client";

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
  subscription_tier: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export async function fetchBusinesses(): Promise<Business[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/admin/businesses`, { headers });
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
