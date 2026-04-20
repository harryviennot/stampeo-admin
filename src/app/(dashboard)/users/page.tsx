"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchUserDetail, type UserListParams } from "@/lib/api";
import { ResellerBadge } from "@/components/business-utils";
import { DataTablePagination } from "@/components/data-table-pagination";
import { EmptyState } from "@/components/empty-state";
import { useUsers } from "@/hooks/use-users";
import { adminKeys } from "@/lib/query-keys";
import { Loader2, Search, Inbox } from "lucide-react";

type RoleFilter = "all" | "owner" | "admin" | "scanner" | "reseller";

const PAGE_SIZE = 25;

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: "bg-violet-50 text-violet-700 border-violet-200",
    admin: "bg-blue-50 text-blue-700 border-blue-200",
    scanner: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <Badge variant="outline" className={styles[role] || ""}>
      {role}
    </Badge>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(0);

  const params: UserListParams = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: search.trim() || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
  };

  const { data, isPending, isPlaceholderData } = useUsers(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const resetPage = () => setPage(0);
  const prefetchDetail = (id: string) => {
    qc.prefetchQuery({
      queryKey: adminKeys.users.detail(id),
      queryFn: () => fetchUserDetail(id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          {total} user{total !== 1 && "s"} on the platform.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {(["all", "owner", "admin", "scanner", "reseller"] as const).map(
            (r) => (
              <Button
                key={r}
                variant={roleFilter === r ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRoleFilter(r);
                  resetPage();
                }}
                className="capitalize"
              >
                {r === "all" ? "All" : r}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No users match your filters"
              description="Try adjusting search or clearing filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Businesses</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={`/users/${user.id}`}
                        onMouseEnter={() => prefetchDetail(user.id)}
                        className="hover:underline"
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <RoleBadge key={role} role={role} />
                        ))}
                        {user.is_reseller && <ResellerBadge />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.businesses_count === 0 ? (
                          <span className="text-muted-foreground">None</span>
                        ) : (
                          <span>
                            {user.businesses_count} business
                            {user.businesses_count !== 1 && "es"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {items.length > 0 && (
            <div className="border-t">
              <DataTablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                isPlaceholder={isPlaceholderData}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
