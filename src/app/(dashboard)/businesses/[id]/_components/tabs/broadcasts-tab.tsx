"use client";

import { useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import { useBusinessBroadcasts } from "@/hooks/use-businesses";
import type { AdminBroadcast } from "@/lib/api";
import { formatDateTime, limitLabel, ratioLabel } from "@/lib/format";
import { describeTargetFilter } from "@/lib/broadcast-target";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<string, string> = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sending: "border-blue-200 bg-blue-50 text-blue-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  draft: "border-gray-200 bg-gray-50 text-gray-600",
  cancelled: "border-gray-200 bg-gray-50 text-gray-600",
  failed: "border-red-200 bg-red-50 text-red-700",
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-2.5 py-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold", tone)}>{value}</div>
    </div>
  );
}

function BroadcastCard({ broadcast }: { broadcast: AdminBroadcast }) {
  const locales = Object.keys(broadcast.translations ?? {});
  const reachPct = broadcast.total_recipients
    ? broadcast.reachable_recipients / broadcast.total_recipients
    : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {broadcast.title || "(untitled)"}
          <Badge
            variant="outline"
            className={STATUS_TONE[broadcast.status] ?? STATUS_TONE.draft}
          >
            {broadcast.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="text-sm">{broadcast.body}</div>
          {locales.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              {locales.map((locale) => (
                <div key={locale} className="flex gap-2 text-sm">
                  <span className="mt-0.5 w-8 shrink-0 font-mono text-xs uppercase text-muted-foreground">
                    {locale}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">
                      {broadcast.translations[locale]?.title}
                    </span>
                    {broadcast.translations[locale]?.body && (
                      <span className="text-muted-foreground">
                        {" — "}
                        {broadcast.translations[locale]?.body}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <InfoGrid className="lg:grid-cols-3">
          <InfoRow
            label="Audience"
            value={describeTargetFilter(broadcast.target_filter)}
          />
          <InfoRow
            label={broadcast.sent_at ? "Sent" : "Scheduled"}
            value={formatDateTime(broadcast.sent_at ?? broadcast.scheduled_at)}
            {...(broadcast.timezone ? {} : {})}
          />
          <InfoRow label="Timezone" value={broadcast.timezone} />
        </InfoGrid>

        {broadcast.status === "sent" && (
          <div className="space-y-2">
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                reachPct < 0.5
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              )}
            >
              <span className="font-medium">
                Reach{" "}
                {ratioLabel(
                  broadcast.reachable_recipients,
                  broadcast.total_recipients
                )}
              </span>
              {broadcast.skipped_no_push > 0 && (
                <span className="opacity-80">
                  {" "}
                  — {broadcast.skipped_no_push} matched the audience but hold no
                  push channel, so nothing was ever sent to them.
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <Stat
                label="Delivered"
                value={broadcast.delivered}
                tone="text-emerald-700"
              />
              <Stat
                label="Failed"
                value={broadcast.failed}
                tone={broadcast.failed ? "text-red-700" : undefined}
              />
              <Stat label="Apple ok" value={broadcast.apple_delivered} />
              <Stat label="Apple fail" value={broadcast.apple_failed} />
              <Stat label="Google ok" value={broadcast.google_delivered} />
              <Stat label="Google fail" value={broadcast.google_failed} />
              <Stat
                label="Pass removed"
                value={broadcast.google_not_installed}
              />
            </div>
            {broadcast.google_throttled > 0 && (
              <p className="text-xs text-amber-700">
                {broadcast.google_throttled} dropped by Google&apos;s 3-per-24h
                quota.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BroadcastsTab({ businessId }: { businessId: string }) {
  // 0-indexed, matching DataTablePagination's contract.
  const [page, setPage] = useState(0);
  const { data, isPending, isError } = useBusinessBroadcasts(
    businessId,
    PAGE_SIZE,
    page * PAGE_SIZE
  );

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
        title="Could not load broadcasts"
        description="The request failed. Try refreshing."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3">
          <InfoGrid>
            <InfoRow
              label="Broadcasts allowed"
              value={data.limits.allowed ? "Yes" : "Not on this plan"}
            />
            <InfoRow
              label="Monthly quota"
              value={limitLabel(data.limits.monthly_limit)}
            />
            <InfoRow
              label="Scheduling"
              value={data.limits.scheduling ? "Yes" : "Not on this plan"}
            />
            <InfoRow
              label="Segmentation"
              value={data.limits.segmentation ? "Yes" : "Not on this plan"}
            />
          </InfoGrid>
        </CardContent>
      </Card>

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Never sent a broadcast"
          description={
            data.limits.allowed
              ? "This merchant has not used broadcasts yet."
              : "Their plan does not include broadcasts."
          }
        />
      ) : (
        <>
          {data.items.map((broadcast) => (
            <BroadcastCard key={broadcast.id} broadcast={broadcast} />
          ))}
          <DataTablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
