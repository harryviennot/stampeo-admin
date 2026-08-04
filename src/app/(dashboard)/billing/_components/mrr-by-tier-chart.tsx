"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartCard, LegendItem } from "@/components/chart-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { BillingOverview } from "@/lib/api";
import { formatAmount, formatAmountCompact, tierLabel } from "./format";

const config: ChartConfig = {
  net_subtotal: { label: "Net", color: "var(--chart-1)" },
  gross_subtotal: { label: "Gross", color: "var(--chart-3)" },
};

export function MrrByTierChart({
  data,
  isPending,
}: {
  data: BillingOverview | undefined;
  isPending: boolean;
}) {
  const currency = data?.currency ?? "eur";
  const rows =
    data?.tier_breakdown.map((r) => ({
      // "·Y2" = 2 of this group's accounts pay yearly. Kept as a suffix rather
      // than a fourth bar: interval changes who pays when, not how much MRR.
      label: `${tierLabel(r.tier)}${r.is_founding ? " ·F" : ""}${
        r.yearly_count ? ` ·Y${r.yearly_count}` : ""
      }`,
      count: r.count,
      gross_subtotal: r.gross_subtotal,
      net_subtotal: r.net_subtotal,
    })) ?? [];

  return (
    <ChartCard
      title="MRR by tier"
      subtitle="Combined subscriptions vs collected"
      info={
        <>
          <p className="font-medium text-foreground">
            Where recurring revenue comes from
          </p>
          <p className="mt-1 text-muted-foreground">
            Each tier&apos;s combined subscription MRR next to what&apos;s
            actually collected. A gap between the two is comped or
            coupon-discounted revenue. &quot;·F&quot; marks founding-partner
            pricing; &quot;·Y&quot; counts accounts on a yearly plan (their
            MRR here is amortized ÷12).
          </p>
        </>
      }
      legend={
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-3)" label="Gross" />
          <LegendItem color="var(--chart-1)" label="Net" />
        </div>
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No active subscriptions
        </p>
      ) : (
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={rows} margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              fontSize={11}
              tickFormatter={(v) => formatAmountCompact(v as number, currency)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium tabular-nums">
                        {formatAmount(value as number, currency)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="gross_subtotal"
              fill="var(--color-gross_subtotal)"
              radius={3}
              maxBarSize={36}
            />
            <Bar
              dataKey="net_subtotal"
              fill="var(--color-net_subtotal)"
              radius={3}
              maxBarSize={36}
            />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
