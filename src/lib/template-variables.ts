/**
 * Template variable helpers for notification bodies.
 *
 * Mirrors `NotificationService.extract_variables` in the backend
 * (backend/app/services/programs/notifications.py). Keep in sync.
 */

export const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/** Canonical variable keys stored in the backend. */
export const VARIABLE_KEYS = [
  'stamp_count',
  'total_stamps',
  'stamps_left',
  'rewards_count',
  'reward_name',
  'business_name',
  'customer_first_name',
  'store_location',
  // Points programs (resolved by build_field_context in the backend).
  'points_balance',
  'points_to_next',
  // The absolute point value of the next reward (the milestone itself), e.g. 100
  // when the customer has 30 and points_to_next is 70.
  'next_reward_points',
  'next_reward_name',
  // The reward the customer just won (multi-reward ladders). Available on the
  // reward_earned + reward_completed triggers.
  'last_reward_name',
  // Points a basket booster added on top of the base (STA-237). Only resolves
  // on a boosted scan, so it belongs to points_boosted; the backend strips it
  // from any other copy rather than leaking the raw token.
  'bonus_points',
  // Day + month of the customer's birthday, localized by the backend
  // ("14 mars" / "March 14"). Only offered when the business collects it.
  'customer_birthday',
] as const;

export type VariableKey = (typeof VARIABLE_KEYS)[number];

/**
 * A variable a surface may offer: one of the canonical keys above, or a key a
 * business defined itself on its sign-up form. `(string & {})` keeps
 * autocomplete on the canonical names while accepting merchant keys, which are
 * only known at runtime.
 */
export type TemplateVariableKey = VariableKey | (string & {});

/** The shape `programVariableKeys` needs from a merchant-defined field. */
export interface CustomFieldVariable {
  key: string;
  label: string;
  fallback?: string;
}

/** Variables only available on the Pro tier. The backend strips these at
 *  render time on non-Pro tiers (`_strip_pro_only_vars`) so customers
 *  don't see raw `{{...}}` syntax in their wallet pass. The UI surfaces
 *  the chip as disabled with an upsell tooltip. */
export const PRO_ONLY_VARIABLES: ReadonlySet<VariableKey> = new Set([
  'store_location',
]);

/**
 * ADMIN-ONLY DIVERGENCE: web derives `Locale` from `@/lib/locale`, its
 * next-intl config. Admin has no i18n runtime, so the supported-locale list
 * lives here — and is exported so runtime allowlists (design-preview) can be
 * driven off it rather than re-typing the languages, which is how a business
 * locale used to silently fall back to English. Adding a language here turns
 * every map below into a compile error until it is filled in.
 */
export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'pl'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Localized display names for each canonical variable. Purely a UI concern —
 * the backend only ever sees the canonical key. French users see
 * `{{tampons_max}}`, English users see `{{total_stamps}}`.
 */
