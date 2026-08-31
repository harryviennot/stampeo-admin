import { describe, expect, test } from "bun:test";
import { describeTargetFilter } from "./broadcast-target";

describe("describeTargetFilter", () => {
  test("an explicit all-customers filter", () => {
    expect(describeTargetFilter({ all: true })).toBe("Everyone");
  });

  test("an empty or missing filter means everyone", () => {
    expect(describeTargetFilter({})).toBe("Everyone");
    expect(describeTargetFilter(null)).toBe("Everyone");
    expect(describeTargetFilter(undefined)).toBe("Everyone");
  });

  test("a progress range", () => {
    expect(describeTargetFilter({ value_min: 5, value_max: 9 })).toBe(
      "progress 5–9"
    );
    expect(describeTargetFilter({ value_min: 5 })).toBe("progress 5+");
    expect(describeTargetFilter({ value_max: 9 })).toBe("progress up to 9");
  });

  test("reads the legacy stamp_count keys from pre-rename rows", () => {
    expect(
      describeTargetFilter({ stamp_count_min: 3, stamp_count_max: 7 })
    ).toBe("progress 3–7");
  });

  test("prefers the canonical key when a row carries both", () => {
    expect(
      describeTargetFilter({ value_min: 5, stamp_count_min: 3 })
    ).toBe("progress 5+");
  });

  test("enrollment windows", () => {
    expect(describeTargetFilter({ enrolled_before_days: 90 })).toBe(
      "joined more than 90d ago"
    );
    expect(describeTargetFilter({ enrolled_after_days: 7 })).toBe(
      "joined within 7d"
    );
  });

  test("inactivity", () => {
    expect(describeTargetFilter({ inactive_days: 30 })).toBe("inactive 30d+");
  });

  test("reward state, including the false case", () => {
    expect(describeTargetFilter({ has_unredeemed_reward: true })).toBe(
      "holds a reward"
    );
    expect(describeTargetFilter({ has_redeemed: true })).toBe(
      "has redeemed before"
    );
    // `false` is a real, distinct segment -- not "unset".
    expect(describeTargetFilter({ has_redeemed: false })).toBe(
      "never redeemed"
    );
  });

  test("location filters, singular and plural", () => {
    expect(
      describeTargetFilter({ enrolled_at_location_ids: { ids: ["a"] } })
    ).toBe("enrolled at 1 location");
    expect(
      describeTargetFilter({
        enrolled_at_location_ids: { ids: ["a", "b"], include_no_location: true },
      })
    ).toBe("enrolled at 2 locations (or none)");
    expect(
      describeTargetFilter({ active_at_location_ids: { ids: ["a"], days: 30 } })
    ).toBe("active at 1 location in 30d");
  });

  test("combines several clauses", () => {
    expect(
      describeTargetFilter({
        value_min: 5,
        inactive_days: 30,
        has_unredeemed_reward: true,
      })
    ).toBe("progress 5+ · inactive 30d+ · holds a reward");
  });

  test("an unrecognised filter falls back rather than rendering nothing", () => {
    expect(describeTargetFilter({ some_future_key: 1 })).toBe("Everyone");
  });
});
