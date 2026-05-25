"use client";

import { AlertTriangle, Coins, TrendingUp } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { useRevenueSnapshot } from "@/hooks/use-stats";

function formatAmount(
  amountMinor: number,
  currency: string,
  opts: { minorUnit?: boolean } = {}
): string {
  const value = amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: opts.minorUnit ? 2 : 0,
    }).format(value);
  } catch {
    return `${value.toFixed(opts.minorUnit ? 2 : 0)} ${currency.toUpperCase()}`;
  }
}

function monthLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function RevenueCard() {
  const { data, isPending } = useRevenueSnapshot();

  const currency = data?.currency ?? "eur";
  const thisMonth = data ? monthLabel(data.this_month_start) : "";
  const lastMonth = data ? monthLabel(data.last_month_start) : "";

  return (
    <ChartCard
      title="Revenue"
      subtitle="Expected MRR from active subscriptions · actual revenue last month"
      info={
        <>
          <p className="font-medium text-foreground">
            What we&apos;re on track to earn vs. what we just earned
          </p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium">Expected this month</span> sums the
            monthly Stripe price of every business with{" "}
            <span className="font-medium">billing_status = &apos;active&apos;</span> —
            the recurring revenue from current paying customers.{" "}
            <span className="font-medium">Last month</span> sums{" "}
            <span className="font-medium">amount_paid</span> across every
            Stripe invoice settled in the previous calendar month.
          </p>
        </>
      }
    >
      {isPending ? (
        <div className="h-[200px] animate-pulse rounded bg-muted/40" />
      ) : !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No revenue data
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Expected · {thisMonth}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatAmount(data.active_mrr, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                from {data.active_count}{" "}
                {data.active_count === 1
                  ? "active subscription"
                  : "active subscriptions"}
                {data.actives_missing_price > 0 && (
                  <span className="ml-1 inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    {data.actives_missing_price} missing price
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                Collected · {lastMonth}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatAmount(data.last_month_revenue, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.last_month_invoice_count}{" "}
                {data.last_month_invoice_count === 1
                  ? "paid invoice"
                  : "paid invoices"}
              </p>
            </div>
          </div>

          {data.active_breakdown.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Active subscription breakdown
              </p>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground">
                      <th className="px-2 py-1.5 text-left font-medium">Tier</th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Subs
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Unit
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.active_breakdown.map((row, i) => (
                      <tr
                        key={`${row.tier}-${row.is_founding}-${i}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-2 py-1.5">
                          {tierLabel(row.tier)}
                          {row.is_founding && (
                            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-px text-[10px] text-violet-700">
                              founding
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {row.count}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                          {formatAmount(row.unit_amount, currency, {
                            minorUnit: true,
                          })}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium tabular-nums">
                          {formatAmount(row.subtotal, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.stripe_error && (
            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 text-xs">
              <div className="flex items-center gap-1 font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Stripe lookup failed — last-month revenue may be incomplete
              </div>
              <p className="mt-0.5 text-amber-700">{data.stripe_error}</p>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}