export const VARIABLE_DISPLAY_NAMES: Record<Locale, Record<VariableKey, string>> = {
  en: {
    stamp_count: 'stamp_count',
    total_stamps: 'total_stamps',
    stamps_left: 'stamps_left',
    rewards_count: 'rewards_count',
    reward_name: 'reward_name',
    business_name: 'business_name',
    customer_first_name: 'customer_first_name',
    store_location: 'store_location',
    points_balance: 'points_balance',
    points_to_next: 'points_to_next',
    next_reward_points: 'next_reward_points',
    next_reward_name: 'next_reward_name',
    last_reward_name: 'last_reward_name',
    bonus_points: 'bonus_points',
    customer_birthday: 'customer_birthday',
  },
  fr: {
    stamp_count: 'tampons_actuels',
    total_stamps: 'tampons_max',
    stamps_left: 'tampons_restants',
    rewards_count: 'recompenses_en_attente',
    reward_name: 'nom_recompense',
    business_name: 'nom_entreprise',
    customer_first_name: 'prenom_client',
    store_location: 'lieu_magasin',
    points_balance: 'points_actuels',
    points_to_next: 'points_restants',
    next_reward_points: 'points_prochaine_recompense',
    next_reward_name: 'prochaine_recompense',
    last_reward_name: 'recompense_obtenue',
    bonus_points: 'points_bonus',
    customer_birthday: 'anniversaire_client',
  },
  es: {
    stamp_count: 'sellos_actuales',
    total_stamps: 'sellos_total',
    stamps_left: 'sellos_restantes',
    rewards_count: 'recompensas_pendientes',
    reward_name: 'nombre_recompensa',
    business_name: 'nombre_comercio',
    customer_first_name: 'nombre_cliente',
    store_location: 'lugar_establecimiento',
    points_balance: 'puntos_actuales',
    points_to_next: 'puntos_restantes',
    next_reward_points: 'puntos_siguiente_recompensa',
    next_reward_name: 'siguiente_recompensa',
    last_reward_name: 'recompensa_obtenida',
    bonus_points: 'puntos_extra',
    customer_birthday: 'cumpleanos_cliente',
  },
  // ASCII only: VARIABLE_PATTERN matches `\w`, which excludes Polish
  // diacritics, so a token carrying one would never match. Transliterated.
  pl: {
    stamp_count: 'pieczatki_aktualne',
    total_stamps: 'pieczatki_max',
    stamps_left: 'pieczatki_pozostale',
    rewards_count: 'nagrody_oczekujace',
    reward_name: 'nazwa_nagrody',
    business_name: 'nazwa_firmy',
    customer_first_name: 'imie_klienta',
    store_location: 'lokal',
    points_balance: 'punkty_aktualne',
    points_to_next: 'punkty_pozostale',
    next_reward_points: 'punkty_nastepnej_nagrody',
    next_reward_name: 'nastepna_nagroda',
    last_reward_name: 'zdobyta_nagroda',
    bonus_points: 'punkty_bonusowe',
    customer_birthday: 'urodziny_klienta',
  },
};

export function isKnownVariable(key: string): key is VariableKey {
  return (VARIABLE_KEYS as readonly string[]).includes(key);
}

/** The stamp-program variable set (order = display order). */
const STAMP_VARIABLE_KEYS: VariableKey[] = [
  'stamp_count',
  'total_stamps',
  'stamps_left',
  'rewards_count',
  'reward_name',
  'business_name',
  'customer_first_name',
];

/**
 * Which {{variables}} a surface should offer for the active program. Stamp
 * programs never see points variables and vice-versa — a points business used
 * to be offered stamp_count / total_stamps / stamps_left, which are meaningless
 * for it. For points the reward variable is type-of-ladder dependent: a single
 * reward exposes {{reward_name}} (the lone reward), a multi-reward ladder
 * exposes {{next_reward_name}} (the immediate objective) and hides reward_name.
 *
 * `includeStoreLocation` adds the Pro-only {{store_location}} chip (notification
 * surfaces show it, gated; pass fields strip it entirely so they omit it).
 *
 * `collectsBirthday` and `customFields` come from the business's own sign-up
 * form. They're appended last so the canonical chips keep their familiar
 * position, and only when the business actually asks for them — offering
 * {{customer_birthday}} to a business that never collects one would guarantee
 * an empty field on every pass.
 */
export function programVariableKeys(opts: {
  type: 'stamp' | 'points' | undefined;
  rewardCount?: number;
  includeStoreLocation?: boolean;
  collectsBirthday?: boolean;
  customFields?: CustomFieldVariable[];
}): TemplateVariableKey[] {
  const {
    type,
    rewardCount = 0,
    includeStoreLocation = false,
    collectsBirthday = false,
    customFields = [],
  } = opts;
  const keys: TemplateVariableKey[] =
    type === 'points'
      ? [
          'points_balance',
          'points_to_next',
          'next_reward_points',
          rewardCount > 1 ? 'next_reward_name' : 'reward_name',
          'business_name',
          'customer_first_name',
        ]
      : [...STAMP_VARIABLE_KEYS];
  if (includeStoreLocation) keys.push('store_location');
  if (collectsBirthday) keys.push('customer_birthday');
  keys.push(...customFields.map((f) => f.key));
  return keys;
}

/**
 * Trigger-aware variable set for the per-trigger notification editor.
 *
 * Multi-reward points ladders distinguish the reward the customer JUST won
 * from the one coming NEXT, so the two reward triggers differ:
 *  - `reward_earned` (a middle rung): "You earned {{last_reward_name}}! Next up
 *    is {{next_reward_name}}." Offers both names.
 *  - `reward_completed` (the top rung, no next): only {{last_reward_name}} — the
 *    backend auto-routes here so "next up" copy never renders blank.
 * Every other trigger, and every stamp / single-reward points program, keeps the
 * program-wide set from `programVariableKeys` (single reward → {{reward_name}}).
 */
