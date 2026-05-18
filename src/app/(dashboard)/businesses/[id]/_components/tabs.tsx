"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletCard } from "@/components/card/WalletCard";
import { ScaledCardWrapper } from "@/components/card/ScaledCardWrapper";
import { ResellerBadge } from "@/components/business-utils";
import {
  useBusinessMembers,
  useBusinessStats,
} from "@/hooks/use-businesses";
import type { Business } from "@/lib/api";
import { cn } from "@/lib/utils";

const SHOWCASE_URL =
  process.env.NEXT_PUBLIC_SHOWCASE_URL || "https://stampeo.app";

const HEARD_FROM_LABELS: Record<string, string> = {
  google: "Google / Search",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  article: "Article / Blog",
  friend: "Friend / Colleague",
  business: "A Stampeo business",
  other: "Other",
};

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: "Solo",
  small: "Small (2–5)",
  medium: "Medium (6–20)",
  large: "Large (20+)",
  "2-5": "2–5",
};

const LOCATIONS_LABELS: Record<string, string> = {
  one: "1 location",
  few: "2–5 locations",
  several: "6–20 locations",
  many: "20+ locations",
  "1": "1 location",
  "2-5": "2–5 locations",
};

const PRIMARY_GOAL_LABELS: Record<string, string> = {
  retention: "Retention",
  frequency: "Frequency",
  basket: "Bigger baskets",
  acquisition: "Acquisition",
  retain: "Retention",
};

function formatBusinessInfoEntry(entry: {
  type: string;
  data: Record<string, unknown>;
  label?: string;
}): { label: string; value: string } | null {
  const data = entry.data ?? {};
  switch (entry.type) {
    case "phone":
      return data.number
        ? { label: "Business phone", value: String(data.number) }
        : null;
    case "website":
      return data.url
        ? { label: "Business website", value: String(data.url) }
        : null;
    case "email":
      return data.email
        ? { label: "Business email", value: String(data.email) }
        : null;
    case "address":
      return data.address
        ? { label: "Address", value: String(data.address) }
        : null;
    case "hours":
      return { label: "Hours", value: "(set)" };
    case "custom":
      return data.label && data.value
        ? { label: String(data.label), value: String(data.value) }
        : null;
    default:
      return null;
  }
}

type TabKey = "info" | "design" | "certificate" | "team" | "actions";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "design", label: "Design" },
  { key: "certificate", label: "Certificate" },
  { key: "team", label: "Team" },
  { key: "actions", label: "Sharing" },
];

