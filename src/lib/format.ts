/**
 * Display formatters shared by the business support console.
 *
 * Pure and unit-tested (`format.test.ts`) -- these decide what a superadmin
 * reads off the page, so "—" vs a wrong date matters.
 */

/** Regional-indicator flag emoji from an ISO-3166 alpha-2 code. */
export function flagEmoji(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "";
  const base = 0x1f1e6;
  const cc = code.toUpperCase();
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - 65),
    base + (cc.charCodeAt(1) - 65)
  );
}

/**
 * "🇫🇷 France" from whatever the backend managed to derive.
 *
 * `country_code` is best-effort (primary location address, else owner phone
 * prefix) and is frequently null, while the `country` column is usually set --
 * so fall back to it for the flag too rather than dropping the flag entirely.
 */
export function countryLabel(
  code?: string | null,
  name?: string | null
): string | null {
  const iso = code || (name && /^[A-Za-z]{2}$/.test(name) ? name : null);
  if (!iso && !name) return null;

  let display = name && !/^[A-Za-z]{2}$/.test(name) ? name : null;
  if (!display && iso) {
    try {
      display =
        new Intl.DisplayNames(["en"], { type: "region" }).of(
          iso.toUpperCase()
        ) ?? iso;
    } catch {
      display = iso;
    }
  }
  const flag = flagEmoji(iso);
  return `${flag ? flag + " " : ""}${display ?? iso ?? ""}`.trim();
}

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pl: "Polski",
};

/** "🇫🇷 Français (fr)" -- the language a merchant's passes and emails are in. */
export function localeLabel(locale?: string | null): string | null {
  if (!locale) return null;
  const flags: Record<string, string> = {
    en: "🇬🇧",
    fr: "🇫🇷",
    es: "🇪🇸",
    pl: "🇵🇱",
  };
  const name = LOCALE_LABELS[locale] ?? locale;
  const flag = flags[locale] ?? "";
  return `${flag ? flag + " " : ""}${name} (${locale})`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3d ago" / "just now". Coarse on purpose -- this is a scanning aid. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** A plan limit: `null` means unlimited, `0` means the feature is off. */
export function limitLabel(limit: number | null | undefined): string {
  if (limit === null || limit === undefined) return "Unlimited";
  if (limit === 0) return "Not included";
  return String(limit);
}

/** "22 / 81 (27%)" -- used wherever a reach or fill rate is shown. */
export function ratioLabel(part: number, total: number): string {
  if (!total) return "—";
  return `${part} / ${total} (${Math.round((part / total) * 100)}%)`;
}
