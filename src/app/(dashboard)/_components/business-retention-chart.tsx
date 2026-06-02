"use client";

import { ChartCard } from "@/components/chart-card";
import { useBusinessRetention } from "@/hooks/use-stats";

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// p is a 0..1 retention rate (or null while the cohort is still maturing).
function heatClass(p: number | null): string {
  if (p === null) return "bg-muted/30 text-muted-foreground";
  const pct = p * 100;
  if (pct >= 50) return "bg-emerald-500/90 text-white";
  if (pct >= 25) return "bg-emerald-400/80 text-white"; // at/above the gate
  if (pct >= 15) return "bg-amber-400/70 text-amber-950";
  if (pct > 0) return "bg-red-400/60 text-red-950";
  return "bg-red-300/50 text-red-950";
}

const COLS: Array<{
  key: "rate_d7" | "rate_d14" | "rate_d30" | "rate_d60" | "rate_d90";
  label: string;
}> = [
  { key: "rate_d7", label: "D7" },
  { key: "rate_d14", label: "D14" },
  { key: "rate_d30", label: "D30" },
  { key: "rate_d60", label: "D60" },
  { key: "rate_d90", label: "D90" },
];

export function BusinessRetentionChart() {
  const { data, isPending } = useBusinessRetention(16);
  const cohorts = data?.cohorts ?? [];
  const headline = data?.headline ?? null;

  return (
    <ChartCard
      title="Business retention by signup cohort"
      subtitle="Weekly cohorts · still active at day 7 / 14 / 30 / 60 / 90"
      info={
        <>
          <p className="font-medium text-foreground">
            Do the businesses we acquire keep using Stampeo?
          </p>
          <p className="mt-1 text-muted-foreground">
            Each row is a weekly cohort of new businesses. A business is{" "}
            <span className="font-medium">retained at day N</span> if it recorded
            a stamp in the 7-day window ending at day N. The{" "}
            <span className="font-medium">day-60 column is the ad-readiness gate</span>{" "}
            — when a matured cohort holds ≥25% at day 60, paid acquisition is
            worth turning on. Cells are blank (&quot;—&quot;) until a cohort is
            old enough to have matured at that horizon.
          </p>
        </>
      }
      headerRight={
        headline ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
              headline.pass
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            Day-60: {Math.round(headline.rate_d60 * 100)}% ·{" "}
            {headline.pass ? "PASS" : "BELOW 25%"}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            No matured cohort yet
          </span>
        )
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
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    className={`px-2 py-1.5 text-center font-medium ${
                      c.key === "rate_d60" ? "text-foreground" : ""
                    }`}
                  >
                    {c.label}
                    {c.key === "rate_d60" ? " ·25%" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((row) => (
                <tr key={row.cohort_week} className="border-b last:border-0">
                  <td className="px-2 py-1.5 font-medium">
                    {formatWeek(row.cohort_week)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                    {row.cohort_size}
                  </td>
                  {COLS.map((c) => {
                    const rate = row[c.key];
                    return (
                      <td key={c.key} className="px-1 py-1">
                        <div
                          className={`mx-auto flex h-7 items-center justify-center rounded text-[11px] font-medium tabular-nums ${heatClass(
                            rate
                          )} ${
                            c.key === "rate_d60" && rate !== null
                              ? "ring-1 ring-inset ring-foreground/20"
                              : ""
                          }`}
                          title={rate === null ? "still maturing" : `${Math.round(rate * 100)}%`}
                        >
                          {rate === null ? "—" : `${Math.round(rate * 100)}%`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