export function triggerVariableKeys(opts: {
  type: 'stamp' | 'points' | undefined;
  rewardCount?: number;
  trigger?: string;
  includeStoreLocation?: boolean;
  collectsBirthday?: boolean;
  customFields?: CustomFieldVariable[];
}): TemplateVariableKey[] {
  const {
    type,
    rewardCount = 0,
    trigger,
    includeStoreLocation = false,
    collectsBirthday = false,
    customFields = [],
  } = opts;

  const isRewardTrigger = trigger === 'reward_earned' || trigger === 'reward_completed';
  if (type === 'points' && rewardCount > 1 && isRewardTrigger) {
    const keys: TemplateVariableKey[] = ['points_balance'];
    if (trigger === 'reward_earned') {
      keys.push('points_to_next', 'next_reward_points', 'next_reward_name', 'last_reward_name');
    } else {
      keys.push('last_reward_name');
    }
    keys.push('business_name', 'customer_first_name');
    if (includeStoreLocation) keys.push('store_location');
    if (collectsBirthday) keys.push('customer_birthday');
    keys.push(...customFields.map((f) => f.key));
    return keys;
  }

  return programVariableKeys({
    type,
    rewardCount,
    includeStoreLocation,
    collectsBirthday,
    customFields,
  });
}

/**
 * Return the UI-facing name for a variable key. Unknown keys fall back
 * to the key itself so custom/legacy placeholders still render readably.
 */
export function getVariableDisplayName(
  key: string,
  locale: Locale,
  customFields: CustomFieldVariable[] = []
): string {
  if (isKnownVariable(key)) {
    return VARIABLE_DISPLAY_NAMES[locale][key];
  }
  // A merchant-defined field reads best under the merchant's own label —
  // "Boisson préférée" rather than the derived `favorite_drink`.
  const custom = customFields.find((f) => f.key === key);
  if (custom?.label) return custom.label;
  return key;
}

/**
 * Preview values for a business's own sign-up fields.
 *
 * Deliberately previews the FALLBACK, not a made-up example: the fallback is
 * what a customer who predates the field actually sees on their card, so it's
 * the case a merchant most needs to eyeball. Fields without one fall back to
 * the label, which at least reads as a real word rather than `{{some_key}}`.
 */
export function customFieldSampleValues(
  customFields: CustomFieldVariable[]
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of customFields) {
    values[field.key] = field.fallback?.trim() || field.label;
  }
  return values;
}

/**
 * Insert `{{key}}` into `text` at the caret (replacing any selection), with
 * joining spaces only where the token would otherwise glue onto a word —
 * never before punctuation or after existing whitespace. Returns the new
 * text plus the caret position right after the inserted token so the caller
 * can restore focus there.
 */
export function insertVariableAtCursor(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  key: string
): { text: string; cursor: number } {
  const start = Math.max(0, Math.min(selectionStart, text.length));
  const end = Math.max(start, Math.min(selectionEnd, text.length));
  const before = text.slice(0, start);
  const after = text.slice(end);
  const wordly = /[\p{L}\p{N}]/u;
  const spaceBefore = before.length > 0 && wordly.test(before[before.length - 1]) ? ' ' : '';
  const spaceAfter = after.length > 0 && wordly.test(after[0]) ? ' ' : '';
  const token = `${spaceBefore}{{${key}}}${spaceAfter}`;
  return { text: before + token + after, cursor: start + token.length };
}

/** Extract the set of {{variable}} names referenced in a template string. */
export function extractVariables(template: string): Set<string> {
  const matches = template?.matchAll(VARIABLE_PATTERN) ?? [];
  const vars = new Set<string>();
  for (const match of matches) vars.add(match[1]);
  return vars;
}

/**
 * Placeholder values shown when a variable has no real data behind it yet
 * (a brand-new design, an unsaved program). Localized, because a French
 * merchant previewing their own card should not be shown English samples.
 *
 * The single source for every preview surface — do NOT copy this table.
 */