export function BusinessTabs({ business }: { business: Business }) {
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && <InfoTab business={business} />}
      {tab === "design" && <DesignTab businessId={business.id} />}
      {tab === "certificate" && <CertificateTab businessId={business.id} />}
      {tab === "team" && <TeamTab businessId={business.id} />}
      {tab === "actions" && <SharingTab business={business} />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function InfoTab({ business }: { business: Business }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 pt-6">
        {business.owner_name && (
          <InfoRow label="Owner" value={business.owner_name} />
        )}
        {business.owner_email && (
          <InfoRow label="Email" value={business.owner_email} />
        )}
        <InfoRow
          label="Slug"
          value={<span className="font-mono">/{business.url_slug}</span>}
        />
        {business.settings?.category && (
          <InfoRow label="Category" value={business.settings.category} />
        )}
        <InfoRow
          label="Applied"
          value={new Date(business.created_at).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <InfoRow
          label="Activated"
          value={
            business.activated_at
              ? new Date(business.activated_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
        />
        {business.trial_ends_at && (
          <InfoRow
            label="Trial ends"
            value={new Date(business.trial_ends_at).toLocaleDateString()}
          />
        )}
        {business.grace_ends_at && (
          <InfoRow
            label="Grace ends"
            value={new Date(business.grace_ends_at).toLocaleDateString()}
          />
        )}
        {business.owner_phone && (
          <InfoRow label="Owner phone" value={business.owner_phone} />
        )}
        {business.identity_website && (
          <InfoRow
            label="Loyalty-card website"
            value={
              <a
                href={
                  business.identity_website.startsWith("http")
                    ? business.identity_website
                    : `https://${business.identity_website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {business.identity_website}
              </a>
            }
          />
        )}
        {(business.business_info ?? []).map((entry, idx) => {
          const formatted = formatBusinessInfoEntry(entry);
          if (!formatted) return null;
          return (
            <InfoRow
              key={`${entry.type}-${idx}`}
              label={formatted.label}
              value={formatted.value}
            />
          );
        })}
        {business.heard_from && (
          <InfoRow
            label="Heard From"
            value={
              business.heard_from === "other" && business.heard_from_other
                ? `Other: ${business.heard_from_other}`
                : HEARD_FROM_LABELS[business.heard_from] || business.heard_from
            }
          />
        )}
        {business.team_size && (
          <InfoRow
            label="Team size"
            value={TEAM_SIZE_LABELS[business.team_size] || business.team_size}
          />
        )}
        {business.locations_count && (
          <InfoRow
            label="Locations"
            value={
              LOCATIONS_LABELS[business.locations_count] ||
              business.locations_count
            }
          />
        )}
        {business.primary_goal && (
          <InfoRow
            label="Primary goal"
            value={
              PRIMARY_GOAL_LABELS[business.primary_goal] ||
              business.primary_goal
            }
          />
        )}
        {business.settings?.description && (
          <div className="col-span-2">
            <InfoRow
              label="Description"
              value={business.settings.description}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DesignTab({ businessId }: { businessId: string }) {
  const { data: stats, isPending } = useBusinessStats(businessId);
  return (
    <Card>
      <CardContent className="pt-6">
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : stats?.active_design ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[320px]">
              <ScaledCardWrapper
                baseWidth={280}
                aspectRatio={1.282}
                minScale={0.6}
              >
                <WalletCard
                  design={stats.active_design}
                  stamps={3}
                  showQR={false}
                />
              </ScaledCardWrapper>
            </div>
            <p className="text-sm font-medium">{stats.active_design.name}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active design
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CertificateTab({ businessId }: { businessId: string }) {
  const { data: stats, isPending } = useBusinessStats(businessId);
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
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : stats?.certificate ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">
                Identifier
              </div>
              <div className="font-mono text-sm font-medium">
                {stats.certificate.identifier}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">
                Status
              </div>
              <Badge
                variant="outline"
                className={
                  stats.certificate.status === "assigned"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : stats.certificate.status === "revoked"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }
              >
                {stats.certificate.status}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No certificate assigned to this business.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TeamTab({ businessId }: { businessId: string }) {
  const { data: members, isPending } = useBusinessMembers(businessId);
  const rows = members ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Team Members ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No team members.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Scans</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.users ? (
                      <Link
                        href={`/users/${member.user_id}`}
                        className="hover:underline"
                      >
                        <div className="font-medium flex items-center gap-1.5">
                          {member.users.name}
                          {member.users.is_reseller && <ResellerBadge />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.users.email}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        member.role === "owner"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : member.role === "admin"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.last_active_at
                      ? new Date(member.last_active_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.scans_count ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SharingTab({ business }: { business: Business }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const signupUrl = `${SHOWCASE_URL}/${business.url_slug}`;

  useEffect(() => {
    setQrLoading(true);
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(signupUrl, { width: 300, margin: 1 })
      )
      .then((url) => setQrCode(url))
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
      const base64Data = qrCode.includes(",")
        ? qrCode.split(",")[1]
        : qrCode;
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Signup Link & QR Code</CardTitle>
          <div className="flex rounded-lg border p-0.5 text-xs">
            <button
              onClick={() => setShowQR(false)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors cursor-pointer",
                !showQR
                  ? "bg-background shadow-sm font-semibold"
                  : "text-muted-foreground"
              )}
            >
              Link
            </button>
            <button
              onClick={() => setShowQR(true)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors cursor-pointer",
                showQR
                  ? "bg-background shadow-sm font-semibold"
                  : "text-muted-foreground"
              )}
            >
              QR Code
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!showQR ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate font-mono">
                {signupUrl}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-[180px] h-[180px] rounded-xl border bg-white flex items-center justify-center overflow-hidden">
              {qrLoading ? (
                <div className="w-[140px] h-[140px] rounded-lg bg-muted animate-pulse" />
              ) : qrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-[150px] h-[150px]"
                />
              ) : (
                <div className="text-xs text-muted-foreground text-center px-4">
                  QR code unavailable
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!qrCode}
                onClick={handleDownloadPng}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!qrCode}
                onClick={handleDownloadPdf}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
