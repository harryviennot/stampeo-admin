"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartCard, LegendItem } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useBusinessPassLifecycle } from "@/hooks/use-businesses";

const config: ChartConfig = {
  card_added: { label: "Installed", color: "var(--chart-2)" },
  card_deleted: { label: "Uninstalled", color: "var(--chart-5)" },
  card_re_added: { label: "Re-installed", color: "var(--chart-3)" },
};

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function PassLifecycleChart({ businessId }: { businessId: string }) {
  const { data, isPending } = useBusinessPassLifecycle(businessId, {
    bucket: "week",
    range: "12w",
  });
  const buckets = data?.buckets ?? [];

  const totalAdded = buckets.reduce((s, b) => s + b.card_added, 0);
  const totalDeleted = buckets.reduce((s, b) => s + b.card_deleted, 0);
  const uninstallRate =
    totalAdded > 0 ? Math.round((totalDeleted / totalAdded) * 100) : 0;

  const recent = buckets.slice(-4);
  const recentAdded = recent.reduce((s, b) => s + b.card_added, 0);
  const recentDeleted = recent.reduce((s, b) => s + b.card_deleted, 0);
  const recentRate =
    recentAdded > 0 ? Math.round((recentDeleted / recentAdded) * 100) : 0;

  return (
    <ChartCard
      title="Pass installs & uninstalls"
      subtitle="Last 12 weeks · wallet lifecycle events"
      info={
        <>
          <p className="font-medium text-foreground">
            Retention signal from Apple & Google Wallet
          </p>
          <p className="mt-1 text-muted-foreground">
            From <span className="font-medium">transactions</span>:{" "}
            <span className="font-medium">card_added</span>,{" "}
            <span className="font-medium">card_deleted</span>,{" "}
            <span className="font-medium">card_re_added</span> events weekly for
            this business. <span className="font-medium">Uninstall rate</span> =
            card_deleted ÷ card_added. Anything above 30% is a churn red flag;
            4w shows the recent trend.{" "}
            <span className="font-medium">Lower is better.</span>
          </p>
        </>
      }
      headerRight={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Uninstall rate:</span>
          <span
            className={`font-semibold tabular-nums ${
              uninstallRate >= 30
                ? "text-red-600"
                : uninstallRate >= 15
                  ? "text-amber-600"
                  : "text-emerald-600"
            }`}
          >
            {uninstallRate}%
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">4w:</span>
          <span className="font-semibold tabular-nums">{recentRate}%</span>
        </div>
      }
      legend={
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-2)" label="Installed" />
          <LegendItem color="var(--chart-5)" label="Uninstalled" />
          <LegendItem color="var(--chart-3)" label="Re-installed" />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[220px] animate-pulse rounded bg-muted/40" />
      ) : buckets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No pass lifecycle events
        </p>
      ) : (
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={buckets} margin={{ left: 4, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period_start"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatWeek}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              fontSize={11}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => formatWeek(v as string)}
                />
              }
            />
            <Bar
              dataKey="card_added"
              stackId="a"
              fill="var(--color-card_added)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="card_re_added"
              stackId="a"
              fill="var(--color-card_re_added)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="card_deleted"
              stackId="b"
              fill="var(--color-card_deleted)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
