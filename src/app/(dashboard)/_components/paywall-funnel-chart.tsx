"use client";

import { ChartCard } from "@/components/chart-card";
import { usePaywallFunnel } from "@/hooks/use-stats";
import type { PaywallFunnelGroup } from "@/lib/api";

const STAGES: Array<{
  key: keyof Pick<
    PaywallFunnelGroup,
    "cohort_size" | "reached_checkout" | "trial_started" | "activated" | "paid"
  >;
  label: string;
}> = [
  { key: "cohort_size", label: "Signed up" },
  { key: "reached_checkout", label: "Past checkout gate" },
  { key: "trial_started", label: "Trial started" },
  { key: "activated", label: "Activated (scanned)" },
  { key: "paid", label: "Paid (active)" },
];

function GroupColumn({
  group,
  accent,
}: {
  group: PaywallFunnelGroup | undefined;
  accent: string;
}) {
  const size = group?.cohort_size ?? 0;
  return (
    <div className="flex-1 space-y-1.5">
      {STAGES.map((s) => {
        const val = group ? group[s.key] : 0;
        const pct = size > 0 ? Math.round((val / size) * 100) : 0;
        return (
          <div key={s.key}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">
                {val}
                {s.key !== "cohort_size" && (
                  <span className="ml-1 text-muted-foreground">{pct}%</span>
                )}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded bg-muted/40">
              <div
                className="h-full rounded"
                style={{
                  width: `${size > 0 ? (val / size) * 100 : 0}%`,
                  background: accent,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PaywallFunnelChart() {
  const { data, isPending } = usePaywallFunnel(12);
  const groups = data?.groups ?? [];
  const cardGroup = groups.find((g) => g.requires_card);
  const noCardGroup = groups.find((g) => !g.requires_card);

  return (
    <ChartCard
      title="Hard-paywall funnel"
      subtitle="Last 12 weeks · card-upfront cohort vs no-card baseline"
      info={
        <>
          <p className="font-medium text-foreground">
            Does requiring a card up front help or hurt conversion?
          </p>
          <p className="mt-1 text-muted-foreground">
            Businesses created in the last 12 weeks, split by{" "}
            <span className="font-medium">requires_card_upfront</span>. Stages:
            signed up → left the{" "}
            <span className="font-medium">pending_checkout</span> gate → trial
            started → recorded a scan → reached{" "}
            <span className="font-medium">billing_status = active</span>. This is
            a current-state snapshot, not an event log. Compare the two columns to
            read the paywall&apos;s top-of-funnel and trial→paid effect.
          </p>
        </>
      }
    >
      {isPending ? (
        <div className="h-[240px] animate-pulse rounded bg-muted/40" />
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No cohort data
        </p>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: "var(--chart-1)" }}
              />
              Card upfront
              <span className="text-muted-foreground">
                · n={cardGroup?.cohort_size ?? 0}
              </span>
            </div>
            <GroupColumn group={cardGroup} accent="var(--chart-1)" />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: "var(--chart-4)" }}
              />
              No-card baseline
              <span className="text-muted-foreground">
                · n={noCardGroup?.cohort_size ?? 0}
              </span>
            </div>
            <GroupColumn group={noCardGroup} accent="var(--chart-4)" />
          </div>
        </div>
      )}
    </ChartCard>
  );
}
