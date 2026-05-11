"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { useAccessSession } from "@/hooks/use-access-sessions";
import type { AccessSession, AccessSessionEvent } from "@/lib/api";

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
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

function ActionTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    impersonation_start:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    impersonation_end: "bg-zinc-100 text-zinc-700 border-zinc-200",
    page_view: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <Badge variant="outline" className={map[type] ?? ""}>
      {type}
    </Badge>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}

function EventDescription({ event }: { event: AccessSessionEvent }) {
  if (event.action_type === "page_view") {
    const pathname =
      typeof event.metadata?.pathname === "string"
        ? (event.metadata.pathname as string)
        : "";
    const search =
      typeof event.metadata?.search === "string"
        ? (event.metadata.search as string)
        : "";
    return (
      <span className="font-mono text-xs">
        {pathname}
        {search && <span className="text-muted-foreground">{search}</span>}
      </span>
    );
  }
  if (event.action_type === "impersonation_end") {
    const reason =
      typeof event.metadata?.ended_reason === "string"
        ? (event.metadata.ended_reason as string)
        : null;
    return (
      <span className="text-xs text-muted-foreground">
        {reason ? `ended_reason: ${reason}` : "Session ended"}
      </span>
    );
  }
  if (event.action_type === "impersonation_start") {
    return (
      <span className="text-xs text-muted-foreground">Session started</span>
    );
  }
  const keys = Object.keys(event.metadata ?? {});
  if (keys.length === 0) return <span className="text-xs">—</span>;
  return (
    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
      {JSON.stringify(event.metadata, null, 2)}
    </pre>
  );
}

export default function AccessSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { data, isPending, isError } = useAccessSession(sessionId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="Session not found"
              description="This impersonation session does not exist or could not be loaded."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, events } = data;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Access Session</h1>
          <SessionStatusBadge session={session} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {events.length} event{events.length !== 1 && "s"} logged.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow
            label="Business"
            value={
              session.business ? (
                <Link
                  href={`/businesses/${session.business_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {session.business.name}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            label="Superadmin"
            value={
              <>
                <div>{session.superadmin?.name ?? "—"}</div>
                {session.superadmin?.email && (
                  <div className="text-xs text-muted-foreground font-normal">
                    {session.superadmin.email}
                  </div>
                )}
              </>
            }
          />
          <InfoRow
            label="Target user"
            value={
              <>
                <div className="flex items-center gap-1.5">
                  {session.target?.name ?? "—"}
                  <RoleBadge role={session.target_role} />
                </div>
                {session.target?.email && (
                  <div className="text-xs text-muted-foreground font-normal">
                    {session.target.email}
                  </div>
                )}
              </>
            }
          />
          <InfoRow
            label="Selection mode"
            value={<span className="capitalize">{session.selection_mode.replace("_", " ")}</span>}
          />
          <InfoRow
            label="Granted at"
            value={new Date(session.granted_at).toLocaleString(
              undefined,
              DATE_TIME_OPTS
            )}
          />
          <InfoRow
            label="Ended at"
            value={
              session.ended_at
                ? new Date(session.ended_at).toLocaleString(
                    undefined,
                    DATE_TIME_OPTS
                  )
                : "—"
            }
          />
          <InfoRow
            label="Expires at"
            value={new Date(session.expires_at).toLocaleString(
              undefined,
              DATE_TIME_OPTS
            )}
          />
          <InfoRow
            label="Duration"
            value={formatDuration(session.granted_at, session.ended_at)}
          />
          {session.ended_reason && (
            <InfoRow label="Ended reason" value={session.ended_reason} />
          )}
          {session.ip_address && (
            <InfoRow
              label="IP address"
              value={<span className="font-mono">{session.ip_address}</span>}
            />
          )}
          {session.user_agent && (
            <div className="md:col-span-2">
              <InfoRow
                label="User agent"
                value={
                  <span className="font-mono text-xs">{session.user_agent}</span>
                }
              />
            </div>
          )}
          <div className="md:col-span-2">
            <InfoRow label="Reason" value={session.reason} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No events"
              description="No audit entries were recorded for this session."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[160px]">Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground align-top">
                      {new Date(e.created_at).toLocaleString(
                        undefined,
                        DATE_TIME_OPTS
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <ActionTypeBadge type={e.action_type} />
                    </TableCell>
                    <TableCell className="align-top">
                      <EventDescription event={e} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
