import { describe, expect, it } from "bun:test";
import {
  CHECKOUT_MAX_PENDING_CUSTOMERS,
  CHECKOUT_SETUP_WINDOW_DAYS,
  checkoutGateReason,
} from "./checkout-gate";

const NOW = Date.parse("2026-08-03T12:00:00Z");
const inDays = (n: number) => new Date(NOW + n * 86_400_000).toISOString();

const biz = (over: Partial<Parameters<typeof checkoutGateReason>[0]> = {}) => ({
  billing_status: "pending_checkout",
  created_at: inDays(-2),
  customers_total: 0,
  ...over,
});

describe("checkoutGateReason", () => {
  it("returns null for a business still legitimately mid-wizard", () => {
    expect(checkoutGateReason(biz(), NOW)).toBeNull();
  });

  it("flags a finished wizard with no card", () => {
    const b = biz({ settings: { setup_progress: { completed_at: inDays(-1) } } });
    expect(checkoutGateReason(b, NOW)).toBe("setup_complete");
  });

  it("flags a lapsed setup window", () => {
    const b = biz({ created_at: inDays(-(CHECKOUT_SETUP_WINDOW_DAYS + 1)) });
    expect(checkoutGateReason(b, NOW)).toBe("window_lapsed");
  });

  it("allows exactly the customer cap", () => {
    const b = biz({ customers_total: CHECKOUT_MAX_PENDING_CUSTOMERS });
    expect(checkoutGateReason(b, NOW)).toBeNull();
  });

  it("flags one customer over the cap", () => {
    const b = biz({ customers_total: CHECKOUT_MAX_PENDING_CUSTOMERS + 1 });
    expect(checkoutGateReason(b, NOW)).toBe("usage_cap");
  });

  it("lets the superadmin override outrank every reason", () => {
    for (const over of [
      { settings: { setup_progress: { completed_at: inDays(-1) } } },
      { created_at: inDays(-90) },
      { customers_total: 500 },
    ]) {
      const b = biz({ ...over, checkout_grace_until: inDays(7) });
      expect(checkoutGateReason(b, NOW)).toBeNull();
    }
  });

  it("resumes normal rules once the override lapses", () => {
    const b = biz({ customers_total: 40, checkout_grace_until: inDays(-1) });
    expect(checkoutGateReason(b, NOW)).toBe("usage_cap");
  });

  it("never fires for a business outside pending_checkout", () => {
    for (const billing_status of [
      "trial", "active", "past_due", "grace", "cancelled", "suspended",
    ]) {
      const b = biz({
        billing_status,
        customers_total: 900,
        created_at: inDays(-90),
        settings: { setup_progress: { completed_at: inDays(-1) } },
      });
      expect(checkoutGateReason(b, NOW)).toBeNull();
    }
  });

  it("tolerates missing and malformed dates", () => {
    expect(checkoutGateReason(biz({ created_at: null }), NOW)).toBeNull();
    expect(checkoutGateReason(biz({ created_at: "nope" }), NOW)).toBeNull();
    const b = biz({ customers_total: 40, checkout_grace_until: "nope" });
    expect(checkoutGateReason(b, NOW)).toBe("usage_cap");
  });

  it("treats a missing customer count as zero", () => {
    expect(checkoutGateReason(biz({ customers_total: null }), NOW)).toBeNull();
  });
});
