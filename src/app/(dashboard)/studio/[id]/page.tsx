"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutConfig,
  StudioPalette,
  StudioSpec,
  studioInstallUrl,
  studioStripUrl,
} from "@/lib/api";
import {
  useDeleteStudio,
  usePushStudio,
  useStudioVariant,
  useStudioVariants,
  useUpsertStudio,
} from "@/hooks/use-studio";

import { InstallQR } from "../_components/install-qr";

const SLOT_LABELS: Record<string, string> = {
  header: "Header (top-right · glanceable)",
  primary: "Primary (big · hidden when a strip is set)",
  secondary: "Secondary (row below)",
  auxiliary: "Auxiliary (row below)",
  back: "Back of card",
};

const SELECT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function EditStudioVariant() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useStudioVariant(id);
  const list = useStudioVariants();
  const upsert = useUpsertStudio();
  const push = usePushStudio();
  const del = useDeleteStudio();

  const [spec, setSpec] = useState<StudioSpec | null>(null);
  const [version, setVersion] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // Seed the editor with the effective layout (custom, else the preset's).
    if (data?.spec) setSpec({ ...data.spec, layout: data.spec.layout ?? data.layout });
  }, [data]);

  if (isLoading || !spec) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const palette = list.data?.palette;
  const installUrl = data?.install_url ?? studioInstallUrl(id);
  const stripBase = data?.strip_url ?? studioStripUrl(id);
  const update = (patch: Partial<StudioSpec>) =>
    setSpec((s) => (s ? { ...s, ...patch } : s));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  function loadPreset(name: string) {
    const preset = palette?.presets[name];
    if (!preset) return;
    update({ layout_template: name, layout: { ...preset } });
  }

  function save() {
    if (!spec) return;
    upsert.mutate(
      { id, spec },
      {
        onSuccess: () => {
          toast.success("Saved");
          setVersion((v) => v + 1);
        },
        onError: (e) => toast.error(String(e)),
      }
    );
  }

  function pushToPhone() {
    push.mutate(id, {
      onSuccess: () => toast.success("Pushed"),
      onError: (e) => toast.error(String(e)),
    });
  }

  function remove() {
    del.mutate(id, {
      onSuccess: () => {
        toast.success("Deleted");
        router.push("/studio");
      },
      onError: (e) => toast.error(String(e)),
    });
  }

  const stripVisible = (spec.layout?.strip ?? "none") !== "none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/studio"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Card Studio
          </Link>
          <h1 className="text-2xl font-semibold">{spec.label || id}</h1>
          <code className="text-xs text-muted-foreground">{id}</code>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={pushToPhone} disabled={push.isPending}>
            Push to my phone
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── form ── */}
        <div className="space-y-6">
          <Section title="Program">
            <Field label="Label">
              <Input
                value={spec.label}
                onChange={(e) => update({ label: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  className={SELECT}
                  value={spec.type}
                  onChange={(e) =>
                    update({ type: e.target.value as StudioSpec["type"] })
                  }
                >
                  <option value="points">points</option>
                  <option value="stamp">stamp</option>
                </select>
              </Field>
              <Field label="Redemption policy">
                <select
                  className={SELECT}
                  value={spec.redemption_policy}
                  onChange={(e) =>
                    update({
                      redemption_policy: e.target
                        .value as StudioSpec["redemption_policy"],
                    })
                  }
                >
                  <option value="reset">reset</option>
                  <option value="stack">stack</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {spec.type === "points" && (
                <Field label="Points per currency unit">
                  <Input
                    type="number"
                    value={spec.points_per_currency_unit}
                    onChange={(e) =>
                      update({ points_per_currency_unit: num(e.target.value) })
                    }
                  />
                </Field>
              )}
              <Field label="Primary locale">
                <select
                  className={SELECT}
                  value={spec.primary_locale}
                  onChange={(e) => update({ primary_locale: e.target.value })}
                >
                  <option value="fr">fr</option>
                  <option value="en">en</option>
                  <option value="es">es</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Layout — choose what goes where">
            <Field label="Start from a preset">
              <select
                className={SELECT}
                value=""
                onChange={(e) => e.target.value && loadPreset(e.target.value)}
              >
                <option value="">Load preset…</option>
                {Object.keys(palette?.presets ?? {}).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            {palette && spec.layout ? (
              <LayoutEditor
                layout={spec.layout}
                palette={palette}
                onChange={(layout) => update({ layout })}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Loading palette…</p>
            )}
          </Section>

          <Section title="Reward ladder">
            <RewardEditor
              rewards={spec.rewards}
              onChange={(rewards) => update({ rewards })}
            />
          </Section>

          <Section title="Branding">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Organization name">
                <Input
                  value={spec.organization_name}
                  onChange={(e) =>
                    update({ organization_name: e.target.value })
                  }
                />
              </Field>
              <Field label="Logo text">
                <Input
                  value={spec.logo_text}
                  onChange={(e) => update({ logo_text: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Background"
                value={spec.background_color}
                onChange={(v) => update({ background_color: v })}
              />
              <ColorField
                label="Accent"
                value={spec.accent_color}
                onChange={(v) => update({ accent_color: v })}
              />
              <ColorField
                label="Foreground"
                value={spec.foreground_color}
                onChange={(v) => update({ foreground_color: v })}
              />
              <ColorField
                label="Label"
                value={spec.label_color}
                onChange={(v) => update({ label_color: v })}
              />
            </div>
          </Section>

          <Section title="Mock state (what to render)">
            <div className="grid grid-cols-3 gap-3">
              <Field label={spec.type === "points" ? "Balance" : "Stamps"}>
                <Input
                  type="number"
                  value={spec.mock_value}
                  onChange={(e) => update({ mock_value: num(e.target.value) })}
                />
              </Field>
              <Field label="Lifetime">
                <Input
                  type="number"
                  value={spec.mock_lifetime}
                  onChange={(e) =>
                    update({ mock_lifetime: num(e.target.value) })
                  }
                />
              </Field>
              <Field label="Banked">
                <Input
                  type="number"
                  value={spec.mock_banked_rewards}
                  onChange={(e) =>
                    update({ mock_banked_rewards: num(e.target.value) })
                  }
                />
              </Field>
            </div>
            <Field label="Customer name">
              <Input
                value={spec.customer_name}
                onChange={(e) => update({ customer_name: e.target.value })}
              />
            </Field>
          </Section>

          <div className="pt-2">
            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              size="sm"
              onClick={() =>
                confirmDelete ? remove() : setConfirmDelete(true)
              }
              disabled={del.isPending}
            >
              {confirmDelete ? "Confirm delete" : "Delete variant"}
            </Button>
          </div>
        </div>

        {/* ── live preview ── */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Strip preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stripVisible ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${stripBase}?v=${version}`}
                  alt="strip preview"
                  className="w-full rounded"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  Text-only layout (no strip)
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Save first, then this preview refreshes. Push to update an
                installed pass on your phone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Install</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <InstallQR url={installUrl} size={200} />
              <code className="break-all text-center text-[10px] text-muted-foreground">
                {installUrl}
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <span
          className="h-8 w-8 shrink-0 rounded border"
          style={{ backgroundColor: value }}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

function RewardEditor({
  rewards,
  onChange,
}: {
  rewards: { threshold: number; name: string }[];
  onChange: (r: { threshold: number; name: string }[]) => void;
}) {
  function set(i: number, patch: Partial<{ threshold: number; name: string }>) {
    onChange(rewards.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  return (
    <div className="space-y-2">
      {rewards.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="number"
            className="w-24"
            value={r.threshold}
            onChange={(e) =>
              set(i, { threshold: Number(e.target.value || 0) })
            }
          />
          <Input
            value={r.name}
            placeholder="Reward name"
            onChange={(e) => set(i, { name: e.target.value })}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(rewards.filter((_, idx) => idx !== i))}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...rewards, { threshold: 0, name: "" }])
        }
      >
        Add reward
      </Button>
    </div>
  );
}

function LayoutEditor({
  layout,
  palette,
  onChange,
}: {
  layout: LayoutConfig;
  palette: StudioPalette;
  onChange: (l: LayoutConfig) => void;
}) {
  const stripPresent = layout.strip !== "none";
  const label = (key: string) =>
    palette.elements.find((e) => e.key === key)?.label ?? key;
  const keysOf = (slot: string) =>
    ((layout as unknown as Record<string, string[]>)[slot] ?? []) as string[];
  const setSlot = (slot: string, keys: string[]) =>
    onChange({ ...layout, [slot]: keys } as LayoutConfig);
  const add = (slot: string, key: string) => {
    if (key) setSlot(slot, [...keysOf(slot), key]);
  };
  const remove = (slot: string, idx: number) =>
    setSlot(
      slot,
      keysOf(slot).filter((_, i) => i !== idx)
    );
  const move = (slot: string, idx: number, dir: -1 | 1) => {
    const arr = [...keysOf(slot)];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setSlot(slot, arr);
  };
  const avail = (slot: string) =>
    palette.elements.filter(
      (e) => e.slots.includes(slot) && !keysOf(slot).includes(e.key)
    );

  return (
    <div className="space-y-4">
      <Field label="Strip style">
        <select
          className={SELECT}
          value={layout.strip}
          onChange={(e) => onChange({ ...layout, strip: e.target.value })}
        >
          {palette.strips.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      {palette.slots.map((slot) => {
        const disabled = slot === "primary" && stripPresent;
        return (
          <div key={slot} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {SLOT_LABELS[slot] ?? slot}
            </Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {keysOf(slot).map((key, idx) => (
                <span
                  key={`${key}-${idx}`}
                  className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                >
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => move(slot, idx, -1)}
                    aria-label="Move earlier"
                  >
                    ↑
                  </button>
                  <span>{label(key)}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => remove(slot, idx)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {disabled ? (
                <span className="text-xs text-muted-foreground">
                  hidden — the strip occupies this area
                </span>
              ) : (
                avail(slot).length > 0 && (
                  <select
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                    value=""
                    onChange={(e) => add(slot, e.target.value)}
                  >
                    <option value="">+ add…</option>
                    {avail(slot).map((e) => (
                      <option key={e.key} value={e.key}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