const SAMPLE_VALUES: Record<Locale, Record<VariableKey, string>> = {
  en: {
    stamp_count: '3',
    total_stamps: '10',
    stamps_left: '7',
    rewards_count: '1',
    reward_name: 'Free coffee',
    business_name: 'Your business',
    customer_first_name: 'Sarah',
    store_location: 'Westside',
    points_balance: '120',
    points_to_next: '80',
    next_reward_points: '200',
    next_reward_name: 'Free coffee',
    last_reward_name: 'Free coffee',
    bonus_points: '60',
    customer_birthday: 'March 14',
  },
  fr: {
    stamp_count: '3',
    total_stamps: '10',
    stamps_left: '7',
    rewards_count: '1',
    reward_name: 'Café offert',
    business_name: 'Votre entreprise',
    customer_first_name: 'Sarah',
    store_location: 'Westside',
    points_balance: '120',
    points_to_next: '80',
    next_reward_points: '200',
    next_reward_name: 'Café offert',
    last_reward_name: 'Café offert',
    bonus_points: '60',
    customer_birthday: '14 mars',
  },
  es: {
    stamp_count: '3',
    total_stamps: '10',
    stamps_left: '7',
    rewards_count: '1',
    reward_name: 'Café gratis',
    business_name: 'Tu comercio',
    customer_first_name: 'Sara',
    store_location: 'Centro',
    points_balance: '120',
    points_to_next: '80',
    next_reward_points: '200',
    next_reward_name: 'Café gratis',
    last_reward_name: 'Café gratis',
    bonus_points: '60',
    customer_birthday: '14 de marzo',
  },
  pl: {
    stamp_count: '3',
    total_stamps: '10',
    stamps_left: '7',
    rewards_count: '1',
    reward_name: 'Darmowa kawa',
    business_name: 'Twoja firma',
    customer_first_name: 'Zofia',
    store_location: 'Centrum',
    points_balance: '120',
    points_to_next: '80',
    next_reward_points: '200',
    next_reward_name: 'Darmowa kawa',
    last_reward_name: 'Darmowa kawa',
    bonus_points: '60',
    customer_birthday: '14 marca',
  },
};

/** Placeholder values for every canonical variable, in `locale`. */
export function sampleValues(locale: Locale = 'en'): Record<VariableKey, string> {
  return SAMPLE_VALUES[locale] ?? SAMPLE_VALUES.en;
}

/**
 * ADMIN-ONLY ADDITION (ported from showcase/lib/template-variables.ts).
 *
 * In web/, `{{customer_first_name}}` previews as the signed-in merchant's own
 * first name. Admin has no such anchor and shows hundreds of cards side by
 * side, where the flat sample "Sarah" on every tile reads like a rendering
 * bug. Seeding on the business id gives each card a stable, believable
 * cardholder — stable being the point: an unseeded random name would differ
 * between server and client render and trip a hydration mismatch.
 */
const SAMPLE_FIRST_NAMES: Record<Locale, string[]> = {
  en: ['Sarah', 'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan'],
  fr: ['Jeanne', 'Louis', 'Emma', 'Hugo', 'Camille', 'Léa', 'Nathan', 'Chloé'],
  es: ['Lucía', 'Mateo', 'Sofía', 'Diego', 'Valentina', 'Hugo', 'Martina', 'Pablo'],
  pl: ['Zofia', 'Jakub', 'Julia', 'Antoni', 'Maja', 'Szymon', 'Lena', 'Filip'],
};

/** Deterministic FNV-style hash so a given seed always maps to the same name. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Pick a stable sample cardholder name for `locale`, varied by `seed`. */
export function pickSampleName(locale: Locale, seed: string): string {
  const pool = SAMPLE_FIRST_NAMES[locale] ?? SAMPLE_FIRST_NAMES.en;
  if (!seed) return pool[0];
  return pool[hashSeed(seed) % pool.length];
}

/**
 * The copy a points card falls back to once the customer has cleared every
 * reward tier and there is no next reward left to talk about. Must stay
 * byte-identical to the backend's `points_all_rewards_ready` system string
 * (backend/app/services/localization.py) — this previews that exact value, it
 * is not UI chrome, so it is a const map keyed by the BUSINESS locale rather
 * than an i18n message keyed by the dashboard language.
 */
