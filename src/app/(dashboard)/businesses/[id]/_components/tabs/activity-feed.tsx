"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { useBusinessActivity } from "@/hooks/use-businesses";
import type { AdminActivityItem } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const TYPE_TONE: Record<string, string> = {
  stamp_added: "border-emerald-200 bg-emerald-50 text-emerald-700",
  points_earned: "border-emerald-200 bg-emerald-50 text-emerald-700",
  welcome_points: "border-sky-200 bg-sky-50 text-sky-700",
  bonus_stamp: "border-sky-200 bg-sky-50 text-sky-700",
  bonus_points: "border-sky-200 bg-sky-50 text-sky-700",
  reward_redeemed: "border-violet-200 bg-violet-50 text-violet-700",
  stamp_voided: "border-red-200 bg-red-50 text-red-700",
  points_voided: "border-red-200 bg-red-50 text-red-700",
  card_added: "border-blue-200 bg-blue-50 text-blue-700",
  card_re_added: "border-blue-200 bg-blue-50 text-blue-700",
  card_deleted: "border-gray-200 bg-gray-50 text-gray-600",
};

/** The operational facts hidden in the filtered metadata, in words. */
function describeMetadata(item: AdminActivityItem): string | null {
  const meta = item.metadata ?? {};
  const parts: string[] = [];

  const boost = meta.boost as
    | { kind?: string; value?: number; base_points?: number; bonus_points?: number }
    | undefined;
  if (boost) {
    parts.push(
      `boost ${boost.kind === "multiplier" ? `×${boost.value}` : `+${boost.value}`}` +
        (boost.bonus_points != null ? ` (+${boost.bonus_points} pts)` : "")
    );
  }
  if (meta.reward_name) parts.push(String(meta.reward_name));
  if (meta.redeemed_from) parts.push(`from ${meta.redeemed_from}`);
  if (meta.cap_override === true) parts.push("cap overridden");
  if (meta.void_reason) parts.push(`reason: ${meta.void_reason}`);
  if (meta.adjustment_reason) parts.push(`reason: ${meta.adjustment_reason}`);
  if (meta.wallet_type) parts.push(String(meta.wallet_type));
  if (meta.platform) parts.push(String(meta.platform));

  return parts.length ? parts.join(" · ") : null;
}

export function ActivityFeed({ businessId }: { businessId: string }) {
  // 0-indexed, matching DataTablePagination's contract.
  const [page, setPage] = useState(0);
  const { data, isPending, isError } = useBusinessActivity(
    businessId,
    PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Customers appear as a truncated reference only — enough to spot a
          repeat visitor, never enough to identify one. Staff are named because
          they are the merchant&apos;s own employees.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <EmptyState title="Could not load activity" />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Nothing has ever been scanned for this business."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => {
                    const detail = describeMetadata(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(item.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              TYPE_TONE[item.type] ??
                              "border-gray-200 bg-gray-50 text-gray-600"
                            }
                          >
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right text-sm font-medium",
                            (item.delta ?? 0) > 0 && "text-emerald-700",
                            (item.delta ?? 0) < 0 && "text-red-700"
                          )}
                        >
                          {item.delta != null && item.delta !== 0
                            ? `${item.delta > 0 ? "+" : ""}${item.delta}`
                            : "—"}
                          {item.value_after != null && (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              → {item.value_after}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.customer_ref ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.employee_name ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.source ?? "—"}
                          {item.amount != null && (
                            <span className="ml-1">· {item.amount}</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[22rem] truncate text-xs text-muted-foreground">
                          {detail ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="p-3">
              <DataTablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
