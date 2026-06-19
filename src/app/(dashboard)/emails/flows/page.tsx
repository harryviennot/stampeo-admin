"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  fetchEmailFlows,
  fetchEmailPreviewHtml,
  type EmailFlow,
  type EmailFlowStep,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Globe, ArrowRight, Clock, Zap, CalendarClock } from "lucide-react";

type Locale = "fr" | "en" | "es";

const TRIGGER_META: Record<
  string,
  { label: string; icon: typeof Clock }
> = {
  scheduled: { label: "Récurrent", icon: CalendarClock },
  sequence: { label: "Séquence", icon: Clock },
  event: { label: "Événement", icon: Zap },
};

export default function EmailFlowsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <EmailFlowsInner />
    </Suspense>
  );
}

interface SelectedPreview {
  category: string;
  name: string;
  ns?: string;
  label: string;
}

function EmailFlowsInner() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [selected, setSelected] = useState<SelectedPreview | null>(null);

  const { data: flows, isLoading } = useQuery({
    queryKey: adminKeys.emails.flows,
    queryFn: fetchEmailFlows,
  });

  const variantKey = selected?.ns ?? "";
  const { data: html, isLoading: previewLoading } = useQuery({
    queryKey: selected
      ? adminKeys.emails.preview(selected.category, selected.name, locale, variantKey)
      : ["emails", "preview", "none"],
    queryFn: () =>
      selected
        ? fetchEmailPreviewHtml(
            selected.category,
            selected.name,
            locale,
            selected.ns ? { ns: selected.ns } : undefined
          )
        : Promise.resolve(""),
    enabled: !!selected,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (iframeRef.current && html !== undefined) {
      iframeRef.current.srcdoc = html;
    }
  }, [html]);

  const stateById = useMemo(() => {
    const m: Record<string, EmailFlow> = {};
    for (const f of flows ?? []) m[f.state] = f;
    return m;
  }, [flows]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-semibold">Email flows</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
            <Globe className="ml-2 h-4 w-4 text-muted-foreground" />
            <LocaleButton label="FR" active={locale === "fr"} onClick={() => setLocale("fr")} />
            <LocaleButton label="EN" active={locale === "en"} onClick={() => setLocale("en")} />
            <LocaleButton label="ES" active={locale === "es"} onClick={() => setLocale("es")} />
          </div>
        </div>
      </header>

      <div className="flex gap-1 border-b">
        <Link
          href="/emails"
          className="border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Previews
        </Link>
        <span className="border-b-2 border-accent px-3 py-2 text-sm font-medium text-accent">
          Flows
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Qui reçoit quel email, quand. Cliquez sur un email pour le prévisualiser.
        Chaque état correspond à une étape du cycle de vie du compte.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            (flows ?? []).map((flow) => (
              <FlowCard
                key={flow.state}
                flow={flow}
                stateById={stateById}
                selected={selected}
                onSelect={setSelected}
              />
            ))
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border bg-background">
            {!selected ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Sélectionnez un email dans un flow pour le prévisualiser.
              </p>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <code className="text-xs text-muted-foreground">{selected.label}</code>
                  <span className="text-xs text-muted-foreground">
                    {locale.toUpperCase()} · {previewLoading ? "loading…" : "ready"}
                  </span>
                </div>
                <iframe
                  ref={iframeRef}
                  title={selected.label}
                  sandbox="allow-same-origin"
                  className="h-[calc(100vh-14rem)] w-full bg-[#F6F1E6]"
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FlowCard({
  flow,
  stateById,
  selected,
  onSelect,
}: {
  flow: EmailFlow;
  stateById: Record<string, EmailFlow>;
  selected: SelectedPreview | null;
  onSelect: (s: SelectedPreview) => void;
}) {
  const trigger = TRIGGER_META[flow.trigger] ?? TRIGGER_META.sequence;
  const TriggerIcon = trigger.icon;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{flow.title}</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <TriggerIcon className="h-3 w-3" />
          {trigger.label}
          {flow.cadence ? ` · ${flow.cadence}` : ""}
          {flow.cadence_days ? ` · ~${flow.cadence_days}j` : ""}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{flow.description}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">
        <span className="font-medium">Entrée :</span> {flow.entry_condition}
        {flow.anchor ? ` · ancre : ${flow.anchor}` : ""}
      </p>

      {flow.steps.length > 0 && (
        <div className="mt-3 flex flex-wrap items-stretch gap-2">
          {flow.steps.map((step, i) => (
            <div key={`${step.email_key}-${i}`} className="flex items-stretch gap-2">
              <StepNode
                step={step}
                selected={
                  !!selected &&
                  step.preview != null &&
                  selected.category === step.preview.category &&
                  selected.name === step.preview.name &&
                  (selected.ns ?? "") === (step.preview.ns ?? "")
                }
                onSelect={onSelect}
              />
              {i < flow.steps.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>
      )}

      {flow.transitions_to.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground/70">
          <span className="font-medium">Puis :</span>{" "}
          {flow.transitions_to.map((t) => stateById[t]?.title ?? t).join(" · ")}
        </p>
      )}
    </div>
  );
}

function StepNode({
  step,
  selected,
  onSelect,
}: {
  step: EmailFlowStep;
  selected: boolean;
  onSelect: (s: SelectedPreview) => void;
}) {
  const clickable = step.preview != null && !step.deferred;
  const body = (
    <>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold">{step.label}</span>
        {step.format === "plain" && (
          <span className="rounded bg-muted px-1 text-[9px] font-medium uppercase text-muted-foreground">
            texte
          </span>
        )}
        {step.seasonal && (
          <span className="rounded bg-amber-100 px-1 text-[9px] font-medium uppercase text-amber-700">
            saison
          </span>
        )}
        {step.deferred && (
          <span className="rounded bg-muted px-1 text-[9px] font-medium uppercase text-muted-foreground">
            à venir
          </span>
        )}
      </div>
      <code className="mt-0.5 block max-w-[160px] truncate text-[10px] text-muted-foreground">
        {step.email_key}
      </code>
      {step.note && (
        <p className="mt-1 max-w-[180px] text-[10px] leading-snug text-muted-foreground/70">
          {step.note}
        </p>
      )}
    </>
  );

  if (!clickable) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 opacity-70">
        {body}
      </div>
    );
  }

  return (
    <button
      onClick={() =>
        step.preview &&
        onSelect({
          category: step.preview.category,
          name: step.preview.name,
          ns: step.preview.ns,
          label: step.preview.ns
            ? `${step.preview.category}/${step.preview.name} · ${step.preview.ns}`
            : `${step.preview.category}/${step.preview.name}`,
        })
      }
      className={cn(
        "rounded-md border px-3 py-2 text-left transition-colors hover:border-accent hover:bg-accent/5",
        selected ? "border-accent bg-accent/10" : "border-border bg-background"
      )}
    >
      {body}
    </button>
  );
}

function LocaleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className="h-7 px-3"
    >
      {label}
    </Button>
  );
}
