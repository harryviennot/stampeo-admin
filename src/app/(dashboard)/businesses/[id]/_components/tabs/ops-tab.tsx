"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  Recycle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import {
  useBusinessComms,
  useBusinessStats,
  useRebuildCardAssets,
} from "@/hooks/use-businesses";
import { useReleasePassTypeId } from "@/hooks/use-certificates";
import type { Business } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SHOWCASE_URL =
  process.env.NEXT_PUBLIC_SHOWCASE_URL || "https://stampeo.app";

const RECLAIM_SEGMENT_LABELS: Record<string, string> = {
  A: "A · abandoned (no customers)",
  B1: "B1 · trial churn (never paid)",
  B2: "B2 · lapsed payer",
};

function CertificateCard({ businessId }: { businessId: string }) {
  const { data: stats, isPending } = useBusinessStats(businessId);
  const release = useReleasePassTypeId();
  const cert = stats?.certificate;
  const reclaim = stats?.reclaim;

  const handleRelease = () => {
    if (!cert) return;
    release.mutate(cert.id, {
      onSuccess: () =>
        toast.success("Certificate released", {
          description: `${cert.identifier} is back in the pool`,
        }),
      onError: (err) =>
        toast.error("Release failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Certificate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : cert ? (
          <div className="space-y-4">
            <InfoGrid>
              <InfoRow label="Identifier" value={cert.identifier} mono />
              <InfoRow
                label="Status"
                value={
                  <Badge
                    variant="outline"
                    className={
                      cert.status === "assigned"
                        ? "border-blue-200 bg-blue-100 text-blue-700"
                        : cert.status === "revoked"
                          ? "border-red-200 bg-red-100 text-red-700"
                          : "border-emerald-200 bg-emerald-100 text-emerald-700"
                    }
                  >
                    {cert.status}
                  </Badge>
                }
              />
              {cert.released_at && (
                <InfoRow
                  label="Released at"
                  value={formatDate(cert.released_at)}
                />
              )}
            </InfoGrid>

            {reclaim?.is_candidate && reclaim.segment ? (
              <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Reclaim status
                  </span>
                  {reclaim.eligible_now ? (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-100 text-amber-700"
                    >
                      Eligible now
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Waiting
                    </span>
                  )}
                </div>
                <InfoGrid className="lg:grid-cols-3">
                  <InfoRow
                    label="Segment"
                    value={
                      RECLAIM_SEGMENT_LABELS[reclaim.segment] ?? reclaim.segment
                    }
                  />
                  <InfoRow
                    label="Ever paid"
                    value={reclaim.ever_paid ? "Yes" : "No"}
                  />
                  <InfoRow
                    label="Inactive"
                    value={
                      reclaim.days_since != null ? `${reclaim.days_since}d` : null
                    }
                  />
                  <InfoRow
                    label="Release"
                    value={
                      reclaim.days_until_release == null ? null : reclaim
                          .days_until_release <= 0 ? (
                        <span className="text-red-600">overdue</span>
                      ) : (
                        `in ${reclaim.days_until_release}d`
                      )
                    }
                  />
                  <InfoRow
                    label="Warnings sent"
                    value={
                      reclaim.segment === "A"
                        ? "none (auto)"
                        : reclaim.warnings_sent.length === 0
                          ? null
                          : reclaim.warnings_sent
                              .map((w) => `T-${w.replace("t", "")}`)
                              .sort()
                              .reverse()
                              .join(", ")
                    }
                  />
                  <InfoRow
                    label="Release date"
                    value={formatDate(reclaim.release_date)}
                  />
                </InfoGrid>
              </div>
            ) : reclaim ? (
              <p className="text-xs text-muted-foreground">
                Protected from reclaim (active / trial / founding partner).
              </p>
            ) : null}

            {cert.status === "assigned" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={release.isPending}>
                    {release.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Recycle className="h-4 w-4" />
                    )}
                    Release to pool
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Release certificate</AlertDialogTitle>
                    <AlertDialogDescription>
                      Release <strong>{cert.identifier}</strong> back into the
                      pool? It stays reclaimable by this business until
                      reassigned to someone else, after which installed cards
                      can no longer be updated.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRelease}>
                      Release
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ) : (
          <EmptyState
            title="No certificate assigned"
            description="Passes for this business cannot be signed or updated."
          />
        )}
      </CardContent>
    </Card>
  );
}