export const POINTS_ALL_REWARDS_READY: Record<Locale, string> = {
  fr: 'Carte complétée',
  en: 'Card completed',
  es: 'Tarjeta completada',
  pl: 'Karta ukończona',
};

/**
 * Variables that only mean something while a next reward exists. A field
 * referencing any of them is a "next reward" field: once the ladder is cleared
 * the WHOLE line is swapped for the field's completed copy, because patching
 * the variable alone leaves "Encore 0 points !" or a sentence that trails off.
 * Mirrors NEXT_REWARD_VARS in the backend field_renderer.
 */
export const NEXT_REWARD_VARS: VariableKey[] = [
  'next_reward_name',
  'next_reward_points',
  'points_to_next',
];

const NEXT_REWARD_PATTERN = new RegExp(`\\{\\{(?:${NEXT_REWARD_VARS.join('|')})\\}\\}`);

/** True when the copy talks about a reward the customer has yet to reach. */
export function referencesNextReward(text: string | null | undefined): boolean {
  return !!text && NEXT_REWARD_PATTERN.test(text);
}

/**
 * Reserved key carrying renderer state through the values record, mirroring
 * the backend context. Not a merchant variable.
 */
export const CLEARED_KEY = '_points_ladder_cleared';

/**
 * Resolve the points {{variables}} for a card preview, mirroring the backend's
 * `build_field_context` (backend/app/services/wallets/field_renderer.py) so the
 * preview shows exactly what lands on the customer's pass.
 *
 * Every key it owns is returned unconditionally — an ABSENT key would let
 * `renderSamplePreview` fall through to the generic sample, which is how a
 * maxed-out points card used to advertise a "Free coffee" the merchant never
 * offered and could not edit (it was a placeholder, not their data).
 */
export function pointsVariableValues(opts: {
  rewards: { threshold: number; name: string }[];
  balance: number;
  locale: Locale;
}): Record<string, string> {
  const { rewards, balance } = opts;
  const sorted = [...rewards].sort((a, b) => a.threshold - b.threshold);
  // Strictly `>`: landing exactly on a threshold means that tier is reached.
  const next = sorted.find((r) => r.threshold > balance) ?? null;
  const cleared = !next && sorted.length > 0;

  const values: Record<string, string> = {
    points_balance: String(balance),
    // These stay honest about there being no next reward; the completed state
    // is handled per FIELD by resolveFieldValue.
    points_to_next: String(next ? Math.max(0, next.threshold - balance) : 0),
    next_reward_points: next ? String(next.threshold) : '',
    next_reward_name: next ? next.name : '',
    [CLEARED_KEY]: cleared ? '1' : '',
  };

  // A one-rung ladder is offered {{reward_name}} instead of next_reward_name
  // (see programVariableKeys). Points programs leave the legacy reward_name
  // column NULL, so it has to come from the lone reward.
  if (sorted.length === 1) values.reward_name = sorted[0].name;

  return values;
}

/**
 * The preview text for one design field, or null when the field would not be
 * on this customer's pass at all. Mirrors `resolve_field_value` in the backend
 * so the editor preview and the real wallet card can never disagree.
 */
export function resolveFieldValue(
  field: { value?: string | null; value_completed?: string | null },
  values: Record<string, string>,
  locale: Locale = 'en'
): string | null {
  const raw = field.value ?? '';
  let text = raw;
  if (values[CLEARED_KEY] && referencesNextReward(raw)) {
    // Absent (a design saved before this existed) → the system default;
    // set-but-empty → the merchant chose to hide the field in this state.
    const completed = field.value_completed;
    text = completed === null || completed === undefined ? POINTS_ALL_REWARDS_READY[locale] : completed;
  }
  return renderSamplePreview(text, values, locale).trim() || null;
}

/**
 * Render a template with sample values for preview.
 * Substitutes each `{{var}}` with real data when the caller has it, and a
 * localized example otherwise.
 */
export function renderSamplePreview(
  template: string,
  overrides: Record<string, string> = {},
  locale: Locale = 'en'
): string {
  const values: Record<string, string> = { ...sampleValues(locale), ...overrides };
  return template.replace(VARIABLE_PATTERN, (_match, key: string) => {
    return values[key] ?? `{{${key}}}`;
  });
}
