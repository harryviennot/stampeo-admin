/**
 * The admin card grid renders every merchant's card at once, so it has to fill
 * {{variables}} without a business context or a signed-in customer. This is
 * that fill: real values from the grid endpoint win, and anything left over
 * falls back to the localized sample table so no tile ever shows a raw token.
 *
 * Pure functions only — plain objects in, plain objects out.
 */
import { describe, expect, test } from "bun:test";
import { buildPreviewValues } from "./design-preview";
import {
  renderSamplePreview,
  resolveFieldValue,
  SUPPORTED_LOCALES,
} from "./template-variables";
import type { AdminCardDesignItem } from "@/lib/api";

function item(overrides: {
  business?: Partial<AdminCardDesignItem["business"]>;
  design?: Partial<NonNullable<AdminCardDesignItem["design"]>>;
} = {}): AdminCardDesignItem {
  return {
    design: {
      id: "d1",
      name: "Loyalty card",
      is_active: true,
      organization_name: "Café Kawaa",
      description: "Loyalty",
      foreground_color: "rgb(255,255,255)",
      background_color: "rgb(20,20,20)",
      label_color: "rgb(255,255,255)",
      total_stamps: 8,
      stamp_filled_color: "rgb(255,215,0)",
      stamp_empty_color: "rgb(80,50,20)",
      stamp_border_color: "rgb(255,255,255)",
      card_type: "stamp",
      reward_name: "Café offert",
      secondary_fields: [],
      auxiliary_fields: [],
      back_fields: [],
      ...overrides.design,
    },
    render_error: null,
    business: {
      id: "biz-1",
      name: "Café Kawaa",
      url_slug: "cafe-kawaa",
      status: "active",
      billing_status: "active",
      subscription_tier: "growth",
      primary_locale: "fr",
      onboarding_finished: true,
      customer_data_collection: {},
      ...overrides.business,
    },
    customers_total: 10,
    scans_total: 40,
    scans_30d: 5,
    last_activity_at: null,
  };
}

describe("locale", () => {
  test("follows the business's primary_locale, not the admin's language", () => {
    expect(buildPreviewValues(item({ business: { primary_locale: "es" } })).locale).toBe("es");
  });

  test("falls back to en for a missing or unsupported locale", () => {
    expect(buildPreviewValues(item({ business: { primary_locale: undefined } })).locale).toBe("en");
    expect(buildPreviewValues(item({ business: { primary_locale: "de" } })).locale).toBe("en");
  });

  // The allowlist behind that fallback is a runtime array, so a language the
  // app supports but forgot to list is NOT a type error — the business just
  // silently previews in English. This is the guard for the next language.
  test("accepts every supported locale, not a hardcoded subset", () => {
    for (const supported of SUPPORTED_LOCALES) {
      expect(
        buildPreviewValues(item({ business: { primary_locale: supported } })).locale
      ).toBe(supported);
    }
  });

  test("fills every {{variable}} in every supported locale", () => {
    for (const supported of SUPPORTED_LOCALES) {
      const { values, locale } = buildPreviewValues(
        item({ business: { primary_locale: supported, name: "   " } })
      );
      const rendered = renderSamplePreview(
        "{{business_name}} {{stamps_left}} {{customer_first_name}} {{customer_birthday}}",
        values,
        locale
      );
      expect(rendered).not.toContain("{{");
    }
  });
});

describe("real business data beats the sample table", () => {
  test("business_name and reward_name come from the row", () => {
    const { values } = buildPreviewValues(item());
    expect(values.business_name).toBe("Café Kawaa");
    expect(values.reward_name).toBe("Café offert");
  });

  test("total_stamps comes from the design payload", () => {
    const { values } = buildPreviewValues(item({ design: { total_stamps: 8 } }));
    expect(values.total_stamps).toBe("8");
  });

  test("a blank business name does not override the sample", () => {
    // An empty override would render "Collect stamps at ." — worse than a
    // generic stand-in. Absent means the sample table fills it.
    const { values, locale } = buildPreviewValues(item({ business: { name: "   " } }));
    expect(values.business_name).toBeUndefined();
    expect(renderSamplePreview("{{business_name}}", values, locale)).toBe("Votre entreprise");
  });

  test("a missing reward_name leaves the sample in place", () => {
    const { values, locale } = buildPreviewValues(item({ design: { reward_name: null } }));
    expect(renderSamplePreview("{{reward_name}}", values, locale)).toBe("Café offert");
  });
});

