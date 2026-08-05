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

export function ResellerBadge() {
  return (
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
      Reseller
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

export function BillingStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string }> = {
    pending_checkout: {
      label: "Pending checkout",
      className: "bg-violet-50 text-violet-700 border-violet-200",
    },
    trial: { label: "Trial", className: "bg-sky-50 text-sky-700 border-sky-200" },
    active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    grace: { label: "Grace", className: "bg-amber-50 text-amber-700 border-amber-200" },
    past_due: { label: "Past due", className: "bg-orange-50 text-orange-700 border-orange-200" },
    suspended: { label: "Suspended", className: "bg-red-50 text-red-700 border-red-200" },
    cancelled: { label: "Cancelled", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  };
  const { label, className } = map[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export function FoundingPartnerBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-violet-50 text-violet-700 border-violet-200"
    >
      Founding partner
    </Badge>
  );
}

/**
 * Which pricing regime a business is on. Founding partners are grandfathered at
 * 50% off Starter/Growth with no expiry; everyone else pays public rates. The
 * program closed 2026-08-04, so this is effectively "joined before or after".
 */
export function PricingRegimeBadge({ isFounding }: { isFounding: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isFounding
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-secondary text-muted-foreground"
      }
      title={
        isFounding
          ? "Founding partner: 50% off Starter and Growth, grandfathered with no expiry"
          : "Standard pricing: signed up after the founding program closed"
      }
    >
      {isFounding ? "Founding" : "Standard"}
    </Badge>
  );
}
