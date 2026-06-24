"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchStudioVariant,
  StudioSpec,
  studioStripPreviewUrl,
} from "@/lib/api";
import {
  usePushStudio,
  useStudioVariants,
  useUpsertStudio,
} from "@/hooks/use-studio";

const QUICK_VALUES = [5, 76, 100, 500, 1000];
const SELECT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function StripEditorPage() {
  const list = useStudioVariants();
  const upsert = useUpsertStudio();
  const push = usePushStudio();

  const palette = list.data?.palette;
  const variants = list.data?.variants ?? [];
  const styles = palette?.points_strip_styles ?? [];

  const [style, setStyle] = useState("balance-left");
  const [value, setValue] = useState(76);
  const [goal, setGoal] = useState(100);
  const [bg, setBg] = useState("rgb(28, 28, 30)");
  const [fg, setFg] = useState("rgb(255, 255, 255)");
  const [accent, setAccent] = useState("rgb(249, 115, 22)");
  const [labelColor, setLabelColor] = useState("rgb(156, 163, 175)");
  const [applyTo, setApplyTo] = useState("");
  const [sending, setSending] = useState(false);

  const colors = { bg, fg, accent, label: labelColor };
  const previewUrl = (s: string) =>
    studioStripPreviewUrl({ style: s, value, goal, ...colors });

  async function sendToPhone() {
    if (!applyTo) {
      toast.error("Pick a variant to apply to first");
      return;
    }
    setSending(true);
    try {
      const detail = await fetchStudioVariant(applyTo);
      const rewards = detail.spec.rewards.length
        ? [{ ...detail.spec.rewards[0], threshold: goal }]
        : [{ threshold: goal, name: "Récompense" }];
      const spec: StudioSpec = {
        ...detail.spec,
        layout: { ...detail.layout, strip: style },
        background_color: bg,
        foreground_color: fg,
        accent_color: accent,
        label_color: labelColor,
        mock_value: value,
        rewards,
      };
      await upsert.mutateAsync({ id: applyTo, spec });
      await push.mutateAsync(applyTo);
      toast.success(`Saved & pushed to "${applyTo}"`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/studio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Card Studio
        </Link>
        <h1 className="text-2xl font-semibold">Strip editor — points</h1>
        <p className="text-sm text-muted-foreground">
          Pick a style, tweak it, watch it render live, then send it to your
          phone. Strips show only numbers we control (points + goal) — never a
          reward name, so long rewards can&apos;t break the layout.
        </p>
      </div>

      {/* live preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Live preview · {style}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl(style)}
            alt="strip preview"
            className="w-full rounded-lg"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* style gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Style</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {styles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`space-y-1 rounded-lg border p-1.5 text-left transition-colors ${
                    s === style
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl(s)}
                    alt={s}
                    className="w-full rounded"
                  />
                  <span className="block px-1 font-mono text-[10px] text-muted-foreground">
                    {s}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* test state */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Test values (preview different magnitudes)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Points
                  </Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value || 0))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Goal</Label>
                  <Input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value || 0))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_VALUES.map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant="outline"
                    onClick={() => setValue(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Colors</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <ColorField label="Background" value={bg} onChange={setBg} />
              <ColorField label="Accent" value={accent} onChange={setAccent} />
              <ColorField label="Foreground" value={fg} onChange={setFg} />
              <ColorField
                label="Muted label"
                value={labelColor}
                onChange={setLabelColor}
              />
            </CardContent>
          </Card>
        </div>

        {/* apply / send */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Send to my phone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Apply to variant
                </Label>
                <select
                  className={SELECT}
                  value={applyTo}
                  onChange={(e) => setApplyTo(e.target.value)}
                >
                  <option value="">Choose a variant…</option>
                  {variants.map((v) => (
                    <option key={v.spec.variant_id} value={v.spec.variant_id}>
                      {v.spec.label || v.spec.variant_id}
                      {v.installed ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full"
                onClick={sendToPhone}
                disabled={sending || !applyTo}
              >
                {sending ? "Sending…" : "Save & send to phone"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Applies this style + colors to the chosen variant and pushes the
                update. The phone must already have that pass installed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
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
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <span
          className="h-8 w-8 shrink-0 rounded border"
          style={{ backgroundColor: value }}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
