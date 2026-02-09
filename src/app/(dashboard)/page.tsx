"use client";

import { useCallback, useEffect, useState } from "react";
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
import { fetchPoolStats, uploadCertificate, type PoolStats } from "@/lib/api";
import { Upload, Database, CheckCircle, XCircle, Loader2, BookOpen } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchPoolStats();
      setStats(data);
    } catch (err) {
      toast.error("Failed to load pool stats", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await uploadCertificate(formData);
      setLastUploaded(result.identifier);
      toast.success("Certificate uploaded successfully", {
        description: `${result.identifier} is now available in the pool`,
      });
      form.reset();
      loadStats();
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificate Pool</h1>
        <p className="text-muted-foreground">
          Manage Apple Pass Type ID certificates for per-business isolation.
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={stats?.total}
          loading={loading}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          label="Available"
          value={stats?.available}
          loading={loading}
          icon={<CheckCircle className="h-4 w-4" />}
          badgeClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Assigned"
          value={stats?.assigned}
          loading={loading}
          icon={<Upload className="h-4 w-4" />}
          badgeClass="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Revoked"
          value={stats?.revoked}
          loading={loading}
          icon={<XCircle className="h-4 w-4" />}
          badgeClass="bg-red-100 text-red-700"
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
                now available in the pool.{" "}
                <a href="/certificates" className="underline underline-offset-2">
                  View in Certificates
                </a>
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
                Upload a .p12 &rarr; verify it appears in Certificates tab as
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

function StatCard({
  label,
  value,
  loading,
  icon,
  badgeClass,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
  badgeClass?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" />
              ) : (
                value ?? 0
              )}
            </p>
          </div>
          <Badge
            className={badgeClass ?? "bg-secondary text-secondary-foreground"}
            variant="secondary"
          >
            {icon}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
