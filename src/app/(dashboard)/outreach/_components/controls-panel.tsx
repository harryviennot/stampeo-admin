"use client";

import { useState } from "react";
import { PlayCircle, PauseCircle, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useOutreachAudience,
  useOutreachHealth,
  useSetOutreachPaused,
  useStartOutreachBackfill,
} from "@/hooks/use-outreach";

const BACKFILL_CONFIRM = "outreach_backfill";

const TRACK_LABELS: Record<string, string> = {
  first_touch: "First touch (48h stalls)",
  lifecycle: "Lost a subscription",
  escalations: "Follow-up offer",
  backfill: "Catch-up backlog",
};

export function ControlsPanel() {
  const audience = useOutreachAudience();
  const health = useOutreachHealth();
  const pauseToggle = useSetOutreachPaused();
  const backfill = useStartOutreachBackfill();
  const [confirmText, setConfirmText] = useState("");

  const paused = audience.data?.paused ?? health.data?.paused ?? null;

  return (
    <div className="space-y-4">
      {/* Status strip: everything that decides whether anything sends at all. */}
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Sending</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {audience.data && (
              <>
                <Badge variant={audience.data.enabled ? "default" : "outline"}>
                  {audience.data.enabled ? "enabled" : "disabled"}
                </Badge>
                {audience.data.test_mode && (
                  <Badge variant="secondary">test mode</Badge>
                )}
                {audience.data.sandbox && (
                  <Badge variant="secondary">sandbox</Badge>
                )}
                {!audience.data.twilio_configured && (
                  <Badge variant="destructive">Twilio not configured</Badge>
                )}
              </>
            )}
          </div>
        </div>

        {paused ? (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <Warning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-muted-foreground">Paused: {paused}</p>
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">
            Running normally. The sweep goes out daily at 10:30 UTC.
          </p>
        )}

        <Button
          variant={paused ? "default" : "outline"}
          size="sm"
          disabled={pauseToggle.isPending}
          onClick={() =>
            pauseToggle.mutate(
              { paused: !paused, reason: "paused from the admin panel" },
              {
                onSuccess: (r) =>
                  toast.success(r.paused ? "Sending paused." : "Sending resumed."),
                onError: (e) => toast.error(`Failed: ${String(e)}`),
              }
            )
          }
        >
          {paused ? (
            <>
              <PlayCircle className="mr-1.5 h-4 w-4" /> Resume sending
            </>
          ) : (
            <>
              <PauseCircle className="mr-1.5 h-4 w-4" /> Pause sending
            </>
          )}
        </Button>
      </div>

      {/* Dry run: exactly who the next sweep would message. */}
      <div className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 text-sm font-semibold">Next sweep would message</h2>
        {audience.isLoading && (
          <p className="text-sm text-muted-foreground">Loading audience…</p>
        )}
        {audience.isError && (
          <p className="text-sm text-destructive">
            Could not load the audience: {String(audience.error)}
          </p>
        )}
        {audience.data && (
          <div className="space-y-2">
            {Object.entries(audience.data.tracks).map(([key, track]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {TRACK_LABELS[key] ?? key}
                </span>
                <span className="font-medium">
                  {track.count}
                  {track.by_channel.email > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({track.by_channel.email} by email)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health: is the sender still welcome. */}
      <div className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 text-sm font-semibold">Last 7 days</h2>
        {health.data ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Sent" value={health.data.last_7_days.sent} />
              <Stat label="Delivered" value={health.data.last_7_days.delivered} />
              <Stat label="Replies" value={health.data.last_7_days.inbound} />
              <Stat label="Failed" value={health.data.last_7_days.failed} />
            </div>
            {Object.keys(health.data.variants).length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  A/B
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="font-normal">Variant</th>
                      <th className="font-normal">Sent</th>
                      <th className="font-normal">Replied</th>
                      <th className="font-normal">Converted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(health.data.variants).map(([key, row]) => (
                      <tr key={key}>
                        <td className="py-0.5 uppercase">{key}</td>
                        <td>{row.threads}</td>
                        <td>{row.replied}</td>
                        <td>{row.converted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        )}
      </div>

      {/* The one-time catch-up, gated the same way the campaign blasts are. */}
      <div className="rounded-lg border bg-background p-4">
        <h2 className="mb-1 text-sm font-semibold">Catch-up backlog</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Works through stalls up to 30 days old, capped per day so the number
          warms up gradually. It stops on its own when the backlog empties.
        </p>
        {audience.data?.backfill_active ? (
          <Badge variant="secondary">running</Badge>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder={`Type ${BACKFILL_CONFIRM} to start`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <Button
              size="sm"
              disabled={confirmText !== BACKFILL_CONFIRM || backfill.isPending}
              onClick={() =>
                backfill.mutate(BACKFILL_CONFIRM, {
                  onSuccess: (r) => {
                    setConfirmText("");
                    toast.success(
                      r.skipped
                        ? "Nobody is eligible right now."
                        : `Backlog started, ${r.queued} waiting.`
                    );
                  },
                  onError: (e) => toast.error(`Failed: ${String(e)}`),
                })
              }
            >
              Start the catch-up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