describe("sample cardholder name", () => {
  test("is stable for the same business id", () => {
    const a = buildPreviewValues(item()).values.customer_first_name;
    const b = buildPreviewValues(item()).values.customer_first_name;
    expect(a).toBe(b);
    expect(a).toBeTruthy();
  });

  test("differs across businesses so the grid does not read as one name", () => {
    const names = new Set(
      ["biz-1", "biz-2", "biz-3", "biz-4", "biz-5", "biz-6"].map(
        (id) => buildPreviewValues(item({ business: { id } })).values.customer_first_name
      )
    );
    expect(names.size).toBeGreaterThan(1);
  });

  test("is drawn from the business locale's pool", () => {
    const { values } = buildPreviewValues(item({ business: { primary_locale: "es" } }));
    expect(
      ["Lucía", "Mateo", "Sofía", "Diego", "Valentina", "Hugo", "Martina", "Pablo"]
    ).toContain(values.customer_first_name!);
  });

  test("is Polish for a Polish business", () => {
    const { values } = buildPreviewValues(item({ business: { primary_locale: "pl" } }));
    expect(
      ["Zofia", "Jakub", "Julia", "Antoni", "Maja", "Szymon", "Lena", "Filip"]
    ).toContain(values.customer_first_name!);
  });
});

describe("merchant custom sign-up fields", () => {
  const withFields = (custom_fields: unknown[]) =>
    item({ business: { customer_data_collection: { custom_fields } } });

  test("resolve to the merchant's fallback", () => {
    const { values } = buildPreviewValues(
      withFields([{ key: "boisson", label: "Boisson préférée", fallback: "Expresso" }])
    );
    expect(values.boisson).toBe("Expresso");
  });

  test("fall back to the field label when no fallback is set", () => {
    const { values } = buildPreviewValues(
      withFields([{ key: "boisson", label: "Boisson préférée" }])
    );
    expect(values.boisson).toBe("Boisson préférée");
  });

  test("a retired (mode 'off') field is still resolved, never left raw", () => {
    // The field is off for NEW sign-ups but existing passes still carry the
    // line, so the preview must not print "{{boisson}}".
    const { values, locale } = buildPreviewValues(
      withFields([{ key: "boisson", label: "Boisson", mode: "off" }])
    );
    expect(renderSamplePreview("{{boisson}}", values, locale)).toBe("Boisson");
  });

  test("a malformed custom_fields blob is ignored rather than throwing", () => {
    expect(() => buildPreviewValues(withFields([null, "nope", { label: "no key" }]))).not.toThrow();
    expect(() =>
      buildPreviewValues(
        item({ business: { customer_data_collection: { custom_fields: "not-an-array" } } })
      )
    ).not.toThrow();
  });
});

describe("points ladder", () => {
  const points = (rewards: { id: string; threshold: number; name: string }[]) =>
    item({ design: { card_type: "points", points_rewards: rewards } });

  test("resolves the next reward from a sample balance", () => {
    const { values } = buildPreviewValues(
      points([
        { id: "r1", threshold: 100, name: "Croissant" },
        { id: "r2", threshold: 300, name: "Brunch" },
      ])
    );
    // Sample balance is 70% of the second-to-last threshold = 70.
    expect(values.points_balance).toBe("70");
    expect(values.next_reward_name).toBe("Croissant");
    expect(values.next_reward_points).toBe("100");
    expect(values.points_to_next).toBe("30");
  });

  test("a stamp card gets no points values even if a ladder tags along", () => {
    const { values } = buildPreviewValues(
      item({ design: { card_type: "stamp", points_rewards: [{ id: "r1", threshold: 100, name: "X" }] } })
    );
    expect(values.points_balance).toBeUndefined();
    expect(values.next_reward_name).toBeUndefined();
  });

  test("a points card with no ladder still resolves, never blank", () => {
    const { values, locale } = buildPreviewValues(points([]));
    expect(renderSamplePreview("{{points_balance}}", values, locale)).not.toContain("{{");
  });
});

describe("field resolution end to end", () => {
  test("a cleared ladder swaps the whole line for value_completed", () => {
    // Single reward at 100 → sample balance 70 → not cleared. Force cleared by
    // asking for the balance to sit on the top rung.
    const { values, locale } = buildPreviewValues(
      item({ design: { card_type: "points", points_rewards: [{ id: "r1", threshold: 0, name: "Café" }] } })
    );
    const resolved = resolveFieldValue(
      { value: "Next: {{next_reward_name}}", value_completed: "Tout débloqué" },
      values,
      locale
    );
    expect(resolved).toBe("Tout débloqué");
  });

  test("a field resolving to nothing is dropped", () => {
    const { values, locale } = buildPreviewValues(item());
    expect(resolveFieldValue({ value: "" }, values, locale)).toBeNull();
    expect(resolveFieldValue({ value: "   " }, values, locale)).toBeNull();
  });

  test("no built-in token survives unresolved on a real-looking card", () => {
    const { values, locale } = buildPreviewValues(item());
    const line =
      "{{customer_first_name}} · {{stamp_count}}/{{total_stamps}} · {{reward_name}} · {{business_name}} · {{customer_birthday}}";
    const out = renderSamplePreview(
      line,
      { ...values, stamp_count: "6", total_stamps: "8" },
      locale
    );
    expect(out).not.toContain("{{");
  });
});
