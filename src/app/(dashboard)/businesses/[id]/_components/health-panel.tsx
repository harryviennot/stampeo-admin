"use client";

import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useBusinessHealth } from "@/hooks/use-businesses";
import type { AdminHealthCheck } from "@/lib/api";
import { cn } from "@/lib/utils";

const TONE: Record<
  AdminHealthCheck["level"],
  { chip: string; Icon: typeof AlertTriangle }
> = {
  error: {
    chip: "border-red-200 bg-red-50 text-red-700",
    Icon: XCircle,
  },
  warn: {
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: AlertTriangle,
  },
  ok: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: CheckCircle2,
  },
};

function Chip({ check }: { check: AdminHealthCheck }) {
  const { chip, Icon } = TONE[check.level];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        chip
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="font-medium">{check.label}</div>
        {check.detail && (
          <div className="text-xs opacity-80">{check.detail}</div>
        )}
      </div>
    </div>
  );
}

/**
 * The derived answer to "what is wrong with this account?".
 *
 * Every rule lives server-side in `build_health_checks` so it is unit-tested in
 * one place; this only renders. The endpoint returns every check including the
 * passing ones -- we show the problems, and collapse a clean bill of health
 * into a single green line rather than nine.
 */
export function HealthPanel({ businessId }: { businessId: string }) {
  const { data, isPending, isError } = useBusinessHealth(businessId);

  if (isPending) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Running health checks…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Health checks could not be loaded.
      </div>
    );
  }

  const problems = data.items.filter((c) => c.level !== "ok");

  if (problems.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-medium">No issues detected.</span>{" "}
          <span className="opacity-80">
            All {data.items.length} checks pass.
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {/* Errors first: a missing certificate outranks a quiet offline queue. */}
      {problems
        .slice()
        .sort((a, b) => (a.level === "error" ? -1 : b.level === "error" ? 1 : 0))
        .map((check) => (
          <Chip key={check.key} check={check} />
        ))}
    </div>
  );
}
