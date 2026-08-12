/**
 * Card-design types for the admin panel.
 *
 * Mirrors `web/src/types/design.ts` (and, upstream of both, the backend's
 * `CardDesignResponse` in app/domain/schemas.py). Admin only ever READS
 * designs, so the Create/Update shapes from web are deliberately omitted.
 *
 * Keep this in step with web's copy — `admin/src/components/card/WalletCard.tsx`
 * is a port of web's, and a missing field here silently renders a blank card.
 */

export interface PassField {
  key: string;
  label: string;
  value: string;
  /**
   * Shown INSTEAD of `value` once a points customer has cleared every reward
   * tier, for fields that talk about the next reward ({{next_reward_name}},
   * {{next_reward_points}}, {{points_to_next}}). Undefined/null = use the
   * localized default; "" = hide the field in that state.
   * Mirrors PassField.value_completed in the backend schema.
   */
  value_completed?: string | null;
}

export interface DesignTranslation {
  organization_name?: string;
  description?: string;
  logo_text?: string;
  secondary_fields?: PassField[];
  auxiliary_fields?: PassField[];
  back_fields?: PassField[];
}

/**
 * A merchant-uploaded icon with its server-derived variants (mirrors the
 * backend ProcessedIconAsset). The preview renders these URLs verbatim, which
 * guarantees parity with the generated strip images.
 */
export interface ProcessedIconAsset {
  id: string;
  original_url: string;
  processed_url: string;
  greyscale_url: string;
  outline_url: string;
  bg_removed: boolean;
}

export type CustomStampEmptyMode = "greyscale" | "outline" | "custom";
export type CustomStampArrangement = "straight" | "staggered" | "overlap";

/**
 * Custom stamp icon configuration (mirrors backend CustomStampConfig).
 * `icons` is the ordered rotation list: stamp slot i renders icons[i % n];
 * the last slot uses reward_icon when set.
 */
export interface CustomStampConfig {
  icons: ProcessedIconAsset[];
  reward_icon?: ProcessedIconAsset | null;
  empty_icon?: ProcessedIconAsset | null;
  empty_mode: CustomStampEmptyMode;
  arrangement: CustomStampArrangement;
  /** Opacity (percent, 10-100) applied to empty slots at render time. */
  empty_opacity?: number;
}

/** How the stamp strip renders (migration 138): preset icons, custom uploaded
 *  icons, or "image_only" — just the uploaded strip image, no stamps drawn. */
export type StampIconMode = "preset" | "custom" | "image_only";

export type CardType = "stamp" | "points";

/** The points strip layouts the backend renders (migrations 123, 135).
 *  "image_only" shows just the uploaded strip image with no points overlay. */
export type PointsStripStyle =
  | "big_point"
  | "circle_progress"
  | "progress_icons"
  | "image_only";

/**
 * A reward's chosen icon for the `progress_icons` points strip. `preset` ref is
 * an icon name from the shared icon set; `custom` ref is an uploaded
 * ProcessedIconAsset id. Keyed by reward id in `points_reward_icons`.
 */
export interface PointsRewardIcon {
  type: "preset" | "custom";
  ref: string;
}

export type PointsRewardIcons = Record<string, PointsRewardIcon>;

/** One rung of a points program's reward ladder (web/src/types/program.ts). */
export interface RewardTier {
  id: string;
  threshold: number;
  name: string;
}

export interface CardDesign {
  id: string;
  name: string;
  is_active: boolean;

  // Text
  organization_name: string;
  description: string;
  logo_text?: string;

  // Colors
  foreground_color: string;
  background_color: string;
  label_color: string;

  // Stamp config
  total_stamps: number;
  stamp_filled_color: string;
  stamp_empty_color: string;
  stamp_border_color: string;
  stamp_icon?: string;
  reward_icon?: string;
  icon_color?: string;

  // Custom stamp icons (STA-216)
  card_type?: CardType;
  stamp_icon_mode?: StampIconMode;
  custom_stamp_config?: CustomStampConfig | null;

  // Points card design (migration 123). Only meaningful when card_type === 'points'.
  points_strip_style?: PointsStripStyle;
  progress_accent_color?: string;
  points_reward_icons?: PointsRewardIcons;

  // Program-derived context. Populated by the public active-design route and
  // by GET /admin/card-designs, so a preview can resolve {{reward_name}} and
  // render the points strip without a second round-trip.
  reward_name?: string | null;
  initial_stamps?: number;
  points_rewards?: RewardTier[];

  // Asset URLs
  logo_url?: string;
  custom_filled_stamp_url?: string;
  custom_empty_stamp_url?: string;
  strip_background_url?: string;
  /** Solid strip canvas color when no strip image is uploaded. Falls back to
   *  background_color server-side when unset. Used by the points strip. */
  strip_background_color?: string;
  strip_background_opacity?: number;

  // Pass fields
  secondary_fields: PassField[];
  auxiliary_fields: PassField[];
  back_fields: PassField[];

  // Business info visibility
  hidden_business_info_keys?: string[];

  // Translations
  translations?: Record<string, DesignTranslation>;

  /** Strip image generation status. `regenerating` while the backend rebuilds
   *  strip PNGs after a stamp/color/icon change. */
  strip_status?: "ready" | "regenerating";

  created_at?: string;
  updated_at?: string;

  /** True if this design exceeds the tier's limit after a downgrade. */
  is_over_limit?: boolean;
}
