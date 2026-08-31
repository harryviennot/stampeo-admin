import { describe, expect, test } from "bun:test";
import {
  countryLabel,
  flagEmoji,
  limitLabel,
  localeLabel,
  ratioLabel,
  relativeTime,
  formatDate,
  formatDateTime,
} from "./format";

describe("flagEmoji", () => {
  test("maps an ISO-2 code to regional indicators", () => {
    expect(flagEmoji("FR")).toBe("🇫🇷");
    expect(flagEmoji("fr")).toBe("🇫🇷");
  });

  test("returns nothing for anything that is not an ISO-2 code", () => {
    expect(flagEmoji(null)).toBe("");
    expect(flagEmoji(undefined)).toBe("");
    expect(flagEmoji("")).toBe("");
    expect(flagEmoji("FRA")).toBe("");
    expect(flagEmoji("1")).toBe("");
  });
});

describe("countryLabel", () => {
  test("renders flag + name when both are known", () => {
    expect(countryLabel("FR", "France")).toBe("🇫🇷 France");
  });

  test("derives the name from the code alone", () => {
    expect(countryLabel("FR", null)).toBe("🇫🇷 France");
  });

  test("still shows a flag when only the country COLUMN is set", () => {
    // The derived country_code is best-effort and null on most dev rows, while
    // businesses.country holds "FR". Dropping the flag there was the old bug.
    expect(countryLabel(null, "FR")).toBe("🇫🇷 France");
  });

  test("returns null when nothing is known", () => {
    expect(countryLabel(null, null)).toBeNull();
    expect(countryLabel(undefined, undefined)).toBeNull();
  });
});

describe("localeLabel", () => {
  test("names the language rather than printing a bare code", () => {
    expect(localeLabel("fr")).toBe("🇫🇷 Français (fr)");
    expect(localeLabel("pl")).toBe("🇵🇱 Polski (pl)");
  });

  test("degrades to the raw code for a locale it has no name for", () => {
    expect(localeLabel("de")).toBe("de (de)");
  });

  test("returns null when unset", () => {
    expect(localeLabel(null)).toBeNull();
    expect(localeLabel(undefined)).toBeNull();
  });
});

describe("date formatters", () => {
  test("render an em dash rather than 'Invalid Date'", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not a date")).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("nonsense")).toBe("—");
    expect(relativeTime(null)).toBe("—");
    expect(relativeTime("nope")).toBe("—");
  });

  test("format a real timestamp", () => {
    expect(formatDate("2026-08-30T10:00:00Z")).toContain("2026");
  });
});

describe("relativeTime", () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

  test("buckets by magnitude", () => {
    expect(relativeTime(ago(5_000))).toBe("just now");
    expect(relativeTime(ago(5 * 60_000))).toBe("5m ago");
    expect(relativeTime(ago(3 * 3_600_000))).toBe("3h ago");
    expect(relativeTime(ago(4 * 86_400_000))).toBe("4d ago");
    expect(relativeTime(ago(60 * 86_400_000))).toBe("2mo ago");
    expect(relativeTime(ago(800 * 86_400_000))).toBe("2y ago");
  });
});

describe("limitLabel", () => {
  test("distinguishes unlimited from off", () => {
    // These read identically as raw values but mean opposite things: null is
    // Pro's unlimited, 0 is Starter's "you cannot have this at all".
    expect(limitLabel(null)).toBe("Unlimited");
    expect(limitLabel(undefined)).toBe("Unlimited");
    expect(limitLabel(0)).toBe("Not included");
    expect(limitLabel(3)).toBe("3");
  });
});

describe("ratioLabel", () => {
  test("shows the percentage alongside the raw pair", () => {
    expect(ratioLabel(22, 81)).toBe("22 / 81 (27%)");
  });

  test("does not divide by zero", () => {
    expect(ratioLabel(0, 0)).toBe("—");
  });
});
