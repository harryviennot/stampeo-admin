"use client";

/**
 * One-shot campaign blasts.
 *
 * Replaces the `--dry-run` / `--send` CLI scripts earlier blasts used, keeping
 * the same two steps: the audience loads read-only, and sending needs the slug
 * typed back. Nothing here fires on mount.
 */

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowSquareOut, PaperPlaneTilt, Warning } from "@phosphor-icons/react";

import { fetchCampaignAudience, sendCampaign } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CAMPAIGN = {
  slug: "founding-thank-you",
  // What the backend expects echoed back in `confirm`, and the log step. Note
  // it uses underscores where the route uses hyphens.
  confirm: "founding_thank_you",
  title: "Founding partner thank-you",
  preview: "/emails?template=campaigns/founding_thank_you&locale=fr",
  description:
    "Thanks founding partners who are active or in trial on a monthly plan, confirms their rate is unchanged, and announces yearly billing. Recipients of the founding-programme close blast are excluded.",
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");

  const audience = useQuery({
    queryKey: adminKeys.campaigns.audience(CAMPAIGN.slug),
    queryFn: () => fetchCampaignAudience(CAMPAIGN.slug),
  });

  const send = useMutation({
    mutationFn: () => sendCampaign(CAMPAIGN.slug, CAMPAIGN.confirm),
    onSuccess: (result) => {
      if (result.skipped) {
        toast.info("Nobody was eligible, nothing sent.");
      } else {
        toast.success(
          `Queued ${result.queued} email${result.queued === 1 ? "" : "s"}. ` +
            "Sending is paced, so it runs in the background."
        );
      }
      setConfirmText("");
      // The audience shrinks toward zero as the worker writes its log rows.
      queryClient.invalidateQueries({
        queryKey: adminKeys.campaigns.audience(CAMPAIGN.slug),
      });
    },
    onError: (e) => toast.error(`Send failed: ${String(e)}`),
  });

  const data = audience.data;
  const armed = confirmText.trim() === CAMPAIGN.confirm;
  const empty = data?.recipient_count === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          One-shot blasts to business owners. Each one sends at most once per
          business.
        </p>
      </div>

      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{CAMPAIGN.title}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {CAMPAIGN.description}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={CAMPAIGN.preview}>
              <ArrowSquareOut className="h-4 w-4" /> Preview the email
            </Link>
          </Button>
        </div>

        {audience.isLoading && (
          <p className="text-sm text-muted-foreground">Loading audience…</p>
        )}
        {audience.isError && (
          <p className="text-sm text-destructive">
            Could not load the audience: {String(audience.error)}
          </p>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Recipients" value={data.recipient_count} />
              <Stat label="Businesses" value={data.business_count} />
              <Stat
                label="Locales"
                value={
                  Object.entries(data.by_locale)
                    .map(([l, n]) => `${l} ${n}`)
                    .join(" · ") || "—"
                }
              />
            </div>

            {Object.keys(data.by_tier).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.by_tier).map(([tier, n]) => (
                  <Badge key={tier} variant="secondary">
                    {tier} · {n}
                  </Badge>
                ))}
              </div>
            )}

            {empty ? (
              <p className="text-sm text-muted-foreground">
                Nobody is eligible right now. Either this campaign already went
                out, or no founding partner is on a monthly plan.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Locale</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Yearly</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sample.map((r) => (
                        <TableRow key={`${r.business_id}-${r.owner_email}`}>
                          <TableCell className="font-medium">
                            {r.business_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.owner_email}
                          </TableCell>
                          <TableCell>{r.locale}</TableCell>
                          <TableCell>{r.tier_name}</TableCell>
                          <TableCell>{r.current_price}</TableCell>
                          <TableCell>{r.yearly_price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {data.sample_truncated && (
                  <p className="text-xs text-muted-foreground">
                    Showing the first {data.sample.length} of{" "}
                    {data.recipient_count}. The send covers all of them.
                  </p>
                )}

                <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Warning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p>
                      This queues {data.recipient_count} real email
                      {data.recipient_count === 1 ? "" : "s"} and cannot be
                      undone. Sending is paced against the provider rate limit,
                      so it finishes in the background. Type{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                        {CAMPAIGN.confirm}
                      </code>{" "}
                      to enable the button.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={CAMPAIGN.confirm}
                      className="max-w-xs font-mono"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <Button
                      variant="destructive"
                      disabled={!armed || send.isPending}
                      onClick={() => send.mutate()}
                    >
                      <PaperPlaneTilt className="h-4 w-4" />
                      {send.isPending
                        ? "Queueing…"
                        : `Send to ${data.recipient_count}`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
