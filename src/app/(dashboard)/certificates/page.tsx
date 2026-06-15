"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  useCertPool,
  usePassTypeIds,
  useReclaimCandidates,
  useReleasePassTypeId,
  useRevokePassTypeId,
  useUploadCertificate,
} from "@/hooks/use-certificates";
import { useGlobalStats } from "@/hooks/use-stats";
import { StatCard } from "@/components/stat-card";
import {
  ShieldOff,
  Loader2,
  Upload,
  Database,
  CheckCircle,
  XCircle,
  BookOpen,
  RotateCcw,
  Recycle,
} from "lucide-react";

const statusConfig = {
  available: {
    label: "Available",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  revoked: {
    label: "Revoked",
    className: "bg-red-100 text-red-700 border-red-200",
  },
} as const;

const segmentConfig = {
  A: {
    label: "A · abandoned",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  B1: {
    label: "B1 · trial churn",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  B2: {
    label: "B2 · lapsed payer",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
} as const;

export default function CertificatesPage() {
  const { data: passTypeIds = [], isPending: loading } = usePassTypeIds();
  const { data: stats, isPending: statsLoading } = useCertPool();
  const { data: globalStats, isPending: globalLoading } = useGlobalStats();
  const { data: candidates = [], isPending: candidatesLoading } =
    useReclaimCandidates();
  const revoke = useRevokePassTypeId();
  const release = useReleasePassTypeId();
  const upload = useUploadCertificate();
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  const handleRevoke = (id: string, identifier: string) => {
    revoke.mutate(id, {
      onSuccess: () =>
        toast.success("Certificate revoked", {
          description: `${identifier} has been revoked`,
        }),
      onError: (err) =>
        toast.error("Revoke failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  const handleRelease = (id: string, identifier: string) => {
    release.mutate(id, {
      onSuccess: () =>
        toast.success("Certificate released", {
          description: `${identifier} is back in the pool, reclaimable by its owner until reassigned`,
        }),
      onError: (err) =>
        toast.error("Release failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  const releasingId = release.isPending ? release.variables : null;

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    upload.mutate(formData, {
      onSuccess: (result) => {
        setLastUploaded(result.identifier);
        toast.success("Certificate uploaded successfully", {
          description: `${result.identifier} is now available in the pool`,
        });
        form.reset();
      },
      onError: (err) =>
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
  };

  const uploading = upload.isPending;
  const revokingId = revoke.isPending ? revoke.variables : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground">
          Manage Apple Pass Type ID certificates for per-business isolation.
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={stats?.total}
          loading={statsLoading}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          label="Available"
          value={stats?.available}
          loading={statsLoading}
          icon={<CheckCircle className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Assigned"
          value={stats?.assigned}
          loading={statsLoading}
          icon={<Upload className="h-4 w-4" />}
          badgeClass="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Revoked"
          value={stats?.revoked}
          loading={statsLoading}
          icon={<XCircle className="h-4 w-4" />}
          badgeClass="bg-red-100 text-red-700"
        />
        <StatCard
          label="Reclaimable"
          value={globalStats?.certs_reclaimable}
          loading={globalLoading}
          icon={<Recycle className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
          info="Released certs sitting in the pool that still remember their previous owner. If that business reactivates before the cert is reassigned, it gets its exact cert back and installed cards keep working."
        />
        <StatCard
          label="Reclaim candidates"
          value={globalStats?.certs_reclaim_candidates}
          loading={globalLoading}
          icon={<RotateCcw className="h-4 w-4" />}
          badgeClass="bg-amber-100 text-amber-700"
          info="Inactive businesses (suspended or lapsed, not founding partners) that still hold a cert. The sweep warns and eventually releases these. See the table below."
        />
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Certificate
          </CardTitle>
          <CardDescription>
            Add a new .p12 certificate to the available pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lastUploaded && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{lastUploaded}</strong> was uploaded successfully and is
                now available in the pool.
              </span>
            </div>
          )}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="identifier">Pass Type Identifier</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  defaultValue="pass.com.stampeo.business"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_id">Team ID</Label>
                <Input
                  id="team_id"
                  name="team_id"
                  defaultValue="QQJF5895MC"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p12_file">.p12 Certificate File</Label>
                <Input
                  id="p12_file"
                  name="p12_file"
                  type="file"
                  accept=".p12,.pfx"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p12_password">
                  .p12 Password{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="p12_password"
                  name="p12_password"
                  type="password"
                  placeholder="Leave blank if none"
                />
              </div>
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload Certificate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certificate Table */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Pool</CardTitle>
          <CardDescription>
            {passTypeIds.length} certificate{passTypeIds.length !== 1 && "s"}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : passTypeIds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No certificates uploaded yet. Use the form above to upload one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Team ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passTypeIds.map((item) => {
                  const status =
                    statusConfig[item.status] ?? statusConfig.available;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.identifier}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.team_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.business_name ? (
                          <span>{item.business_name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.assigned_at
                          ? new Date(item.assigned_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status !== "revoked" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={revokingId === item.id}
                              >
                                {revokingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ShieldOff className="h-4 w-4" />
                                )}
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke Certificate
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke{" "}
                                  <strong>{item.identifier}</strong>? This will
                                  prevent the associated business from
                                  generating new passes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() =>
                                    handleRevoke(item.id, item.identifier)
                                  }
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Revoked
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reclaim candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reclaim candidates
          </CardTitle>
          <CardDescription>
            Inactive businesses still holding a cert. Segment A (no customers)
            auto-releases; B1/B2 are warned at T-30 / T-14, then released after
            both warnings. Use Release to approve early or override.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No reclaim candidates. Every assigned cert belongs to an active or
              protected business.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Inactive</TableHead>
                  <TableHead>Release</TableHead>
                  <TableHead>Warnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => {
                  const seg = segmentConfig[c.segment] ?? segmentConfig.A;
                  const overdue = c.days_until_release <= 0;
                  return (
                    <TableRow key={c.pass_type_id}>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {c.business_name ?? "—"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {c.identifier}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={seg.className}>
                          {seg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.days_since}d
                        <span className="block text-xs text-muted-foreground">
                          since {new Date(c.anchor_date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={overdue ? "font-medium text-red-600" : ""}>
                          {overdue ? "overdue" : `in ${c.days_until_release}d`}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(c.release_date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.segment === "A" ? (
                          <span className="text-muted-foreground">none (auto)</span>
                        ) : c.warnings_sent.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="font-medium">
                            {c.warnings_sent
                              .map((w) => `T-${w.replace("t", "")}`)
                              .sort()
                              .reverse()
                              .join(", ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.eligible_now ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700 border-amber-200"
                          >
                            Eligible now
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Waiting
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={releasingId === c.pass_type_id}
                            >
                              {releasingId === c.pass_type_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Recycle className="h-4 w-4" />
                              )}
                              Release
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Release certificate
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Release <strong>{c.identifier}</strong> from{" "}
                                <strong>{c.business_name ?? "this business"}</strong>{" "}
                                back into the pool?
                                {c.ever_had_customers && (
                                  <>
                                    {" "}
                                    This business had customers. The cert stays
                                    reclaimable by them until it is reassigned to
                                    someone else, after which their installed cards
                                    can no longer be updated.
                                  </>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRelease(c.pass_type_id, c.identifier)
                                }
                              >
                                Release
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="mb-2 font-semibold">How Pass Type IDs Work</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each business gets its own Apple Pass Type ID with isolated
              certificates. Certificates are uploaded here as .p12 files and
              stored AES-256-GCM encrypted. When a business activates their
              first card design, the next available certificate is
              auto-assigned.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">
              How to Generate a .p12 Certificate
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Go to Apple Developer &gt; Certificates, Identifiers &amp;
                Profiles
              </li>
              <li>
                Register a new Pass Type ID (e.g.,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  pass.com.stampeo.biz001
                </code>
                )
              </li>
              <li>Create a certificate for that Pass Type ID</li>
              <li>
                Download{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  .cer
                </code>
                , open in Keychain Access
              </li>
              <li>
                Export as{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  .p12
                </code>{" "}
                (include private key)
              </li>
              <li>Upload here with the identifier and your Team ID</li>
            </ol>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Testing Checklist</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Upload a .p12 &rarr; verify it appears in the table as
                &ldquo;available&rdquo;
              </li>
              <li>Check pool stats update correctly</li>
              <li>
                Activate a design for a business &rarr; verify cert
                auto-assigned (&ldquo;assigned&rdquo;)
              </li>
              <li>
                Generate a pass for that business &rarr; verify it uses the
                per-business cert
              </li>
              <li>
                Revoke a cert &rarr; verify status changes, business
                can&apos;t generate new passes
              </li>
              <li>
                Test with{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  PER_BUSINESS_CERTS_ENABLED=true
                </code>{" "}
                in backend
              </li>
            </ol>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
