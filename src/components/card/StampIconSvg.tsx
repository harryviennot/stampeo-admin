"use client";

import {
  Check,
  Coffee,
  Star,
  Heart,
  Gift,
  ThumbsUp,
  Sparkle,
  Trophy,
  Crown,
  Lightning,
  Fire,
  Sun,
  Leaf,
  Flower,
  Diamond,
  Smiley,
  MusicNote,
  PawPrint,
  Scissors,
  ForkKnife,
  ShoppingBag,
  Percent,
} from "@phosphor-icons/react";
import type { ComponentType, SVGProps } from "react";

export type StampIconType =
  | "checkmark"
  | "coffee"
  | "star"
  | "heart"
  | "gift"
  | "thumbsup"
  | "sparkle"
  | "trophy"
  | "crown"
  | "lightning"
  | "fire"
  | "sun"
  | "leaf"
  | "flower"
  | "diamond"
  | "smiley"
  | "music"
  | "paw"
  | "scissors"
  | "food"
  | "shopping"
  | "percent";

type PhosphorIcon = ComponentType<
  SVGProps<SVGSVGElement> & {
    weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  }
>;

const iconMap: Record<StampIconType, PhosphorIcon> = {
  checkmark: Check,
  coffee: Coffee,
  star: Star,
  heart: Heart,
  gift: Gift,
  thumbsup: ThumbsUp,
  sparkle: Sparkle,
  trophy: Trophy,
  crown: Crown,
  lightning: Lightning,
  fire: Fire,
  sun: Sun,
  leaf: Leaf,
  flower: Flower,
  diamond: Diamond,
  smiley: Smiley,
  music: MusicNote,
  paw: PawPrint,
  scissors: Scissors,
  food: ForkKnife,
  shopping: ShoppingBag,
  percent: Percent,
};

interface StampIconSvgProps {
  readonly icon: StampIconType;
  readonly className?: string;
  readonly color?: string;
}

export function StampIconSvg({
  icon,
  className = "w-4 h-4",
  color,
}: StampIconSvgProps) {
  const Icon = iconMap[icon] || Check;
  const weight = icon === "checkmark" ? "bold" : "fill";
  return (
    <Icon
      className={className}
      weight={weight}
      style={color ? { color } : undefined}
    />
  );
}
