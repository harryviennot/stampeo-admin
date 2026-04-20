"use client";

import { ChartCard } from "@/components/chart-card";
import { useTrialCohorts } from "@/hooks/use-stats";

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function pct(n: number, d: number): number | null {
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

export function TrialCohortsChart() {
  const { data, isPending } = useTrialCohorts(12);
  const cohorts = data?.cohorts ?? [];

  const totalSize = cohorts.reduce((s, c) => s + c.cohort_size, 0);
  const totalW8 = cohorts.reduce((s, c) => s + c.converted_w8, 0);
  const overall = pct(totalW8, totalSize);

  return (
    <ChartCard
      title="Trial → active cohort conversion"
      subtitle="Weekly signup cohorts · W+1 / W+2 / W+4 / W+8"
      headerRight={
        overall !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {overall}% overall at W+8
          </span>
        ) : null
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
                <th className="px-2 py-1.5 text-right font-medium">Size</th>
                <th className="px-2 py-1.5 text-center font-medium">W+1</th>
                <th className="px-2 py-1.5 text-center font-medium">W+2</th>
                <th className="px-2 py-1.5 text-center font-medium">W+4</th>
                <th className="px-2 py-1.5 text-center font-medium">W+8</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => {
                const p1 = pct(c.converted_w1, c.cohort_size);
                const p2 = pct(c.converted_w2, c.cohort_size);
                const p4 = pct(c.converted_w4, c.cohort_size);
                const p8 = pct(c.converted_w8, c.cohort_size);
                return (
                  <tr key={c.cohort_week} className="border-b last:border-0">
                    <td className="px-2 py-1.5 font-medium">
                      {formatWeek(c.cohort_week)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {c.cohort_size}
                    </td>
                    {[p1, p2, p4, p8].map((p, i) => (
                      <td key={i} className="px-1 py-1">
                        <div
                          className={`mx-auto flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums ${heatClass(p)}`}
                          title={
                            p === null
                              ? "—"
                              : `${p}% (${[c.converted_w1, c.converted_w2, c.converted_w4, c.converted_w8][i]}/${c.cohort_size})`
                          }
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
