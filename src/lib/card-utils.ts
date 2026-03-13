import { CardDesign } from "@/types/design";
import { rgbToHex } from "@/lib/color-utils";

export { rgbToHex } from "@/lib/color-utils";

// ============================================================================
// Color Utilities
// ============================================================================

export function isLightColor(color: string): boolean {
  if (!color) return false;

  let r = 0,
    g = 0,
    b = 0;

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (color.startsWith("rgb")) {
    const match = color.match(/\d+/g);
    if (match) {
      [r, g, b] = match.map(Number);
    } else {
      return false;
    }
  } else {
    return false;
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function adjustBrightness(color: string, percent: number): string {
  const hex = rgbToHex(color);
  if (!hex?.startsWith("#")) return hex;

  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return "YB";
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ============================================================================
// Stamp Layout Utilities
// ============================================================================

export function getRowDistribution(totalStamps: number): number[] {
  if (totalStamps <= 0) return [0];
  if (totalStamps <= 6) return [totalStamps];

  if (totalStamps <= 16) {
    const topRow = Math.ceil(totalStamps / 2);
    const bottomRow = totalStamps - topRow;
    return [topRow, bottomRow];
  }

  const distributionMap: Record<number, number[]> = {
    17: [6, 6, 5],
    18: [6, 6, 6],
    19: [7, 7, 5],
    20: [7, 7, 6],
    21: [7, 7, 7],
    22: [8, 8, 6],
    23: [8, 8, 7],
    24: [8, 8, 8],
  };
  return distributionMap[totalStamps] || [8, 8, 8];
}

export interface StampPosition {
  centerX: number;
  centerY: number;
  radius: number;
  row: number;
  indexInRow: number;
  globalIndex: number;
}

export interface StampLayout {
  positions: StampPosition[];
  diameter: number;
  radius: number;
  rows: number;
  distribution: number[];
}

export function calculateStampLayout(
  totalStamps: number,
  containerWidth: number,
  containerHeight: number,
  minPadding: number = 8,
  sidePadding: number = 11
): StampLayout {
  const distribution = getRowDistribution(totalStamps);
  const rows = distribution.length;
  const maxInRow = Math.max(...distribution);

  const availableWidth = containerWidth - 2 * sidePadding;
  const maxDiameterByWidth =
    (availableWidth - (maxInRow - 1) * minPadding) / maxInRow;

  const maxDiameterByHeight =
    (containerHeight - (rows + 1) * minPadding) / rows;

  const diameter = Math.min(maxDiameterByWidth, maxDiameterByHeight);
  const radius = diameter / 2;

  const totalVerticalSpace = containerHeight - rows * diameter;
  const verticalPadding = totalVerticalSpace / (rows + 1);

  const positions: StampPosition[] = [];

  let globalIndex = 0;
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const circlesInRow = distribution[rowIndex];

    const rowContentWidth =
      circlesInRow * diameter + (circlesInRow - 1) * minPadding;
    const rowSidePadding = (containerWidth - rowContentWidth) / 2;

    const y = verticalPadding * (rowIndex + 1) + diameter * rowIndex + radius;

    for (let i = 0; i < circlesInRow; i++) {
      const x = rowSidePadding + radius + i * (diameter + minPadding);
      positions.push({
        centerX: x,
        centerY: y,
        radius,
        row: rowIndex,
        indexInRow: i,
        globalIndex,
      });
      globalIndex++;
    }
  }

  return {
    positions,
    diameter,
    radius,
    rows,
    distribution,
  };
}

// ============================================================================
// Card Color Scheme
// ============================================================================

export interface CardColorScheme {
  bgHex: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  accentHex: string;
  iconColorHex: string;
  textColor: string;
  mutedTextColor: string;
  emptyStampBg: string;
  emptyStampBorder: string;
  isLightBg: boolean;
}

export function computeCardColors(
  design: Partial<CardDesign>
): CardColorScheme {
  const backgroundColor = design.background_color ?? "rgb(28, 28, 30)";
  const accentColor = design.stamp_filled_color ?? "rgb(249, 115, 22)";
  const iconColor = design.icon_color ?? "rgb(255, 255, 255)";

  const bgHex = rgbToHex(backgroundColor);
  const accentHex = rgbToHex(accentColor);
  const iconColorHex = rgbToHex(iconColor);

  const bgGradientFrom = adjustBrightness(bgHex, 15);
  const bgGradientTo = adjustBrightness(bgHex, -10);

  const isLightBg = isLightColor(bgHex);

  const autoTextColor = isLightBg ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,1)";
  const autoMutedColor = isLightBg
    ? "rgba(0,0,0,0.5)"
    : "rgba(255,255,255,0.5)";

  const textColor = design.foreground_color
    ? rgbToHex(design.foreground_color)
    : autoTextColor;
  const mutedTextColor = design.label_color
    ? rgbToHex(design.label_color)
    : autoMutedColor;

  const autoEmptyBg = isLightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";
  const autoEmptyBorder = isLightBg
    ? "rgba(0,0,0,0.2)"
    : "rgba(255,255,255,0.2)";
  const emptyStampBg = design.stamp_empty_color
    ? rgbToHex(design.stamp_empty_color)
    : autoEmptyBg;
  const emptyStampBorder = design.stamp_border_color
    ? rgbToHex(design.stamp_border_color)
    : autoEmptyBorder;

  return {
    bgHex,
    bgGradientFrom,
    bgGradientTo,
    accentHex,
    iconColorHex,
    textColor,
    mutedTextColor,
    emptyStampBg,
    emptyStampBorder,
    isLightBg,
  };
}
