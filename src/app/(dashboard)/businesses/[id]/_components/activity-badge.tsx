"use client";

import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTimeseries } from "@/hooks/use-stats";

export function ActivityBadge({ businessId }: { businessId: string }) {
  const { data, isPending } = useTimeseries({
    bucket: "week",
    range: "12w",
    business_id: businessId,
  });

  if (isPending || !data) return null;
  const buckets = data.buckets;
  if (buckets.length === 0) return null;

  const now = Date.now();
  const lastWithActivity = [...buckets]
    .reverse()
    .find((b) => b.stamps_added > 0 || b.redemptions > 0);

  if (!lastWithActivity) {
    return (
      <Badge
        tone="red"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label="No activity yet"
      />
    );
  }

  const lastMs = new Date(lastWithActivity.period_start).getTime();
  const days = Math.floor((now - lastMs) / (24 * 60 * 60 * 1000));

  if (days >= 14) {
    return (
      <Badge
        tone="red"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label={`Inactive ${days}d`}
      />
    );
  }
  if (days >= 7) {
    return (
      <Badge
        tone="amber"
        icon={<Activity className="h-3.5 w-3.5" />}
        label={`Slowing (${days}d)`}
      />
    );
  }
  return (
    <Badge
      tone="emerald"
      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
      label="Healthy"
    />
  );
}

function Badge({
  tone,
  icon,
  label,
}: {
  tone: "red" | "amber" | "emerald";
  icon: React.ReactNode;
  label: string;
}) {
  const cls =
    tone === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}
