"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BusinessInitials,
  BillingStatusBadge,
  FoundingPartnerBadge,
  PlanBadge,
  ResellerBadge,
  StatusBadge,
} from "@/components/business-utils";
import { BusinessRowActions } from "../../_components/row-actions";
import type { Business } from "@/lib/api";

/**
 * Identity, state at a glance, and the superadmin actions.
 *
 * The actions are the SAME component the businesses list uses. They used to be
 * five conditional buttons duplicated here, which both crowded the header and
 * gave the two surfaces separate copies of "which action applies when" -- the
 * decision now lives once in `availableBusinessActions()`.
 */
export function BusinessHeader({ business }: { business: Business }) {
  const router = useRouter();

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => router.push("/businesses")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Businesses
      </Button>

      {/* Wraps on phones: keeping the actions inline squeezed the name and
          badges into ~120px, so every badge landed on its own line. */}
      <div className="flex flex-wrap items-start gap-3 sm:gap-4">
        {business.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={business.logo_url}
            alt={business.name}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <BusinessInitials
            name={business.name}
            color={business.settings?.accentColor}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {business.name}
            </h1>
            <StatusBadge status={business.status} />
            <PlanBadge tier={business.subscription_tier} />
            <BillingStatusBadge status={business.billing_status} />
            {business.is_founding_partner && <FoundingPartnerBadge />}
            {business.owner_is_reseller && <ResellerBadge />}
            {business.loyalty_type && (
              <Badge variant="outline" className="capitalize">
                {business.loyalty_type}
              </Badge>
            )}
            {business.requires_card_upfront === false && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                no-card trial
              </Badge>
            )}
          </div>
          <div className="mt-0.5 font-mono text-sm text-muted-foreground">
            /{business.url_slug}
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
          <Button asChild size="sm" variant="outline">
            <Link href={`/businesses/${business.id}/access-sessions`}>
              <History className="mr-1 h-3.5 w-3.5" />
              Access log
            </Link>
          </Button>
          <BusinessRowActions business={business} />
        </div>
      </div>
    </div>
  );
}
