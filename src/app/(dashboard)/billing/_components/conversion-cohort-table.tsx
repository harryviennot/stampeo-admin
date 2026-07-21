"use client";

import { useState } from "react";
import { ChartCard } from "@/components/chart-card";
import { SegmentedToggle } from "@/components/segmented-toggle";
import { useConversionCohorts } from "@/hooks/use-stats";
import type { CohortGranularity, CohortUniverse } from "@/lib/api";
import { formatAmount } from "./format";

function pct(rate: number | null): number | null {
  return rate == null ? null : Math.round(rate * 100);
}

// Heat scale for conversion %, matching the dashboard trial-cohort table.
function heatClass(p: number | null): string {
  if (p === null) return "bg-muted/30 text-muted-foreground";
  if (p >= 70) return "bg-emerald-500/90 text-white";
  if (p >= 50) return "bg-emerald-400/80 text-white";
  if (p >= 30) return "bg-amber-400/70 text-amber-950";
  if (p >= 15) return "bg-orange-400/60 text-orange-950";
  if (p > 0) return "bg-red-400/50 text-red-950";
  return "bg-muted/40 text-muted-foreground";
}

function periodLabel(iso: string, g: CohortGranularity): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return g === "week"
    ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function ConversionCohortTable({
  universe,
  title,
  subtitle,
  info,
}: {
  universe: CohortUniverse;
  title: string;
  subtitle: string;
  info: React.ReactNode;
}) {
  const [granularity, setGranularity] = useState<CohortGranularity>("month");
  const { data, isPending } = useConversionCohorts(granularity, universe);
  const currency = data?.currency ?? "eur";
  // Newest cohorts first, and hide empty leading periods (before any signups).
  const cohorts = (data?.cohorts ?? []).filter((c) => c.size > 0).reverse();

  const totalSize = cohorts.reduce((s, c) => s + c.size, 0);
  const totalPaid = cohorts.reduce((s, c) => s + c.paid, 0);
  const overall = totalSize > 0 ? Math.round((totalPaid / totalSize) * 100) : null;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      info={info}
      headerRight={
        <div className="flex items-center gap-2">
          {overall !== null && (
            <span className="hidden sm:inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              {overall}% overall
            </span>
          )}
          <SegmentedToggle
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
            ]}
          />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : cohorts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No cohort data yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-2 py-1.5 text-left font-medium">Cohort</th>
                <th className="px-2 py-1.5 text-right font-medium">Signups</th>
                <th className="px-2 py-1.5 text-right font-medium">Paid</th>
                <th className="px-2 py-1.5 text-center font-medium">Conv.</th>
                <th className="px-2 py-1.5 text-right font-medium">Trialing</th>
                <th className="px-2 py-1.5 text-right font-medium">Churned</th>
                <th className="px-2 py-1.5 text-right font-medium">Net MRR</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => {
                const p = pct(c.conversion_rate);
                return (
                  <tr key={c.period} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-2 py-1.5 font-medium">
                      {periodLabel(c.period, granularity)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {c.size}
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium tabular-nums">
                      {c.paid}
                    </td>
                    <td className="px-1 py-1">
                      <div
                        className={`mx-auto flex h-7 w-14 items-center justify-center rounded text-[11px] font-medium tabular-nums ${heatClass(p)}`}
                        title={p === null ? "—" : `${c.paid}/${c.size}`}
                      >
                        {p === null ? "—" : `${p}%`}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {c.still_trialing}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {c.churned}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatAmount(c.net_mrr, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
