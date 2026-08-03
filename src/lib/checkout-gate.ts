/**
 * Client-side mirror of the backend checkout gate
 * (`billing.checkout_gate_reason`, backend/app/services/billing.py).
 *
 * Used for the list view only, so a superadmin can see and filter on who is
 * actually blocked. The `Billing = pending_checkout` filter over-selects: it
 * also catches businesses still legitimately mid-wizard.
 *
 * Every input already comes back from `get_admin_businesses_enriched`
 * (`to_jsonb(ordered.*)` plus `customers_total`), so no RPC change is needed.
 * The business detail page uses the server's authoritative verdict instead.
 */

/** Must stay in sync with CHECKOUT_MAX_PENDING_CUSTOMERS in billing.py. */
export const CHECKOUT_MAX_PENDING_CUSTOMERS = 10;
/** Must stay in sync with CHECKOUT_SETUP_WINDOW_DAYS in billing.py. */
export const CHECKOUT_SETUP_WINDOW_DAYS = 30;

export type CheckoutGateReason = "setup_complete" | "window_lapsed" | "usage_cap";

export interface CheckoutGateInput {
  billing_status?: string | null;
  created_at?: string | null;
  checkout_grace_until?: string | null;
  customers_total?: number | null;
  // Index signature so a whole `Business` row (whose settings is a loose bag)
  // can be passed straight in.
  settings?: {
    setup_progress?: { completed_at?: string | null } | null;
    [key: string]: unknown;
  } | null;
}

export function checkoutGateReason(
  business: CheckoutGateInput,
  now: number = Date.now(),
): CheckoutGateReason | null {
  if (business.billing_status !== "pending_checkout") return null;

  // Superadmin override outranks every reason.
  const overrideMs = business.checkout_grace_until
    ? new Date(business.checkout_grace_until).getTime()
    : NaN;
  if (Number.isFinite(overrideMs) && overrideMs > now) return null;

  if (business.settings?.setup_progress?.completed_at) return "setup_complete";

  const createdMs = business.created_at ? new Date(business.created_at).getTime() : NaN;
  if (
    Number.isFinite(createdMs) &&
    createdMs < now - CHECKOUT_SETUP_WINDOW_DAYS * 86_400_000
  ) {
    return "window_lapsed";
  }

  if ((business.customers_total ?? 0) > CHECKOUT_MAX_PENDING_CUSTOMERS) {
    return "usage_cap";
  }

  return null;
}

export const GATE_REASON_LABELS: Record<CheckoutGateReason, string> = {
  setup_complete: "Setup done, no card",
  window_lapsed: "Setup window lapsed",
  usage_cap: "Over customer limit",
};
