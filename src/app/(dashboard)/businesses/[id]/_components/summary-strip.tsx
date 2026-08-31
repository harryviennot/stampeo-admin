"use client";

import Link from "next/link";
import {
  Building2,
  Clock,
  CircleDot,
  Coins,
  CreditCard,
  Languages,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBusinessStats } from "@/hooks/use-businesses";
import type { Business } from "@/lib/api";
import {
  countryLabel,
  localeLabel,
  relativeTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function Fact({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string | null;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-medium">
        {value ?? <span className="text-muted-foreground">—</span>}
      </div>
      {hint && (
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      )}
    </>
  );

  return (
    <div className="min-w-0">
      {href ? (
        <Link href={href} className="block hover:underline">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

/**
 * The facts worth knowing before opening any tab, on every tab.
 *
 * Deliberately mixes configuration (what they run, in what language) with
 * live numbers (are they actually using it) -- that pairing is what makes a
 * support ticket legible in one glance.
 */
export function SummaryStrip({ business }: { business: Business }) {
  const { data: stats } = useBusinessStats(business.id);

  const isPoints = business.loyalty_type === "points";
  const country = countryLabel(business.country_code, business.country);
  const locale = localeLabel(business.primary_locale);

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 sm:grid-cols-3 lg:grid-cols-6">
        <Fact
          icon={isPoints ? <Coins /> : <CircleDot />}
          label={
            business.loyalty_type
              ? `${business.loyalty_type[0].toUpperCase()}${business.loyalty_type.slice(1)} program`
              : "Program"
          }
          value={business.program_summary ?? "No program"}
        />
        <Fact
          icon={<Languages />}
          label="Primary locale"
          value={locale}
          hint={country}
        />
        <Fact
          icon={<Users />}
          label="Customers"
          value={stats ? stats.total_customers.toLocaleString() : "…"}
          hint={
            stats ? `+${stats.customers_current_30d} in 30d` : undefined
          }
        />
        <Fact
          icon={<CircleDot />}
          label="Scans"
          value={stats ? stats.total_scans.toLocaleString() : "…"}
          hint={stats ? `${stats.scans_current_30d} in 30d` : undefined}
        />
        <Fact
          icon={<CreditCard />}
          label="Plan"
          value={
            <span className="capitalize">
              {business.subscription_tier}
              {business.is_founding_partner && (
                <span className="ml-1 text-xs font-normal text-violet-600">
                  founding
                </span>
              )}
            </span>
          }
          hint={business.billing_status}
        />
        <Fact
          icon={<ShieldCheck />}
          label="Certificate"
          value={
            business.certificate ? (
              <span
                className={cn(
                  "font-mono text-xs",
                  business.certificate.status !== "assigned" && "text-red-600"
                )}
              >
                {business.certificate.identifier}
              </span>
            ) : (
              <span className="text-red-600">None</span>
            )
          }
          hint={business.certificate?.status}
        />
        <Fact
          icon={<Building2 />}
          label="Owner"
          value={business.owner_name}
          hint={business.owner_email}
          href={business.owner_id ? `/users/${business.owner_id}` : undefined}
        />
        <Fact
          icon={<MapPin />}
          label="Locations"
          value={business.locations_count_actual ?? 0}
          // The survey answer the owner typed at signup, which is a claim
          // rather than a fact -- worth seeing next to the real count.
          hint={
            business.locations_count
              ? `said "${business.locations_count}" at signup`
              : undefined
          }
        />
        <Fact
          icon={<Users />}
          label="Team"
          value={business.members_count ?? 0}
        />
        <Fact
          icon={<CircleDot />}
          label="Designs"
          value={business.designs_count ?? 0}
          hint={business.active_design_id ? "1 active" : "none active"}
        />
        <Fact
          icon={<Clock />}
          label="Timezone"
          value={business.timezone}
          hint={business.activated_at ? `active ${relativeTime(business.activated_at)}` : "not activated"}
        />
      </CardContent>
    </Card>
  );
}
