"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessSessions } from "@/hooks/use-access-sessions";
import { SessionsTable } from "./_components/sessions-table";

type StatusFilter = "all" | "active" | "ended" | "expired";

const PAGE_SIZE = 25;

export default function AccessSessionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  const { data, isPending, isPlaceholderData } = useAccessSessions({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Access Sessions</h1>
        <p className="text-muted-foreground">
          {total} impersonation session{total !== 1 && "s"} across all
          businesses.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {(["all", "active", "ended", "expired"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(s);
              setPage(0);
            }}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      <SessionsTable
        data={data}
        isPending={isPending}
        isPlaceholder={isPlaceholderData}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        showBusinessColumn
      />
    </div>
  );
}
