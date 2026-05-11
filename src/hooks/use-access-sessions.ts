"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchAccessSession,
  fetchAccessSessions,
  type AccessSessionListParams,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useAccessSessions(params: AccessSessionListParams = {}) {
  return useQuery({
    queryKey: adminKeys.accessSessions.list(params),
    queryFn: () => fetchAccessSessions(params),
    placeholderData: keepPreviousData,
  });
}

export function useAccessSession(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.accessSessions.detail(id ?? ""),
    queryFn: () => fetchAccessSession(id!),
    enabled: !!id,
  });
}
