import { describe, expect, test } from "bun:test";

import { excludedNote, formatAmount, otherCurrencyText } from "./money";

describe("formatAmount", () => {
  test("renders minor units in the currency it is given", () => {
    expect(formatAmount(11900, "usd")).toContain("119");
    expect(formatAmount(11900, "usd")).toContain("$");
  });

  test("a dollar amount never renders with a euro sign", () => {
    // The round-5 defect on screen: the breakdown row carried its own
    // currency, and revenue-card.tsx formatted every row with the page's.
    expect(formatAmount(11900, "usd")).not.toContain("€");
  });

  test("an unknown ISO code degrades instead of throwing", () => {
    // Intl renders an unrecognised code as the code itself rather than
    // throwing, so the catch is a belt-and-braces path. Either way the number
    // and the code must both survive — a card showing nothing is worse than
    // one showing "ZZZ 49".
    const out = formatAmount(4900, "zzz");
    expect(out).toContain("49");
    expect(out).toContain("ZZZ");
  });

  test("minorUnit shows the cents for unit prices", () => {
    expect(formatAmount(1999, "eur", { minorUnit: true })).toContain("19.99");
  });
});

describe("otherCurrencyText", () => {
  test("names every currency the headline figure leaves out", () => {
    const text = otherCurrencyText({ eur: 12000, usd: 11900 }, "eur");
    expect(text).toContain("119");
    expect(text).not.toContain("120");
  });

  test("returns null when the book is single-currency", () => {
    expect(otherCurrencyText({ eur: 12000 }, "eur")).toBeNull();
    expect(otherCurrencyText(undefined, "eur")).toBeNull();
  });

  test("an empty bucket is not a currency worth a line", () => {
    expect(otherCurrencyText({ eur: 12000, usd: 0 }, "eur")).toBeNull();
  });

  test("joins several with a separator", () => {
    const text = otherCurrencyText({ eur: 1, usd: 11900, gbp: 5000 }, "eur");
    expect(text).toContain(" · ");
  });

  test("withCode disambiguates currencies that share a glyph", () => {
    // USD and CAD both render as "$" under some locales; the code settles it.
    expect(otherCurrencyText({ usd: 11900 }, "eur", { withCode: true })).toContain(
      "(USD)"
    );
  });

  test("the headline currency is matched case-insensitively", () => {
    expect(otherCurrencyText({ EUR: 12000 }, "eur")).toBeNull();
  });
});

describe("excludedNote", () => {
  test("says how many accounts a scoped panel dropped", () => {
    expect(excludedNote(4, "eur")).toBe(
      "EUR book only — 4 accounts in other currencies excluded"
    );
  });

  test("singular reads correctly", () => {
    expect(excludedNote(1, "eur")).toContain("1 account in");
  });

  test("nothing excluded means no note at all", () => {
    expect(excludedNote(0, "eur")).toBeNull();
    expect(excludedNote(null, "eur")).toBeNull();
  });
});
