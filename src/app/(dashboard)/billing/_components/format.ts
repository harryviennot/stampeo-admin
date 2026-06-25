/** Shared money/date formatting for the billing dashboard. Amounts are minor units (cents). */

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
    return `${value.toFixed(opts.minorUnit ? 2 : 0)} ${currency.toUpperCase()}`;
  }
}

/** Compact money, e.g. €1.2k — for chart axes. */
export function formatAmountCompact(
  amountMinor: number | null | undefined,
  currency: string = "eur"
): string {
  const value = (amountMinor ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${Math.round(value)}`;
  }
}

export function tierLabel(tier: string | null | undefined): string {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/** "YYYY-MM" -> "Jul" (or "Jul 25" when spanning years is ambiguous). */
export function monthShort(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
  });
}

export function monthLong(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** A date for "next charge" columns: "Jul 1" or "Jul 1, 2026" when far out. */
export function formatChargeDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Relative day count, e.g. "in 3d" / "today" / "5d ago". */
export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.round((then - Date.now()) / 86_400_000);
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${Math.abs(days)}d ago`;
}
