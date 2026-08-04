/**
 * Which superadmin actions apply to a business, and under what conditions.
 *
 * Mirrors the conditions on the business detail page
 * (`businesses/[id]/_components/business-header.tsx` + the certificate tab) so
 * the row-level dropdown on the list page can't drift from it. Pure so the
 * rules are unit-testable without mounting the table.
 */

export type BusinessActionId =
  | "grant_no_card_trial"
  | "require_card"
  | "extend_checkout_window"
  | "extend_payment_grace"
  | "release_certificate"
  | "suspend"
  | "activate";

/** The fields an action decision depends on. */
export interface BusinessActionRow {
  status: string;
  billing_status?: string | null;
  requires_card_upfront?: boolean;
  payment_grace_ends_at?: string | null;
}

export interface BusinessAction {
  id: BusinessActionId;
  label: string;
  /** Short native-tooltip explanation, matching the detail page wording. */
  hint?: string;
  /** Red styling in the menu. */
  destructive?: boolean;
  /**
   * Present when the action needs an "are you sure". Reversible, low-stakes
   * actions (the two extensions, require-card, reactivate) fire immediately,
   * exactly as they do on the detail page.
   */
  confirm?: {
    title: string;
    /** `{name}` is substituted with the business name by the caller. */
    description: string;
    action: string;
  };
}

export function availableBusinessActions(
  biz: BusinessActionRow,
  opts: { certificateStatus?: string | null } = {}
): BusinessAction[] {
  const out: BusinessAction[] = [];

  const isNoCard = biz.requires_card_upfront === false;
  const pendingCheckout = biz.billing_status === "pending_checkout";

  // Grant / revert the no-card exception. Mutually exclusive, same as the
  // ternary chain on the detail page.
  if (isNoCard) {
    out.push({
      id: "require_card",
      label: "Require card",
      hint: "Revert the no-card exception; they'll need a card to continue",
    });
  } else if (pendingCheckout) {
    out.push({
      id: "grant_no_card_trial",
      label: "Grant no-card trial",
      confirm: {
        title: "Grant a no-card trial?",
        description:
          '"{name}" hasn\'t attached a card yet. This starts a fresh trial without one and lifts the checkout gate; they\'ll need a card only once the trial ends.',
        action: "Grant no-card trial",
      },
    });
  }

  if (pendingCheckout) {
    out.push({
      id: "extend_checkout_window",
      label: "Extend setup +7d",
      hint: "Lifts the checkout gate for 7 more days, whatever the reason",
    });
  }

  if (
    biz.billing_status === "past_due" ||
    (biz.billing_status === "suspended" && !!biz.payment_grace_ends_at)
  ) {
    out.push({
      id: "extend_payment_grace",
      label: "Extend payment +3d",
      hint: "Pushes the payment deadline back 3 days and lifts a payment suspension",
    });
  }

  // Only offerable once we know a certificate is actually assigned, which
  // needs the per-business stats fetch.
  if (opts.certificateStatus === "assigned") {
    out.push({
      id: "release_certificate",
      label: "Release certificate to pool",
      confirm: {
        title: "Release certificate",
        description:
          "Release this certificate back into the pool? It stays reclaimable by {name} until reassigned to someone else, after which installed cards can no longer be updated.",
        action: "Release",
      },
    });
  }

  if (biz.status === "active") {
    out.push({
      id: "suspend",
      label: "Suspend business",
      destructive: true,
      confirm: {
        title: "Suspend business?",
        description:
          'This will suspend "{name}". They will no longer be able to scan customers or manage their account.',
        action: "Suspend",
      },
    });
  } else {
    out.push({ id: "activate", label: "Reactivate business" });
  }

  return out;
}
