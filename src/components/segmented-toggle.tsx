"use client";

import { cn } from "@/lib/utils";

interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

/** Compact segmented control for switching chart modes (e.g. weekly/daily). */
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedToggleOption<T>[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border bg-muted/40 p-0.5",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
