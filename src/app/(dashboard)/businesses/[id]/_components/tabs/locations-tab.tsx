"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import { SegmentedToggle } from "@/components/segmented-toggle";
import { useBusinessLocations } from "@/hooks/use-businesses";
import type { AdminLocation } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

function LocationCard({ location }: { location: AdminLocation }) {
  const stats = location.stats;
  const components = location.address_components as {
    city?: string;
    postal_code?: string;
    country?: string;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          {location.name}
          {location.is_primary && (
            <Badge
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700"
            >
              primary
            </Badge>
          )}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            /{location.slug}
          </code>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoGrid>
          <InfoRow label="Address" value={location.address} span />
          <InfoRow
            label="City"
            value={
              [components?.postal_code, components?.city]
                .filter(Boolean)
                .join(" ") || null
            }
          />
          <InfoRow label="Country" value={components?.country} />
          <InfoRow
            label="Geofence"
            value={
              location.latitude != null && location.longitude != null
                ? `${location.radius_meters ?? "—"} m radius`
                : "No coordinates"
            }
          />
          <InfoRow
            label="Coordinates"
            value={
              location.latitude != null && location.longitude != null
                ? `${location.latitude}, ${location.longitude}`
                : null
            }
            mono
          />
          <InfoRow
            label="Wallet message"
            value={
              location.wallet_message
                ? Object.entries(location.wallet_message)
                    .map(([locale, text]) => `${locale}: ${text}`)
                    .join(" · ")
                : "None"
            }
            span
          />
        </InfoGrid>

        {stats && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Activity
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-normal normal-case tracking-normal",
                  stats.last_activity_at
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {stats.last_activity_at
                  ? `last scan ${relativeTime(stats.last_activity_at)}`
                  : "quiet in this window"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <InfoRow label="Scans" value={stats.scans_added} />
              <InfoRow label="Rewards" value={stats.rewards_redeemed} />
              <InfoRow label="Voided" value={stats.scans_voided} />
              <InfoRow label="Transactions" value={stats.total_transactions} />
              <InfoRow label="Unique customers" value={stats.unique_customers} />
              <InfoRow
                label="Enrolled here"
                value={stats.enrolled_here_total}
              />
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Assigned scanners ({location.assigned_members.length})
          </div>
          {location.assigned_members.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              None assigned. Owners and admins reach every location by design,
              so this does not mean nobody can scan here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {location.assigned_members.map((member) => (
                <Badge key={member.membership_id} variant="outline">
                  {member.name ?? member.email ?? member.user_id}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LocationsTab({ businessId }: { businessId: string }) {
  const [range, setRange] = useState("30d");
  const { data, isPending, isError } = useBusinessLocations(businessId, range);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load locations"
        description="The request failed. Try refreshing."
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="h-6 w-6" />}
        title="No locations"
        description="This business runs without multi-location. Scans are not attributed to a place."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {data.items.length} active location
          {data.items.length === 1 ? "" : "s"}
        </span>
        <SegmentedToggle
          value={range}
          onChange={setRange}
          options={RANGES}
        />
      </div>
      {data.items.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
}
