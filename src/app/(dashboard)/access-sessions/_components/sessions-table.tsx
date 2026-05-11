"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  fetchAccessSession,
  type AccessSession,
  type Paginated,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function formatDuration(grantedAt: string, endedAt: string | null): string {
  const start = new Date(grantedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function sessionStatus(s: AccessSession): "active" | "ended" | "expired" {
  if (s.ended_at) return "ended";
  if (new Date(s.expires_at).getTime() <= Date.now()) return "expired";
  return "active";
}

function SessionStatusBadge({ session }: { session: AccessSession }) {
  const status = sessionStatus(session);
  const className =
    status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "ended"
        ? "bg-zinc-100 text-zinc-700 border-zinc-200"
        : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}

function RoleBadge({ role }: { role: string }) {
  const className =
    role === "owner"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : role === "admin"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={className}>
      {role}
    </Badge>
  );
}

interface SessionsTableProps {
  data: Paginated<AccessSession> | undefined;
  isPending: boolean;
  isPlaceholder?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  showBusinessColumn?: boolean;
}

export function SessionsTable({
  data,
  isPending,
  isPlaceholder,
  page,
  pageSize,
  onPageChange,
  showBusinessColumn = true,
}: SessionsTableProps) {
  const qc = useQueryClient();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const prefetchDetail = (id: string) => {
    qc.prefetchQuery({
      queryKey: adminKeys.accessSessions.detail(id),
      queryFn: () => fetchAccessSession(id),
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        {isPending ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No access sessions"
            description="Impersonation sessions will appear here once support accesses a business."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {showBusinessColumn && <TableHead>Business</TableHead>}
                <TableHead>Superadmin</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => {
                const href = `/access-sessions/${s.id}`;
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onMouseEnter={() => prefetchDetail(s.id)}
                  >
                    {showBusinessColumn && (
                      <TableCell>
                        <Link
                          href={href}
                          className="font-medium hover:underline"
                        >
                          {s.business?.name ?? "—"}
                        </Link>
                        {s.business?.url_slug && (
                          <div className="font-mono text-xs text-muted-foreground">
                            /{s.business.url_slug}
                          </div>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Link href={href} className="block">
                        <div className="text-sm font-medium">
                          {s.superadmin?.name ?? "—"}
                        </div>
                        {s.superadmin?.email && (
                          <div className="text-xs text-muted-foreground">
                            {s.superadmin.email}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={href} className="block">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium">
                            {s.target?.name ?? "—"}
                          </span>
                          <RoleBadge role={s.target_role} />
                        </div>
                        {s.target?.email && (
                          <div className="text-xs text-muted-foreground">
                            {s.target.email}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <Link href={href} className="block" title={s.reason}>
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {s.reason}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={href}>
                        <SessionStatusBadge session={s} />
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      <Link href={href}>
                        {new Date(s.granted_at).toLocaleString(
                          undefined,
                          DATE_TIME_OPTS
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      <Link href={href}>
                        {formatDuration(s.granted_at, s.ended_at)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Link href={href}>{s.event_count}</Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {items.length > 0 && (
          <div className="border-t">
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
              isPlaceholder={isPlaceholder}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
