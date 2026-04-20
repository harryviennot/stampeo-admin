"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useActivationFunnel } from "@/hooks/use-stats";

const config: ChartConfig = {
  count: { label: "Businesses", color: "var(--chart-2)" },
};

export function ActivationFunnelChart() {
  const { data, isPending } = useActivationFunnel({ range: "90d" });

  const stages = data
    ? [
        { stage: "1. Created", count: data.created },
        { stage: "2. Design live", count: data.has_active_design },
        { stage: "3. First customer", count: data.has_first_customer },
        { stage: "4. First stamp", count: data.has_first_stamp },
      ]
    : [];

  const chartData = stages.map((s, i) => {
    const prev = i === 0 ? s.count : stages[i - 1].count;
    const dropoff =
      prev > 0 && i > 0 ? Math.round(((prev - s.count) / prev) * 100) : null;
    return { ...s, dropoff };
  });

  const activationRate =
    data && data.created > 0
      ? Math.round((data.has_first_stamp / data.created) * 100)
      : null;

  return (
    <ChartCard
      title="Post-signup activation funnel"
      subtitle="Last 90 days · business activation stages"
      headerRight={
        activationRate !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {activationRate}% activated
          </span>
        ) : null
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : chartData.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No activation data
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
              dataKey="stage"
              type="category"
              tickLine={false}
              axisLine={false}
              width={130}
              fontSize={11}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={4}>
              {chartData.map((row, idx) => (
                <Cell
                  key={idx}
                  fill={
                    row.dropoff !== null && row.dropoff >= 40
                      ? "var(--chart-5)"
                      : "var(--chart-2)"
                  }
                />
              ))}
              <LabelList
                dataKey="count"
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
