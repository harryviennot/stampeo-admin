"use client";

import { cn } from "@/lib/utils";

/**
 * A label-over-value pair. The unit every read-only detail panel is built from.
 *
 * Previously copy-pasted into the business tabs and the user detail page (and
 * again as `ReclaimRow`); hoisted so the four surfaces cannot drift apart.
 */
export function InfoRow({
  label,
  value,
  mono,
  className,
  span,
}: {
  label: string;
  value: React.ReactNode;
  /** Render the value in a monospace face -- ids, slugs, identifiers. */
  mono?: boolean;
  className?: string;
  /** Let a long value take the full width of a two-column grid. */
  span?: boolean;
}) {
  return (
    <div className={cn(span && "col-span-full", className)}>
      <div className="mb-0.5 text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-medium", mono && "font-mono text-xs")}>
        {/* An explicit dash beats a missing row: "we hold nothing here" and
            "this panel forgot to render" must not look the same. */}
        {value === null || value === undefined || value === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

/** A definition grid. Two columns on phones, four once there is room. */
export function InfoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}
