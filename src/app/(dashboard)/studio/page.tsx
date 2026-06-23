"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudioVariant, studioInstallUrl, studioStripUrl } from "@/lib/api";
import {
  usePushAllStudio,
  usePushStudio,
  useSeedStudio,
  useStudioHealth,
  useStudioVariants,
} from "@/hooks/use-studio";

import { InstallQR } from "./_components/install-qr";

export default function StudioPage() {
  const { data, isLoading } = useStudioVariants();
  const health = useStudioHealth();
  const seed = useSeedStudio();
  const pushOne = usePushStudio();
  const pushAll = usePushAllStudio();

  const variants = data?.variants ?? [];

  function handleSeed() {
    seed.mutate(undefined, {
      onSuccess: (r) => toast.success(`Seeded ${r.variants.length} variants`),
      onError: (e) => toast.error(String(e)),
    });
  }

  function handlePushAll() {
    pushAll.mutate(undefined, {
      onSuccess: (r) => toast.success(`Pushed ${r.pushed} installed variant(s)`),
      onError: (e) => toast.error(String(e)),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Card Studio</h1>
          <p className="text-sm text-muted-foreground">
            Design wallet cards (points &amp; tiered) and preview them live on a
            real phone. Dev-only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={seed.isPending}
          >
            {seed.isPending ? "Seeding…" : "Seed canonical set"}
          </Button>
          <Button onClick={handlePushAll} disabled={pushAll.isPending}>
            {pushAll.isPending ? "Pushing…" : "Push all to my phone"}
          </Button>
        </div>
      </div>

      <HealthBanner health={health.data} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading variants…</p>
      ) : variants.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No variants yet. Click <strong>Seed canonical set</strong> to create
            the starter designs.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {variants.map((v) => (
            <VariantCard
              key={v.spec.variant_id}
              variant={v}
              onPush={() =>
                pushOne.mutate(v.spec.variant_id, {
                  onSuccess: () => toast.success(`Pushed ${v.spec.variant_id}`),
                  onError: (e) => toast.error(String(e)),
                })
              }
              pushing={pushOne.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HealthBanner({
  health,
}: {
  health:
    | {
        is_tunnel: boolean;
        web_service_url: string;
        cert_ok: boolean;
        cert_error?: string;
        pass_type_identifier?: string;
        pool?: { available: number; assigned: number; total: number };
      }
    | undefined;
}) {
  if (!health) return null;
  const warn = !health.is_tunnel || !health.cert_ok;
  return (
    <Card className={warn ? "border-amber-500/50" : undefined}>
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
        <span className="flex items-center gap-2">
          <Dot ok={health.is_tunnel} />
          {health.is_tunnel ? "Tunnel up" : "No tunnel — passes won't update"}
        </span>
        <span className="flex items-center gap-2">
          <Dot ok={health.cert_ok} />
          {health.cert_ok
            ? `Cert: ${health.pass_type_identifier}`
            : `Cert error: ${health.cert_error ?? "unavailable"}`}
        </span>
        {health.pool && (
          <span className="text-muted-foreground">
            Pool: {health.pool.available} available / {health.pool.total} total
          </span>
        )}
        <span className="ml-auto truncate text-xs text-muted-foreground">
          {health.web_service_url}
        </span>
      </CardContent>
    </Card>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? "bg-emerald-500" : "bg-amber-500"
      }`}
    />
  );
}

function VariantCard({
  variant,
  onPush,
  pushing,
}: {
  variant: StudioVariant;
  onPush: () => void;
  pushing: boolean;
}) {
  const { spec, installed, updated_at } = variant;
  const [showQr, setShowQr] = useState(false);
  const tiered = spec.rewards.length > 1;
  const stripVisible = !spec.layout_template.startsWith("points-text");
  const installUrl = variant.install_url ?? studioInstallUrl(spec.variant_id);
  const stripBase = variant.strip_url ?? studioStripUrl(spec.variant_id);

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{spec.label}</CardTitle>
          <Badge variant={installed ? "default" : "outline"}>
            {installed ? "Installed" : "Not installed"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{spec.type}</Badge>
          {tiered && (
            <Badge variant="secondary">tiered · {spec.redemption_policy}</Badge>
          )}
          <Badge variant="outline" className="font-mono text-[10px]">
            {spec.layout_template}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {stripVisible ? (
          <StripPreview baseUrl={stripBase} cacheKey={updated_at ?? ""} />
        ) : (
          <div className="flex h-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
            Text-only layout (no strip)
          </div>
        )}
        {showQr && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <InstallQR url={installUrl} />
            <code className="break-all text-[10px] text-muted-foreground">
              {installUrl}
            </code>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowQr((s) => !s)}>
          {showQr ? "Hide QR" : "Install QR"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPush}
          disabled={!installed || pushing}
        >
          Push
        </Button>
        <Button size="sm" variant="ghost" asChild className="ml-auto">
          <Link href={`/studio/${spec.variant_id}`}>Edit</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function StripPreview({
  baseUrl,
  cacheKey,
}: {
  baseUrl: string;
  cacheKey: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="flex h-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
        Strip preview unavailable
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${baseUrl}?t=${encodeURIComponent(cacheKey)}`}
      alt="strip preview"
      className="w-full rounded"
      onError={() => setErrored(true)}
    />
  );
}
