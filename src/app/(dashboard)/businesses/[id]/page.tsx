"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Loader2,
  Users,
  CircleDot,
  Gift,
  Palette,
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
  fetchBusinesses,
  fetchBusinessStats,
  activateBusiness,
  suspendBusiness,
  type Business,
  type BusinessStats,
} from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import {
  BusinessInitials,
  PlanBadge,
  StatusBadge,
} from "@/components/business-utils";

const SHOWCASE_URL =
  process.env.NEXT_PUBLIC_SHOWCASE_URL || "https://stampeo.app";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadBusiness = useCallback(async () => {
    try {
      const all = await fetchBusinesses();
      const found = all.find((b) => b.id === id);
      if (!found) {
        toast.error("Business not found");
        router.push("/businesses");
        return;
      }
      setBusiness(found);
    } catch (err) {
      toast.error("Failed to load business", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchBusinessStats(id);
      setStats(data);
    } catch (err) {
      toast.error("Failed to load business stats", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBusiness();
    loadStats();
  }, [loadBusiness, loadStats]);

  useEffect(() => {
    if (!business) return;
    setQrLoading(true);
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(`${SHOWCASE_URL}/${business.url_slug}`, {
          width: 300,
          margin: 1,
        })
      )
      .then((url) => setQrCode(url))
      .catch(() => {
        /* QR stays null */
      })
      .finally(() => setQrLoading(false));
  }, [business]);

  const signupUrl = business ? `${SHOWCASE_URL}/${business.url_slug}` : "";

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
    link.download = `${business!.name}-qr-code.png`;
    link.click();
  };

  const handleDownloadPdf = async () => {
    if (!qrCode || !business) return;
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

  const handleActivate = async () => {
    if (!business) return;
    setActing(true);
    try {
      await activateBusiness(business.id);
      toast.success("Business activated");
      await loadBusiness();
    } catch (err) {
      toast.error("Failed to activate", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActing(false);
    }
  };

  const handleSuspend = async () => {
    if (!business) return;
    setActing(true);
    try {
      await suspendBusiness(business.id);
      toast.success("Business suspended");
      await loadBusiness();
    } catch (err) {
      toast.error("Failed to suspend", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) return null;

  return (
    <div className="space-y-6">
      {/* Back + header */}
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

        <div className="flex items-start gap-4">
          {business.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <BusinessInitials
              name={business.name}
              color={business.settings?.accentColor}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {business.name}
              </h1>
              <StatusBadge status={business.status} />
              <PlanBadge tier={business.subscription_tier} />
            </div>
            <div className="font-mono text-sm text-muted-foreground mt-0.5">
              /{business.url_slug}
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {business.status === "active" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={acting}
                  >
                    {acting && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    Suspend
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspend business?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will suspend &quot;{business.name}&quot;. They will
                      no longer be able to stamp customers or manage their
                      account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleSuspend}
                    >
                      Suspend
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : business.status === "pending" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={acting}
                  onClick={handleActivate}
                >
                  {acting && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Accept
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      disabled={acting}
                    >
                      Deny
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deny application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will suspend &quot;{business.name}&quot;. The owner
                        will not be able to use the platform.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleSuspend}
                      >
                        Deny
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                disabled={acting}
                onClick={handleActivate}
              >
                {acting && (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                )}
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={stats?.total_customers}
          loading={statsLoading}
          icon={<Users className="h-4 w-4" />}
          trend={
            stats
              ? {
                  current: stats.customers_this_month,
                  previous: stats.customers_last_month,
                }
              : undefined
          }
        />
        <StatCard
          label="Total Stamps"
          value={stats?.total_stamps}
          loading={statsLoading}
          icon={<CircleDot className="h-4 w-4" />}
          trend={
            stats
              ? {
                  current: stats.stamps_this_month,
                  previous: stats.stamps_last_month,
                }
              : undefined
          }
        />
        <StatCard
          label="Total Rewards"
          value={stats?.total_rewards}
          loading={statsLoading}
          icon={<Gift className="h-4 w-4" />}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Design
                </p>
                {statsLoading ? (
                  <span className="inline-block h-7 w-24 animate-pulse rounded bg-muted" />
                ) : stats?.active_design ? (
                  <div>
                    <p className="text-sm font-bold">
                      {stats.active_design.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.active_design.organization_name}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active design
                  </p>
                )}
              </div>
              <Badge
                className="bg-secondary text-secondary-foreground"
                variant="secondary"
              >
                <Palette className="h-4 w-4" />
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {business.owner_name && (
              <InfoRow label="Owner" value={business.owner_name} />
            )}
            {business.owner_email && (
              <InfoRow label="Email" value={business.owner_email} />
            )}
            <InfoRow
              label="Slug"
              value={
                <span className="font-mono">/{business.url_slug}</span>
              }
            />
            {business.settings?.category && (
              <InfoRow label="Category" value={business.settings.category} />
            )}
            <InfoRow
              label="Applied"
              value={new Date(business.created_at).toLocaleDateString()}
            />
            <InfoRow
              label="Activated"
              value={
                business.activated_at
                  ? new Date(business.activated_at).toLocaleDateString()
                  : "—"
              }
            />
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

        {/* Certificate card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Certificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
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
      </div>

      {/* QR / Link card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Signup Link & QR Code</CardTitle>
            <div className="flex rounded-lg border p-0.5 text-xs">
              <button
                onClick={() => setShowQR(false)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  !showQR
                    ? "bg-background shadow-sm font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Link
              </button>
              <button
                onClick={() => setShowQR(true)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  showQR
                    ? "bg-background shadow-sm font-semibold"
                    : "text-muted-foreground"
                }`}
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
    </div>
  );
}
