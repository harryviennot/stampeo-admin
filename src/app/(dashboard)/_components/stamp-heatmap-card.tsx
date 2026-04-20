"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/chart-card";
import { useStampHeatmap } from "@/hooks/use-stats";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "rgba(148, 163, 184, 0.08)";
  const intensity = Math.max(0.08, value / max);
  return `rgba(59, 130, 246, ${intensity.toFixed(2)})`;
}

export function StampHeatmapCard() {
  const { data, isPending } = useStampHeatmap({ range: "30d" });

  const { grid, max, totalStamps, peak } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );
    let m = 0;
    let total = 0;
    let p: { dow: number; hour: number; stamps: number } | null = null;
    for (const cell of data?.cells ?? []) {
      if (cell.dow < 0 || cell.dow > 6 || cell.hour < 0 || cell.hour > 23)
        continue;
      g[cell.dow][cell.hour] = cell.stamps;
      total += cell.stamps;
      if (cell.stamps > m) {
        m = cell.stamps;
        p = cell;
      }
    }
    return { grid: g, max: m, totalStamps: total, peak: p };
  }, [data]);

  return (
    <ChartCard
      title="Stamp activity heatmap"
      subtitle={`Last 30 days · ${totalStamps.toLocaleString()} stamps`}
      headerRight={
        peak ? (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            Peak: {DAYS[peak.dow]} {peak.hour}:00 · {peak.stamps}
          </span>
        ) : null
      }
    >
      {isPending ? (
        <div className="h-[200px] animate-pulse rounded bg-muted/40" />
      ) : totalStamps === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No stamp activity in the last 30 days
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-[2px] pl-10">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="w-[18px] text-center text-[9px] text-muted-foreground"
                >
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {grid.map((row, dow) => (
              <div key={dow} className="mt-[2px] flex items-center gap-[2px]">
                <div className="w-8 pr-2 text-right text-[10px] text-muted-foreground">
                  {DAYS[dow]}
                </div>
                {row.map((v, h) => (
                  <div
                    key={h}
                    className="h-[18px] w-[18px] rounded-[2px]"
                    style={{ background: heatColor(v, max) }}
                    title={`${DAYS[dow]} ${h}:00 · ${v} stamp${v === 1 ? "" : "s"}`}
                  />
                ))}
              </div>
            ))}
            <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
              <span>Less</span>
              {[0.1, 0.25, 0.5, 0.75, 1].map((i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-[2px]"
                  style={{ background: `rgba(59, 130, 246, ${i})` }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
