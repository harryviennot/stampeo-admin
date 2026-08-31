"use client";

import Link from "next/link";
import { Loader2, Users } from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import { ResellerBadge } from "@/components/business-utils";
import { useBusinessTeam } from "@/hooks/use-businesses";
import { formatDate, limitLabel, relativeTime } from "@/lib/format";

const ROLE_TONE: Record<string, string> = {
  owner: "bg-violet-50 text-violet-700 border-violet-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  scanner: "bg-gray-50 text-gray-700 border-gray-200",
};

export function TeamTab({ businessId }: { businessId: string }) {
  const { data, isPending, isError } = useBusinessTeam(businessId);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load the team"
        description="The request failed. Try refreshing."
      />
    );
  }

  const atCap =
    data.limits.max_members !== null &&
    data.items.length >= data.limits.max_members;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3">
          <InfoGrid>
            <InfoRow
              label="Seats used"
              value={
                <span className={atCap ? "text-amber-700" : undefined}>
                  {data.items.length} / {limitLabel(data.limits.max_members)}
                  {atCap && " — at the cap"}
                </span>
              }
            />
            <InfoRow
              label="Roles"
              value={
                Object.entries(data.counts)
                  .map(([role, n]) => `${n} ${role}`)
                  .join(" · ") || "—"
              }
            />
            <InfoRow
              label="Per-employee tracking"
              value={
                data.limits.employee_tracking ? "Yes" : "Not on this plan"
              }
            />
            <InfoRow label="Pending invites" value={data.invitations.length} />
          </InfoGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Members ({data.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <EmptyState title="No team members" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead>Scans</TableHead>
                    <TableHead>Apps</TableHead>
                    <TableHead>Locale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Link
                          href={`/users/${member.user_id}`}
                          className="hover:underline"
                        >
                          <div className="flex items-center gap-1.5 font-medium">
                            {member.name ?? "Unknown"}
                            {member.is_reseller && <ResellerBadge />}
                            {member.is_paused && (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700"
                              >
                                paused
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ROLE_TONE[member.role] ?? ROLE_TONE.scanner}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {member.last_active_at
                          ? relativeTime(member.last_active_at)
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {member.scans_count}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {member.platforms_used.length
                          ? member.platforms_used.join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {member.locale ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pending invitations ({data.invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.invitations.length === 0 ? (
            <EmptyState title="No pending invitations" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="font-medium">{invite.email}</div>
                      {invite.name && (
                        <div className="text-xs text-muted-foreground">
                          {invite.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{invite.role}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(invite.created_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(invite.expires_at)}
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
