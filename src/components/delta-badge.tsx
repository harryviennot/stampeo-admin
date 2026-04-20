"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeltaBadgeProps {
  /** Signed percentage delta, or null if unknown */
  deltaPct: number | null | undefined;
  /** Optional suffix, e.g. "vs last week" */
  label?: string;
  className?: string;
}

export function DeltaBadge({ deltaPct, label, className }: DeltaBadgeProps) {
  if (deltaPct === null || deltaPct === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className
        )}
      >
        <ArrowRight className="h-3 w-3" />
        <span>—</span>
        {label && <span>{label}</span>}
      </span>
    );
  }

  const up = deltaPct > 0;
  const flat = deltaPct === 0;
  const color = flat
    ? "text-muted-foreground"
    : up
      ? "text-emerald-600"
      : "text-red-600";
  const Icon = flat ? ArrowRight : up ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", color, className)}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium">
        {up ? "+" : ""}
        {deltaPct}%
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}
