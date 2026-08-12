/**
 * Fills the {{variables}} on an admin card preview.
 *
 * web/ resolves these from live context (`useVariablePreviewValues`: the
 * business provider, the default program, the signed-in merchant's profile).
 * Admin has none of that and renders many businesses' cards at once, so the
 * values come off the grid payload instead — one RPC for the whole page rather
 * than three hooks per tile.
 *
 * The layering, strongest first:
 *   1. the merchant's REAL data (business name, reward name, stamp total,
 *      resolved points ladder) — this is the point of the grid, seeing what
 *      each card actually says
 *   2. merchant-defined sign-up fields, previewed as their configured fallback
 *      (or the field label), mirroring what a customer who predates the field
 *      sees on their pass
 *   3. a stable per-business sample cardholder name
 *   4. everything left over — birthdays, store location — falls through to the
 *      localized sample table inside `renderSamplePreview`
 *
 * Layer 4 is why this returns a SPARSE map and never a fully-populated one:
 * an override that is present-but-empty would print half a sentence, where an
 * absent key lets the sample table supply a believable stand-in.
 *
 * Pure — no fetching, no context, no globals.
 */
import {
  customFieldSampleValues,
  pickSampleName,
  pointsVariableValues,
  type CustomFieldVariable,
  type Locale,
} from "@/lib/template-variables";
import { defaultPointsSampleBalance } from "@/lib/card-utils";
import type { CardDesign, RewardTier } from "@/types/design";

const LOCALES: Locale[] = ["en", "fr", "es"];

function toLocale(value: string | null | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : "en";
}

/**
 * Merchant-defined sign-up fields out of `settings.customer_data_collection`.
 *
 * Deliberately tolerant: this blob is merchant-authored JSON reaching the grid
 * from every business on the platform at once, and one malformed entry must
 * not take down the whole page. Retired fields (mode "off") are KEPT — they are
 * closed to new sign-ups but existing passes still carry the line, so the
 * preview would otherwise print a raw `{{key}}`.
 */
function readCustomFields(
  collection: Record<string, unknown> | null | undefined
): CustomFieldVariable[] {
  const raw = collection?.custom_fields;
  if (!Array.isArray(raw)) return [];
  const fields: CustomFieldVariable[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const field = entry as Record<string, unknown>;
    const key = typeof field.key === "string" ? field.key : "";
    if (!key) continue;
    fields.push({
      key,
      label: typeof field.label === "string" ? field.label : key,
      fallback: typeof field.fallback === "string" ? field.fallback : undefined,
    });
  }
  return fields;
}

export interface PreviewValues {
  /** Sparse overrides to hand to `<WalletCard variableValues={...} />`. */
  values: Record<string, string>;
  /** The BUSINESS locale — the pass reads in the customer's language. */
  locale: Locale;
}

/**
 * The minimum a caller must supply. Structural rather than tied to
 * `AdminCardDesignItem`, so the single-business design tab (which has a
 * `Business` and a `CardDesign` from two different endpoints) can call it too.
 * Every field is optional: a partially-loaded source degrades to samples
 * rather than throwing.
 */
export interface PreviewSource {
  design?: Partial<
    Pick<CardDesign, "reward_name" | "total_stamps" | "card_type" | "points_rewards">
  > | null;
  business?: {
    id?: string | null;
    name?: string | null;
    primary_locale?: string | null;
    customer_data_collection?: Record<string, unknown> | null;
  } | null;
}

/** Build the {{variable}} substitutions for one card preview. */
export function buildPreviewValues(item: PreviewSource): PreviewValues {
  const locale = toLocale(item.business?.primary_locale);
  const design = item.design;
  const values: Record<string, string> = {};

  const businessName = item.business?.name?.trim();
  if (businessName) values.business_name = businessName;

  const rewardName = design?.reward_name?.trim();
  if (rewardName) values.reward_name = rewardName;

  const totalStamps = design?.total_stamps;
  if (typeof totalStamps === "number" && totalStamps > 0) {
    values.total_stamps = String(totalStamps);
  }

  // Points cards only. A stamp design can still carry a stale ladder from a
  // program conversion; resolving it would advertise a reward the card does
  // not actually track.
  if (design?.card_type === "points") {
    const rewards: RewardTier[] = design.points_rewards ?? [];
    Object.assign(
      values,
      pointsVariableValues({
        rewards,
        balance: defaultPointsSampleBalance(rewards),
        locale,
      })
    );
  }

  Object.assign(
    values,
    customFieldSampleValues(readCustomFields(item.business?.customer_data_collection))
  );

  // Seeded on the business id so a tile shows the same cardholder on every
  // render — an unseeded pick would differ between server and client and trip
  // a hydration mismatch.
  values.customer_first_name = pickSampleName(locale, item.business?.id ?? "");

  return { values, locale };
}
