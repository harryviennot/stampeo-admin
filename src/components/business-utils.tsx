import { Badge } from "@/components/ui/badge";

export function BusinessInitials({ name, color }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
      style={{ backgroundColor: color || "#6366f1" }}
    >
      {initials}
    </div>
  );
}

export function PlanBadge({ tier }: { tier: string }) {
  const variant = tier === "pro" ? "default" : "outline";
  const className =
    tier === "pro"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : "bg-secondary text-secondary-foreground";
  return (
    <Badge variant={variant} className={className}>
      {tier}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
    active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    suspended: { label: "Suspended", className: "bg-red-50 text-red-700 border-red-200" },
  };
  const { label, className } = map[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
