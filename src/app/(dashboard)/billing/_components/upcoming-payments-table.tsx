"use client";

import Link from "next/link";
import { AlertTriangle, Hourglass, Tag } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanBadge } from "@/components/business-utils";
import { useUpcomingPayments } from "@/hooks/use-stats";
import { CalendarClock } from "lucide-react";
import { formatAmount, formatChargeDate, relativeDays } from "./format";

export function UpcomingPaymentsTable() {
  const { data, isPending } = useUpcomingPayments(10);
  const currency = data?.currency ?? "eur";
  const rows = data?.rows ?? [];

  return (
    <ChartCard
      title="Next payments"
      subtitle="The next 10 businesses that will pay — soonest first"
      info={
        <>
          <p className="font-medium text-foreground">Upcoming cash</p>
          <p className="mt-1 text-muted-foreground">
            Active renewals (by{" "}
            <span className="font-medium">billing_period_end</span>) merged with
            trials about to convert. Amounts are the actual next charge, so a
            time-limited coupon shows its discounted figure.
          </p>
        </>
      }
    >
      {isPending ? (
        <div className="h-[280px] animate-pulse rounded bg-muted/40" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-6 w-6" />}
          title="No upcoming payments"
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="hidden sm:table-cell">Tier</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.business_id}-${r.next_charge_at}`}>
                  <TableCell className="max-w-[160px]">
                    <Link
                      href={`/businesses/${r.business_id}`}
                      className="font-medium hover:underline"
                    >
                      <span className="block truncate">{r.name}</span>
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {r.is_trial_conversion && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-px text-[10px] text-blue-700">
                          <Hourglass className="h-2.5 w-2.5" />
                          trial
                        </span>
                      )}
                      {r.is_discounted && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-px text-[10px] text-violet-700">
                          <Tag className="h-2.5 w-2.5" />
                          discounted
                        </span>
                      )}
                      {r.at_risk && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-px text-[10px] text-amber-700">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          at risk
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PlanBadge tier={r.tier} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-sm">
                      {formatChargeDate(r.next_charge_at)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {relativeDays(r.next_charge_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatAmount(r.net_amount, currency)}
                    {r.is_discounted && r.gross_amount > r.net_amount && (
                      <span className="block text-[11px] font-normal text-muted-foreground line-through">
                        {formatAmount(r.gross_amount, currency)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ChartCard>
  );
}
