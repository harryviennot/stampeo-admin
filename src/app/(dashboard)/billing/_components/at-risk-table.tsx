"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { EmptyState } from "@/components/empty-state";
import { useAtRiskPayments } from "@/hooks/use-stats";
import type { AtRiskBucket } from "@/lib/api";
import { formatAmount } from "./format";

const BUCKET_META: Record<
  AtRiskBucket["bucket"],
  { label: string; className: string }
> = {
  past_due: {
    label: "Past due",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  grace: {
    label: "In grace",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  cancel_at_period_end: {
    label: "Cancelling",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  trial_ending_no_card: {
    label: "Trial ending · no card",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
};

export function AtRiskTable() {
  const { data, isPending } = useAtRiskPayments();
  const currency = data?.currency ?? "eur";
  const buckets = (data?.buckets ?? []).filter((b) => b.count > 0);

  return (
    <ChartCard
      title="Revenue at risk"
      subtitle="Payments that may not land — by reason"
      info={
        <>
          <p className="font-medium text-foreground">What could slip</p>
          <p className="mt-1 text-muted-foreground">
            Past-due subscriptions, businesses in their grace window,
            scheduled cancellations, and trials ending within 7 days with no
            card on file. Amounts are the net MRR each would forfeit.
          </p>
        </>
      }
      headerRight={
        data ? (
          <span className="text-sm font-bold tabular-nums text-red-600">
            {formatAmount(data.total_at_risk, currency)}
          </span>
        ) : undefined
      }
    >
      {isPending ? (
        <div className="h-[260px] animate-pulse rounded bg-muted/40" />
      ) : buckets.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Nothing at risk"
          description="No past-due, grace, cancelling, or card-less trials right now."
        />
      ) : (
        <div className="space-y-5">
          {buckets.map((b) => {
            const meta = BUCKET_META[b.bucket];
            return (
              <div key={b.bucket}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}
                  >
                    {meta.label} · {b.count}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatAmount(b.amount_at_risk, currency)}
                  </span>
                </div>
                <ul className="divide-y rounded-md border">
                  {b.rows.map((r) => (
                    <li
                      key={r.business_id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/businesses/${r.business_id}`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {r.name}
                        </Link>
                        {r.detail && (
                          <span className="text-[11px] text-muted-foreground">
                            {r.detail}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-sm tabular-nums">
                        {formatAmount(r.net_amount, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