function RebuildCard({ business }: { business: Business }) {
  const rebuild = useRebuildCardAssets();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Rebuild card assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Regenerates the active design&apos;s strip images and re-pushes every
          installed pass, then clears the active-design cache. This is the lever
          for &ldquo;their card looks wrong&rdquo; or &ldquo;their card never
          updated&rdquo;. It runs the same path a merchant&apos;s own design save
          runs — it changes no configuration.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={rebuild.isPending}>
              {rebuild.isPending && (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              )}
              Rebuild and re-push
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rebuild card assets?</AlertDialogTitle>
              <AlertDialogDescription>
                Every customer of &ldquo;{business.name}&rdquo; will receive a
                silent pass update. Strip images regenerate in the background,
                so the card may show as regenerating for a minute.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  rebuild.mutate(business.id, {
                    onSuccess: () =>
                      toast.success("Rebuild queued", {
                        description: "Strips regenerate and passes re-push now.",
                      }),
                    onError: (err) =>
                      toast.error("Rebuild failed", {
                        description:
                          err instanceof Error ? err.message : "Unknown error",
                      }),
                  })
                }
              >
                Rebuild
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function CommsCard({ businessId }: { businessId: string }) {
  const { data, isPending, isError } = useBusinessComms(businessId);

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState title="Could not load communications" />
        </CardContent>
      </Card>
    );
  }

  const emails = [
    ...data.marketing.map((m) => ({
      kind: m.track ?? "marketing",
      label: m.email_key ?? "—",
      period: m.period,
      at: m.sent_at,
    })),
    ...data.reengagement.map((r) => ({
      kind: "reengagement",
      label: r.step ?? "—",
      period: null,
      at: r.sent_at,
    })),
  ].sort((a, b) => (a.at ?? "") < (b.at ?? "") ? 1 : -1);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Emails Stampeo sent them ({emails.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Answers &ldquo;did they actually get the trial-ending / dormant /
            digest mail?&rdquo;
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {emails.length === 0 ? (
            <EmptyState title="No lifecycle emails sent yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sent</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email, i) => (
                    <TableRow key={`${email.label}-${i}`}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(email.at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{email.kind}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {email.label}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {email.period ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {data.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Email clicks ({data.events.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Destination</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((event, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(event.occurred_at)}
                    </TableCell>
                    <TableCell>{event.campaign}</TableCell>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell className="max-w-[20rem] truncate font-mono text-xs">
                      {event.clicked_url ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Outreach ({data.outreach.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            The winback thread with the owner. Check before writing to them
            again.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.outreach.length === 0 ? (
            <EmptyState title="Never contacted" />
          ) : (
            data.outreach.map((conv) => (
              <div key={conv.id} className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{conv.channel}</Badge>
                  <Badge variant="outline">{conv.track}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      conv.status === "replied"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : conv.status === "opted_out"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : undefined
                    }
                  >
                    {conv.status}
                  </Badge>
                  {conv.automation_paused_at && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700"
                    >
                      automation paused
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  {conv.messages.map((message, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-sm",
                        message.direction === "inbound"
                          ? "bg-muted/60"
                          : "bg-blue-50/60"
                      )}
                    >
                      <div className="text-xs text-muted-foreground">
                        {message.direction} · {formatDateTime(message.created_at)}
                        {message.step && ` · ${message.step}`}
                      </div>
                      <div>{message.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Owner email preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.preferences ? (
            <pre className="max-h-60 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
              {JSON.stringify(data.preferences, null, 2)}
            </pre>
          ) : (
            <EmptyState
              title="No preferences row"
              description="They have never changed a default, so everything is on."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function SignupLinkCard({ business }: { business: Business }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const signupUrl = `${SHOWCASE_URL}/${business.url_slug}`;

  useEffect(() => {
    setQrLoading(true);
    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(signupUrl, { width: 300, margin: 1 }))
      .then(setQrCode)
      .catch(() => {
        /* QR stays null */
      })
      .finally(() => setQrLoading(false));
  }, [signupUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadPng = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `${business.name}-qr-code.png`;
    link.click();
  };

  const handleDownloadPdf = async () => {
    if (!qrCode) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      doc.setFontSize(20);
      doc.text(business.name, 105, 40, { align: "center" });
      const base64Data = qrCode.includes(",") ? qrCode.split(",")[1] : qrCode;
      doc.addImage(base64Data, "PNG", 52.5, 60, 100, 100);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(signupUrl, 105, 175, { align: "center" });
      doc.save(`${business.name}-qr-code.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signup link &amp; QR code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate font-mono text-sm">{signupUrl}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!qrCode}
            onClick={handleDownloadPng}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!qrCode}
            onClick={handleDownloadPdf}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        </div>
        <div className="flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-xl border bg-white">
          {qrLoading ? (
            <div className="h-[140px] w-[140px] animate-pulse rounded-lg bg-muted" />
          ) : qrCode ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrCode} alt="QR code" className="h-[150px] w-[150px]" />
          ) : (
            <div className="px-4 text-center text-xs text-muted-foreground">
              QR code unavailable
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OpsTab({ business }: { business: Business }) {
  return (
    <div className="space-y-4">
      <CertificateCard businessId={business.id} />
      <RebuildCard business={business} />
      <SignupLinkCard business={business} />
      <CommsCard businessId={business.id} />
    </div>
  );
}
