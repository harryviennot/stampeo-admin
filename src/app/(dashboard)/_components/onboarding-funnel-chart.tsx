"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useOnboardingFunnel } from "@/hooks/use-stats";

const STEP_LABELS: Record<number, string> = {
  1: "Business profile",
  2: "Card design",
  3: "About you",
  4: "Account",
  5: "Plan",
  6: "Confirmation",
};

const config: ChartConfig = {
  reached: { label: "Reached", color: "var(--chart-1)" },
};

export function OnboardingFunnelChart() {
  const { data, isPending } = useOnboardingFunnel({ range: "90d" });

  const chartData =
    data?.steps.map((s, i) => {
      const prev = i === 0 ? s.reached : data.steps[i - 1].reached;
      const dropoff =
        prev > 0 && i > 0
          ? Math.round(((prev - s.reached) / prev) * 100)
          : null;
      return {
        step: `${s.step}. ${STEP_LABELS[s.step] ?? `Step ${s.step}`}`,
        reached: s.reached,
        dropoff,
      };
    }) ?? [];

  const firstStep = data?.steps[0]?.reached ?? 0;
  const completed = data?.completed ?? 0;
  const overallConv =
    firstStep > 0 ? Math.round((completed / firstStep) * 100) : null;

  return (
    <ChartCard
      title="Pre-signup onboarding funnel"
      subtitle="Last 90 days · wizard step completion"
      info={
        <>
          <p className="font-medium text-foreground">Post-auth signup drop-off</p>
          <p className="mt-1 text-muted-foreground">
            Reconstructs the 6-step wizard (Business profile → Card design →
            About you → Account → Plan → Confirmation) by combining abandoned{" "}
            <span className="font-medium">onboarding_progress</span> rows with
            completed signups in <span className="font-medium">businesses</span>.
            A bar turns red when ≥30% of the previous step drops.{" "}
            <span className="font-medium">Shorter = leakier.</span> Step 3
            (&ldquo;About you&rdquo;) now also captures{" "}
            <span className="font-medium">team_size</span>,{" "}
            <span className="font-medium">locations_count</span>,{" "}
            <span className="font-medium">primary_goal</span> and{" "}
            <span className="font-medium">heard_from</span>. Step 6 is the
            confirmation/success screen — the legacy &ldquo;Heard from&rdquo;
            step moved into step 3.
          </p>
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Caveat:</span>{" "}
            <span className="font-medium">onboarding_progress</span> rows are
            only created after the user authenticates (step 4), so steps 1–3
            look identical and the top number is{" "}
            <span className="font-medium">authenticated users</span>, not page
            visitors. Pre-auth drop-off (steps 1–3 in sessionStorage) is
            invisible here — use PostHog{" "}
            <span className="font-medium">onboarding_step_completed</span>{" "}
            for that. Wizard restructure shipped 2026-05-04: rows from before
            then use the old step semantics (1=business info, 2=type), so
            mixed-window comparisons will be misleading.
          </p>
        </>
      }
      headerRight={
        overallConv !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {overallConv}% end-to-end
          </span>
        ) : null
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : chartData.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No onboarding data
        </p>
      ) : (
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 8, right: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              allowDecimals={false}
            />
            <YAxis
              dataKey="step"
              type="category"
              tickLine={false}
              axisLine={false}
              width={140}
              fontSize={11}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="reached" radius={4}>
              {chartData.map((row, idx) => (
                <Cell
                  key={idx}
                  fill={
                    row.dropoff !== null && row.dropoff >= 30
                      ? "var(--chart-5)"
                      : "var(--chart-1)"
                  }
                />
              ))}
              <LabelList
                dataKey="reached"
                position="right"
                className="fill-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
