"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  fetchEmailPreviewHtml,
  fetchEmailTemplates,
  type EmailTemplateRef,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Globe } from "lucide-react";

type Locale = "fr" | "en" | "es";

const CATEGORY_ORDER = ["transactional", "lifecycle", "campaigns"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  transactional: "Transactional",
  lifecycle: "Lifecycle",
  campaigns: "Campaigns",
};
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  transactional: "Triggered by a direct user action",
  lifecycle: "Automated drip based on time or state",
  campaigns: "One-shot manual blasts",
};

// Winback / reclaim emails lead with the business's own numbers. For a
// business that never got a customer those are all zero, so each has a
// "never activated" variant (backend `?empty=true`). Let reviewers see it.
const EMPTY_CAPABLE = new Set([
  "lifecycle/winback/winback_s1",
  "lifecycle/winback/winback_s2",
  "lifecycle/reclaim/reclaim_warning_t30",
  "lifecycle/reclaim/reclaim_warning_t14",
]);

export default function EmailsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <EmailsPageInner />
    </Suspense>
  );
}

function EmailsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateParam = searchParams.get("template");
  const localeParam = (searchParams.get("locale") as Locale | null) ?? "fr";
  const [locale, setLocale] = useState<Locale>(
    localeParam === "en" ? "en" : localeParam === "es" ? "es" : "fr"
  );

  // Variant knobs for the parameterized previews (digest tone / insight /
  // action). Let reviewers see e.g. a "down" week without a live send.
  const [health, setHealth] = useState<"up" | "steady" | "down">("up");
  const [insight, setInsight] = useState<
    "classic" | "segments" | "trend" | "milestone"
  >("milestone");
  const [action, setAction] = useState<string>("close_to_reward");
  // Activity toggle for winback/reclaim: false = real numbers, true = never
  // activated (all metrics zero, shows the encouraging/soft variant).
  const [empty, setEmpty] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: adminKeys.emails.list,
    queryFn: fetchEmailTemplates,
  });

  // Default-select the first template once templates load.
  useEffect(() => {
    if (!templateParam && templates && templates.length > 0) {
      const first = templates[0];
      const params = new URLSearchParams(searchParams.toString());
      params.set("template", `${first.category}/${first.name}`);
      params.set("locale", locale);
      router.replace(`/emails?${params.toString()}`);
    }
  }, [templates, templateParam, locale, router, searchParams]);

  const selected = useMemo<EmailTemplateRef | null>(() => {
    if (!templateParam) return null;
    // Split on the FIRST slash only: the name can contain a subfolder
    // (e.g. "digest/weekly_digest"), which the backend serves via a :path param.
    const idx = templateParam.indexOf("/");
    if (idx < 0) return null;
    const category = templateParam.slice(0, idx);
    const name = templateParam.slice(idx + 1);
    if (!category || !name) return null;
    return { category, name };
  }, [templateParam]);

  const templateKey = selected ? `${selected.category}/${selected.name}` : "";
  const isDigest =
    templateKey === "lifecycle/digest/weekly_digest" ||
    templateKey === "lifecycle/digest/monthly_recap";
  const supportsEmpty = EMPTY_CAPABLE.has(templateKey);
  const variantParams = useMemo<Record<string, string> | undefined>(() => {
    if (templateKey === "lifecycle/digest/weekly_digest")
      return { health, insight, action } as Record<string, string>;
    if (templateKey === "lifecycle/digest/monthly_recap")
      return { health } as Record<string, string>;
    if (EMPTY_CAPABLE.has(templateKey))
      return (empty ? { empty: "true" } : {}) as Record<string, string>;
    return undefined;
  }, [templateKey, health, insight, action, empty]);
  const variantKey = variantParams ? JSON.stringify(variantParams) : "";

  const { data: html, isLoading: previewLoading } = useQuery({
    queryKey: selected
      ? adminKeys.emails.preview(selected.category, selected.name, locale, variantKey)
      : ["emails", "preview", "none"],
    queryFn: () =>
      selected
        ? fetchEmailPreviewHtml(selected.category, selected.name, locale, variantParams)
        : Promise.resolve(""),
    enabled: !!selected,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // `srcdoc` works for our auth model — backend returns HTML to an
  // authenticated fetch, and we hand it to the iframe directly. No second
  // auth round-trip from the iframe.
  useEffect(() => {
    if (iframeRef.current && html !== undefined) {
      iframeRef.current.srcdoc = html;
    }
  }, [html]);

  function selectTemplate(category: string, name: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("template", `${category}/${name}`);
    params.set("locale", locale);
    router.replace(`/emails?${params.toString()}`);
  }

  function changeLocale(next: Locale) {
    setLocale(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", next);
    router.replace(`/emails?${params.toString()}`);
  }

  const grouped = useMemo(() => {
    const out: Record<string, EmailTemplateRef[]> = {};
    for (const t of templates ?? []) {
      (out[t.category] ??= []).push(t);
    }
    return out;
  }, [templates]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-semibold">Email previews</h1>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          <Globe className="ml-2 h-4 w-4 text-muted-foreground" />
          <LocaleButton
            label="FR"
            active={locale === "fr"}
            onClick={() => changeLocale("fr")}
          />
          <LocaleButton
            label="EN"
            active={locale === "en"}
            onClick={() => changeLocale("en")}
          />
          <LocaleButton
            label="ES"
            active={locale === "es"}
            onClick={() => changeLocale("es")}
          />
        </div>
      </header>

      <div className="flex gap-1 border-b">
        <span className="border-b-2 border-accent px-3 py-2 text-sm font-medium text-accent">
          Previews
        </span>
        <Link
          href="/emails/flows"
          className="border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Flows
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-background">
          {templatesLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <nav className="p-2">
              {CATEGORY_ORDER.map((cat) => {
                const items = grouped[cat];
                if (!items || items.length === 0) return null;
                return (
                  <div key={cat} className="mb-3 last:mb-0">
                    <div className="px-2 pt-2 pb-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70">
                        {CATEGORY_DESCRIPTIONS[cat] ?? ""}
                      </p>
                    </div>
                    {items.map((t) => {
                      const key = `${t.category}/${t.name}`;
                      const isSelected =
                        selected?.category === t.category &&
                        selected?.name === t.name;
                      return (
                        <button
                          key={key}
                          onClick={() => selectTemplate(t.category, t.name)}
                          className={cn(
                            "block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          )}
        </aside>

        <section className="rounded-lg border bg-background">
          {!selected ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Select a template to preview.
            </p>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
                <code className="text-xs text-muted-foreground">
                  {selected.category}/{selected.name}
                </code>
                <span className="text-xs text-muted-foreground">
                  {locale.toUpperCase()} · {previewLoading ? "loading…" : "ready"}
                </span>
              </div>

              {variantParams && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/30 px-4 py-2">
                  {isDigest && (
                    <ChipGroup
                      label="Tone"
                      value={health}
                      options={[
                        { value: "up", label: "Growth" },
                        { value: "steady", label: "Steady" },
                        { value: "down", label: "Down" },
                      ]}
                      onChange={(v) => setHealth(v as typeof health)}
                    />
                  )}
                  {supportsEmpty && (
                    <ChipGroup
                      label="Activity"
                      value={empty ? "empty" : "active"}
                      options={[
                        { value: "active", label: "Has activity" },
                        { value: "empty", label: "Never activated (0)" },
                      ]}
                      onChange={(v) => setEmpty(v === "empty")}
                    />
                  )}
                  {templateKey === "lifecycle/digest/weekly_digest" && (
                    <>
                      <ChipGroup
                        label="Insight"
                        value={insight}
                        options={[
                          { value: "classic", label: "Classic" },
                          { value: "segments", label: "Segments" },
                          { value: "trend", label: "Trend" },
                          { value: "milestone", label: "Milestone" },
                        ]}
                        onChange={(v) => setInsight(v as typeof insight)}
                      />
                      <ChipGroup
                        label="Action"
                        value={action}
                        options={[
                          { value: "event", label: "Event" },
                          { value: "close_to_reward", label: "Close to reward" },
                          { value: "at_risk", label: "At risk" },
                          { value: "first_broadcast", label: "First broadcast" },
                          { value: "acquisition", label: "Acquisition" },
                          { value: "reward_distance", label: "Reward distance" },
                          { value: "milestone", label: "Milestone" },
                          { value: "generic", label: "Generic" },
                        ]}
                        onChange={setAction}
                      />
                    </>
                  )}
                </div>
              )}

              <iframe
                ref={iframeRef}
                title={`${selected.category}/${selected.name} (${locale})`}
                sandbox="allow-same-origin"
                className="h-[calc(100vh-12rem)] w-full bg-[#F6F1E6]"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              value === opt.value
                ? "border-accent bg-accent/10 font-medium text-accent"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
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
