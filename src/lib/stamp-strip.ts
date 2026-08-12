import type { StampIconMode } from "@/types/design";

/**
 * Preview opacity for the strip background image: image_only shows the raw
 * image edge-to-edge at full opacity; other modes dim it to the stored
 * percentage (backend default 40). Mirrors build_strip_config_from_design.
 *
 * Ported from web/src/lib/stamp-strip.ts — admin only reads designs, so the
 * picker helpers (`boxFromMode` / `modeForBox`) that live alongside it there
 * are deliberately not carried over.
 */
export function stampStripImageOpacity(design: {
  stamp_icon_mode?: StampIconMode;
  strip_background_opacity?: number;
}): number {
  if (design.stamp_icon_mode === "image_only") return 1;
  return (design.strip_background_opacity ?? 40) / 100;
}
