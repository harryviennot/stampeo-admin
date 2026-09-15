/**
 * Rendering money that is not all in one currency.
 *
 * Every headline figure on the billing dashboard is the PLATFORM-CURRENCY
 * SLICE of a larger book, never a total — there is no exchange rate in this
 * product and inventing one would report revenue nobody can reconcile against
 * Stripe. That makes the slice correct and, on its own, misleading: "€0 trial
 * pipeline" sat above a live $49 trial for a whole QA round because the dollar
 * figure was computed, published in the payload, and rendered nowhere.
 *
 * So a slice is only finished when what it leaves out is on screen beside it.
 * These helpers are that "beside it".
 */

export function formatAmount(
  amountMinor: number | null | undefined,
  currency: string = "eur",
  opts: { minorUnit?: boolean } = {}
): string {
  const value = (amountMinor ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: opts.minorUnit ? 2 : 0,
    }).format(value);
  } catch {
    // An unknown ISO code throws rather than degrading, and a card showing
    // nothing is worse than one showing "4900 ABC".
    return `${value.toFixed(opts.minorUnit ? 2 : 0)} ${currency.toUpperCase()}`;
  }
}

/**
 * Every currency in `split` except the headline one, formatted and joined.
 *
 * Returns null when there is nothing to add, so a caller can skip the whole
 * footer rather than render an empty separator. Zero buckets are dropped: a
 * `{usd: 0}` entry means the dollar book is empty, not that it needs a line.
 */
export function otherCurrencyText(
  split: Record<string, number> | undefined | null,
  headline: string,
  opts: { withCode?: boolean } = {}
): string | null {
  const rest = Object.entries(split ?? {}).filter(
    ([code, amount]) => code.toLowerCase() !== headline.toLowerCase() && amount
  );
  if (!rest.length) return null;
  return rest
    .map(([code, amount]) =>
      opts.withCode
        ? `${formatAmount(amount, code)} (${code.toUpperCase()})`
        : formatAmount(amount, code)
    )
    .join(" · ");
}

/**
 * How a scoped panel states what it left out.
 *
 * The projection, the pricing-cohort comparison and the conversion cohorts are
 * deliberately the platform-currency book only — splitting a three-scenario
 * forecast per currency would triple the payload to describe a handful of
 * accounts. That is defensible; presenting it as the whole book is not, and
 * until now nothing rendered the exclusion count the API already published.
 */
export function excludedNote(
  count: number | null | undefined,
  currency: string
): string | null {
  if (!count) return null;
  return `${currency.toUpperCase()} book only — ${count} ${
    count === 1 ? "account" : "accounts"
  } in other currencies excluded`;
}
