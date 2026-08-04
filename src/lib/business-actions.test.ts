import { describe, expect, it } from "bun:test";

import {
  availableBusinessActions,
  type BusinessActionRow,
} from "./business-actions";

const biz = (over: Partial<BusinessActionRow> = {}): BusinessActionRow => ({
  status: "active",
  billing_status: "active",
  requires_card_upfront: true,
  payment_grace_ends_at: null,
  ...over,
});

const ids = (...args: Parameters<typeof availableBusinessActions>) =>
  availableBusinessActions(...args).map((a) => a.id);

describe("availableBusinessActions", () => {
  it("offers suspend for an active business, activate otherwise", () => {
    expect(ids(biz({ status: "active" }))).toContain("suspend");
    expect(ids(biz({ status: "active" }))).not.toContain("activate");

    for (const status of ["suspended", "pending"]) {
      expect(ids(biz({ status }))).toContain("activate");
      expect(ids(biz({ status }))).not.toContain("suspend");
    }
  });

  it("offers the no-card trial only while pending checkout", () => {
    expect(ids(biz({ billing_status: "pending_checkout" }))).toContain(
      "grant_no_card_trial"
    );
    expect(ids(biz({ billing_status: "trial" }))).not.toContain(
      "grant_no_card_trial"
    );
  });

  it("swaps grant-no-card for require-card once the exception is in place", () => {
    const noCard = biz({
      billing_status: "pending_checkout",
      requires_card_upfront: false,
    });
    expect(ids(noCard)).toContain("require_card");
    // Mutually exclusive — offering both at once would be nonsense.
    expect(ids(noCard)).not.toContain("grant_no_card_trial");
  });

  it("offers require-card for a no-card business whatever its billing status", () => {
    expect(
      ids(biz({ billing_status: "trial", requires_card_upfront: false }))
    ).toContain("require_card");
  });

  it("offers +7d setup only while pending checkout", () => {
    expect(ids(biz({ billing_status: "pending_checkout" }))).toContain(
      "extend_checkout_window"
    );
    expect(ids(biz({ billing_status: "past_due" }))).not.toContain(
      "extend_checkout_window"
    );
  });

  it("offers +3d payment when past due, or suspended with a grace deadline", () => {
    expect(ids(biz({ billing_status: "past_due" }))).toContain(
      "extend_payment_grace"
    );
    expect(
      ids(
        biz({
          billing_status: "suspended",
          payment_grace_ends_at: "2026-08-10T00:00:00Z",
        })
      )
    ).toContain("extend_payment_grace");
    // Suspended with no grace deadline stamped -> nothing to extend.
    expect(ids(biz({ billing_status: "suspended" }))).not.toContain(
      "extend_payment_grace"
    );
  });

  it("offers the certificate release only once one is assigned", () => {
    expect(ids(biz(), { certificateStatus: "assigned" })).toContain(
      "release_certificate"
    );
    expect(ids(biz(), { certificateStatus: "available" })).not.toContain(
      "release_certificate"
    );
    // Unknown = stats not loaded yet; don't offer an action we can't fulfil.
    expect(ids(biz())).not.toContain("release_certificate");
  });

  it("marks destructive actions so the menu can style and confirm them", () => {
    const actions = availableBusinessActions(
      biz({ status: "active", billing_status: "pending_checkout" }),
      { certificateStatus: "assigned" }
    );
    const byId = Object.fromEntries(actions.map((a) => [a.id, a]));

    expect(byId.suspend.destructive).toBe(true);
    expect(byId.suspend.confirm).toBeTruthy();
    expect(byId.release_certificate.confirm).toBeTruthy();
    expect(byId.grant_no_card_trial.confirm).toBeTruthy();
    // Reversible, low-stakes -> fire immediately, matching the detail page.
    expect(byId.extend_checkout_window.confirm).toBeUndefined();
  });

  it("always returns at least one action", () => {
    for (const status of ["active", "suspended", "pending"]) {
      for (const billing of ["active", "trial", "past_due", "cancelled"]) {
        expect(
          availableBusinessActions(biz({ status, billing_status: billing }))
            .length
        ).toBeGreaterThan(0);
      }
    }
  });

  it("gives every action a label", () => {
    const actions = availableBusinessActions(
      biz({ status: "active", billing_status: "pending_checkout" }),
      { certificateStatus: "assigned" }
    );
    for (const a of actions) expect(a.label.length).toBeGreaterThan(0);
  });
});
