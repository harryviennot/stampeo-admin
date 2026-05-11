"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessSessions } from "@/hooks/use-access-sessions";
import { useBusiness } from "@/hooks/use-businesses";
import { SessionsTable } from "../../../access-sessions/_components/sessions-table";

type StatusFilter = "all" | "active" | "ended" | "expired";

const PAGE_SIZE = 25;

export default function BusinessAccessSessionsPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  const { data, isPending, isPlaceholderData } = useAccessSessions({
    business_id: businessId,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: business } = useBusiness(businessId);

  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.push(`/businesses/${businessId}`)}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {business?.name ?? "Business"}
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Access Sessions</h1>
        <p className="text-muted-foreground">
          {total} impersonation session{total !== 1 && "s"} on{" "}
          {business ? (
            <Link
              href={`/businesses/${businessId}`}
              className="text-blue-600 hover:underline"
            >
              {business.name}
            </Link>
          ) : (
            "this business"
          )}
          .
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
        showBusinessColumn={false}
      />
    </div>
  );
}
