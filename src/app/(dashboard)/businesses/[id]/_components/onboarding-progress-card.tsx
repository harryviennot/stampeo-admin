"use client";

import {
  Check,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  PauseCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Business, SetupProgressStep } from "@/lib/api";

// Mirrors web/src/components/onboarding/registry.ts (WIZARD_CHAPTERS) and the
// CHAPTER_STEPS array in setup-wizard-funnel-chart.tsx. Keep ordering in sync
// if the wizard adds, removes, or reorders chapters.
const CHAPTERS: Array<{ key: string; label: string; steps: string[] }> = [
  { key: "welcome",         label: "Welcome",         steps: ["welcome"] },
  { key: "business",        label: "Business",        steps: ["identity", "profile"] },
  { key: "program",         label: "Program",         steps: ["program", "data-collection"] },
  { key: "card-back",       label: "Card back",       steps: ["intro", "info"] },
  { key: "design",          label: "Design",          steps: ["branding", "stamps", "content", "back"] },
  { key: "notifications",   label: "Notifications",   steps: ["icon"] },
  { key: "first-stamp",     label: "First stamp",     steps: ["install", "stamp"] },
  { key: "first-broadcast", label: "First broadcast", steps: ["intro", "compose"] },
  { key: "team",            label: "Team",            steps: ["team"] },
  { key: "recap",           label: "Recap",           steps: ["recap"] },
  { key: "plan",            label: "Plan",            steps: ["plan"] },
];

const CHAPTER_LABEL = new Map(CHAPTERS.map((c) => [c.key, c.label]));

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stepKey(s: SetupProgressStep): string {
  return `${s.chapter}/${s.step}`;
}

export function OnboardingProgressCard({ business }: { business: Business }) {
  const progress = business.setup_progress;
  const completedSteps = progress?.completed ?? [];
  const lastStep = progress?.last_step ?? null;
  const startedAt = formatDate(progress?.started_at);
  const completedAt = formatDate(progress?.completed_at);
  const isCompleted = Boolean(progress?.completed_at);
  const hasStarted = completedSteps.length > 0 || Boolean(lastStep);

  const completedKeys = new Set(completedSteps.map(stepKey));
  const completedChapters = new Set<string>();
  for (const c of CHAPTERS) {
    if (c.steps.every((s) => completedKeys.has(`${c.key}/${s}`))) {
      completedChapters.add(c.key);
    }
  }

  // Unknown chapters returned by backend but missing from the canonical list —
  // surfaced at the end so admin still sees them if the wizard evolves.
  const knownChapterKeys = new Set(CHAPTERS.map((c) => c.key));
  const unknownChapters = new Set<string>();
  for (const s of completedSteps) {
    if (!knownChapterKeys.has(s.chapter)) unknownChapters.add(s.chapter);
  }
  if (lastStep && !knownChapterKeys.has(lastStep.chapter)) {
    unknownChapters.add(lastStep.chapter);
  }

  const stoppedAtLabel = lastStep
    ? CHAPTER_LABEL.get(lastStep.chapter) ?? lastStep.chapter
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Onboarding</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Post-signup setup wizard progress
          </p>
        </div>
        <StatusBadge
          isCompleted={isCompleted}
          hasStarted={hasStarted}
          stoppedAtLabel={stoppedAtLabel}
        />
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasStarted && !isCompleted ? (
          <p className="text-sm text-muted-foreground">
            This business hasn&apos;t opened the setup wizard yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Metric label="Started" value={startedAt ?? "—"} />
              <Metric
                label={isCompleted ? "Completed" : "Last step"}
                value={
                  isCompleted
                    ? completedAt ?? "—"
                    : lastStep
                      ? `${stoppedAtLabel} · ${lastStep.step}`
                      : "—"
                }
              />
              <Metric
                label="Steps completed"
                value={`${completedSteps.length}`}
              />
            </div>

            <ol className="space-y-2">
              {CHAPTERS.map((chapter) => {
                const done = completedChapters.has(chapter.key);
                const current =
                  !isCompleted && lastStep?.chapter === chapter.key;
                const stepDoneCount = chapter.steps.filter((s) =>
                  completedKeys.has(`${chapter.key}/${s}`),
                ).length;
                return (
                  <li
                    key={chapter.key}
                    className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                  >
                    <ChapterIcon done={done} current={current} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={
                            done
                              ? "text-sm font-medium"
                              : current
                                ? "text-sm font-medium text-amber-700"
                                : "text-sm text-muted-foreground"
                          }
                        >
                          {chapter.label}
                        </span>
                        {current && (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                            Stopped here
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {stepDoneCount}/{chapter.steps.length}
                    </span>
                  </li>
                );
              })}
              {Array.from(unknownChapters).map((chapterKey) => (
                <li
                  key={`unknown-${chapterKey}`}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <ChapterIcon
                    done={false}
                    current={lastStep?.chapter === chapterKey}
                  />
                  <span className="text-sm text-muted-foreground font-mono">
                    {chapterKey}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  isCompleted,
  hasStarted,
  stoppedAtLabel,
}: {
  isCompleted: boolean;
  hasStarted: boolean;
  stoppedAtLabel: string | null;
}) {
  if (isCompleted) {
    return (
      <Pill tone="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
        Completed
      </Pill>
    );
  }
  if (hasStarted) {
    return (
      <Pill tone="amber" icon={<PauseCircle className="h-3.5 w-3.5" />}>
        {stoppedAtLabel ? `Stopped at ${stoppedAtLabel}` : "In progress"}
      </Pill>
    );
  }
  return (
    <Pill tone="zinc" icon={<CircleDashed className="h-3.5 w-3.5" />}>
      Not started
    </Pill>
  );
}

function Pill({
  tone,
  icon,
  children,
}: {
  tone: "emerald" | "amber" | "zinc";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-zinc-50 text-zinc-600 border-zinc-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}

function ChapterIcon({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (current) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <CircleDot className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
      <CircleDashed className="h-3 w-3" />
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
