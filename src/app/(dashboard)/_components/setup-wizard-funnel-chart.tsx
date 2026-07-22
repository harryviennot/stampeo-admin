"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useSetupWizardFunnel } from "@/hooks/use-stats";

// Single source of truth for the "below sm" breakpoint — matches Tailwind's
// default `sm` (640px). Mirrors how the dashboard's grid switches layouts.
function useIsNarrow(maxWidth = 640) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);
  return narrow;
}

// Canonical wizard order — mirrors web/src/components/onboarding/registry.ts
// (WIZARD_CHAPTERS). If a chapter/step is added or reordered there, mirror the
// change here. The chart silently drops counts for tuples not listed below.
//
// `label` is the full label shown on wide screens; `shortLabel` collapses the
// chapter prefix down to an abbreviation (or omits it) so the YAxis stays
// legible on narrow screens. Chapter is still encoded via per-bar colour.
const CHAPTER_STEPS: Array<{
  chapter: string;
  step: string;
  label: string;
  shortLabel: string;
}> = [
  { chapter: "welcome",         step: "welcome",         label: "Welcome",                       shortLabel: "Welcome" },
  { chapter: "business",        step: "identity",        label: "Business · Identity",           shortLabel: "B · Identity" },
  { chapter: "business",        step: "profile",         label: "Business · Profile",            shortLabel: "B · Profile" },
  { chapter: "program",         step: "program",         label: "Program · Setup",               shortLabel: "P · Setup" },
  { chapter: "program",         step: "data-collection", label: "Program · Data collection",     shortLabel: "P · Data" },
  { chapter: "card-back",       step: "intro",           label: "Card back · Intro",             shortLabel: "CB · Intro" },
  { chapter: "card-back",       step: "info",            label: "Card back · Info",              shortLabel: "CB · Info" },
  { chapter: "design",          step: "branding",        label: "Design · Branding",             shortLabel: "D · Branding" },
  { chapter: "design",          step: "stamps",          label: "Design · Stamps",               shortLabel: "D · Stamps" },
  { chapter: "design",          step: "content",         label: "Design · Content",              shortLabel: "D · Content" },
  { chapter: "design",          step: "back",            label: "Design · Back",                 shortLabel: "D · Back" },
  { chapter: "notifications",   step: "icon",            label: "Notifications · Icon",          shortLabel: "N · Icon" },
  { chapter: "first-stamp",     step: "install",         label: "First scan · Install",          shortLabel: "FS · Install" },
  { chapter: "first-stamp",     step: "stamp",           label: "First scan · Scan",             shortLabel: "FS · Scan" },
  { chapter: "first-broadcast", step: "intro",           label: "First broadcast · Intro",       shortLabel: "FB · Intro" },
  { chapter: "first-broadcast", step: "compose",         label: "First broadcast · Compose",     shortLabel: "FB · Compose" },
  { chapter: "team",            step: "team",            label: "Team",                          shortLabel: "Team" },
  { chapter: "recap",           step: "recap",           label: "Recap",                         shortLabel: "Recap" },
  { chapter: "plan",            step: "plan",            label: "Plan",                          shortLabel: "Plan" },
  // Synthetic terminal bar — businesses that attached a card. Scoped to the
  // card-upfront cohort, so it's NOT comparable to the steps above (which count
  // every started business); its drop-off colour is suppressed below.
  { chapter: "billing",         step: "card",            label: "Card attached (card-upfront)",  shortLabel: "Card" },
];

// Per-chapter colour for visual grouping in the bar chart.
const CHAPTER_COLOURS: Record<string, string> = {
  welcome:           "#94A3B8",
  business:          "#6366F1",
  program:           "#0EA5E9",
  "card-back":       "#10B981",
  design:            "#F59E0B",
  notifications:     "#A855F7",
  "first-stamp":     "#EF4444",
  "first-broadcast": "#EC4899",
  team:              "#14B8A6",
  recap:             "#84CC16",
  plan:              "#3B82F6",
  billing:           "#1A1614", // brand dark — distinct terminal bar
};

const config: ChartConfig = {
  reached: { label: "Reached", color: "var(--chart-1)" },
};

