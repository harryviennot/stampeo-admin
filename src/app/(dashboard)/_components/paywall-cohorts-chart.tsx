"use client";

import { ChartCard } from "@/components/chart-card";
import { usePaywallCohorts } from "@/hooks/use-stats";

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function pct(n: number | null, d: number): number | null {
  if (n === null) return null;
  return d > 0 ? Math.round((n / d) * 100) : null;
}

function heatClass(p: number | null): string {
  if (p === null) return "bg-muted/30 text-muted-foreground";
  if (p >= 70) return "bg-emerald-500/90 text-white";
  if (p >= 50) return "bg-emerald-400/80 text-white";
  if (p >= 30) return "bg-amber-400/70 text-amber-950";
  if (p >= 15) return "bg-orange-400/60 text-orange-950";
  if (p > 0) return "bg-red-400/50 text-red-950";
  return "bg-muted/40 text-muted-foreground";
}

export function PaywallCohortsChart() {
  const { data, isPending } = usePaywallCohorts(12);
  // Only show weeks that actually have a business in either cohort.
  const cohorts = (data?.cohorts ?? []).filter((c) => c.cohort_size > 0);

  return (
    <ChartCard
      title="Trial → paid by paywall cohort"
      subtitle="Weekly cohorts · card-upfront vs no-card · W+1 / W+2 / W+4 / W+8"
      info={
        <>
          <p className="font-medium text-foreground">
            Do card-required cohorts convert to paid faster than the no-card
            baseline?
          </p>
          <p className="mt-1 text-muted-foreground">
            Each row is a weekly signup cohort, split by{" "}
            <span className="font-medium">requires_card_upfront</span>. Columns
            show the % that reached{" "}
            <span className="font-medium">billing_status = active</span> within 1,
            2, 4, and 8 weeks. The no-card rows are the grandfathered baseline; the
            card rows are the new paywalled cohorts (still maturing — blank cells
            haven&apos;t reached that horizon yet).
          </p>
        </>
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : cohorts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No cohort data
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-2 py-1.5 text-left font-medium">Cohort</th>
                <th className="px-2 py-1.5 text-left font-medium">Type</th>
                <th className="px-2 py-1.5 text-right font-medium">Size</th>
                <th className="px-2 py-1.5 text-center font-medium">W+1</th>
                <th className="px-2 py-1.5 text-center font-medium">W+2</th>
                <th className="px-2 py-1.5 text-center font-medium">W+4</th>
                <th className="px-2 py-1.5 text-center font-medium">W+8</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => {
                const cells = [
                  pct(c.converted_w1, c.cohort_size),
                  pct(c.converted_w2, c.cohort_size),
                  pct(c.converted_w4, c.cohort_size),
                  pct(c.converted_w8, c.cohort_size),
                ];
                return (
                  <tr
                    key={`${c.cohort_week}-${c.requires_card}`}
                    className="border-b last:border-0"
                  >
                    <td className="px-2 py-1.5 font-medium">
                      {formatWeek(c.cohort_week)}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] ${
                          c.requires_card
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-muted bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {c.requires_card ? "Card" : "No card"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {c.cohort_size}
                    </td>
                    {cells.map((p, i) => (
                      <td key={i} className="px-1 py-1">
                        <div
                          className={`mx-auto flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums ${heatClass(
                            p
                          )}`}
                        >
                          {p === null ? "—" : `${p}%`}
                        </div>
                      </td>
                    ))}
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