export function SetupWizardFunnelChart() {
  const { data, isPending } = useSetupWizardFunnel({ range: "90d" });
  const narrow = useIsNarrow();

  const reachedByKey = new Map<string, number>();
  for (const s of data?.steps ?? []) {
    reachedByKey.set(`${s.chapter}/${s.step}`, s.reached);
  }

  const stuckByKey = new Map<string, number>();
  for (const s of data?.stuck ?? []) {
    stuckByKey.set(`${s.chapter}/${s.step}`, s.count);
  }
  const stuckRows = CHAPTER_STEPS.map((cs) => ({
    key: `${cs.chapter}/${cs.step}`,
    label: narrow ? cs.shortLabel : cs.label,
    count: stuckByKey.get(`${cs.chapter}/${cs.step}`) ?? 0,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const chartData = CHAPTER_STEPS.map((cs, i) => {
    const reached = reachedByKey.get(`${cs.chapter}/${cs.step}`) ?? 0;
    const prev =
      i === 0 ? reached : (reachedByKey.get(
        `${CHAPTER_STEPS[i - 1].chapter}/${CHAPTER_STEPS[i - 1].step}`
      ) ?? 0);
    // The terminal "card attached" bar counts a different (card-upfront only)
    // cohort, so a drop-off vs the prior step would be meaningless — suppress it.
    const dropoff =
      cs.chapter === "billing"
        ? null
        : prev > 0 && i > 0
          ? Math.round(((prev - reached) / prev) * 100)
          : null;
    return {
      key: `${cs.chapter}/${cs.step}`,
      label: narrow ? cs.shortLabel : cs.label,
      reached,
      dropoff,
      fill: CHAPTER_COLOURS[cs.chapter] ?? "var(--chart-1)",
    };
  });

  const started = data?.started ?? 0;
  const completed = data?.completed ?? 0;
  const cardUpfrontStarted = data?.card_upfront_started ?? 0;
  const cardAttached = data?.card_attached ?? 0;
  const overallConv =
    started > 0 ? Math.round((completed / started) * 100) : null;

  return (
    <ChartCard
      title="Setup wizard funnel (post-signup)"
      subtitle="Last 90 days · in-app activation chapters & steps"
      info={
        <>
          <p className="font-medium text-foreground">
            Post-signup in-app activation wizard
          </p>
          <p className="mt-1 text-muted-foreground">
            A real funnel of{" "}
            <span className="font-medium">settings.setup_progress</span> — the
            in-app wizard that runs after a business is created. Each bar is{" "}
            <span className="font-medium">reached at least this far</span>: per
            business we take the furthest step reached (completed ∪ skipped ∪
            last_step) and count it for every earlier step, so the curve is
            monotonic and immune to out-of-order completion, the install-step
            self-revert, and conditionally-hidden chapters (e.g. team for solo
            owners) reading as drops. Distinct from the pre-signup{" "}
            <span className="font-medium">onboarding funnel</span> above.
          </p>
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Started</span>{" "}
            counts businesses with at least one completed step (excludes
            migration-74 backfill rows). <span className="font-medium">Completed</span>{" "}
            requires <span className="font-medium">setup_progress.completed_at</span>.
            A bar turns red when ≥30% of the previous step drops. The{" "}
            <span className="font-medium">Currently parked at</span> chips below
            show where in-progress businesses are stalled — the true drop-off
            signal.
          </p>
          <p className="mt-2 text-muted-foreground">
            The final{" "}
            <span className="font-medium text-foreground">Card attached</span> bar
            counts only the <span className="font-medium">card-upfront cohort</span>{" "}
            (requires_card_upfront) that has a Stripe subscription
            {cardUpfrontStarted > 0
              ? ` — ${cardAttached}/${cardUpfrontStarted} of them`
              : ""}
            . Grandfathered no-card businesses are excluded, so it is not
            comparable to the steps above and its drop-off colour is suppressed.
          </p>
        </>
      }
      headerRight={
        overallConv !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {completed}/{started} · {overallConv}% end-to-end
          </span>
        ) : null
      }
    >
      {isPending ? (
        <div className="h-[380px] animate-pulse rounded bg-muted/40 sm:h-[460px]" />
      ) : started === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No wizard activity in the last 90 days
        </p>
      ) : (
        <>
          <ChartContainer
            config={config}
            className="h-[380px] w-full sm:h-[460px]"
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                left: 4,
                right: narrow ? 28 : 48,
                top: 4,
                bottom: 4,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                fontSize={narrow ? 10 : 11}
                allowDecimals={false}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={narrow ? 96 : 170}
                fontSize={narrow ? 10 : 11}
                interval={0}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="reached" radius={4}>
                {chartData.map((row) => (
                  <Cell
                    key={row.key}
                    fill={
                      row.dropoff !== null && row.dropoff >= 30
                        ? "var(--chart-5)"
                        : row.fill
                    }
                  />
                ))}
                <LabelList
                  dataKey="reached"
                  position="right"
                  className="fill-foreground"
                  fontSize={narrow ? 10 : 11}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
          {stuckRows.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Currently parked at · in-progress businesses
              </p>
              <div className="flex flex-wrap gap-2">
                {stuckRows.map((r) => (
                  <span
                    key={r.key}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px]"
                  >
                    {r.label}
                    <span className="font-medium tabular-nums">{r.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}
