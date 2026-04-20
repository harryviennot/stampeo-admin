"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  activateBusiness,
  deleteBusiness,
  fetchBusinessDetail,
  fetchBusinessMembers,
  fetchBusinesses,
  fetchBusinessStats,
  suspendBusiness,
  type BusinessListParams,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useBusinesses(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: adminKeys.businesses.list(params),
    queryFn: () => fetchBusinesses(params),
    placeholderData: keepPreviousData,
  });
}

export function useBusiness(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.detail(id ?? ""),
    queryFn: () => fetchBusinessDetail(id!),
    enabled: !!id,
  });
}

export function useBusinessStats(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.stats(id ?? ""),
    queryFn: () => fetchBusinessStats(id!),
    enabled: !!id,
  });
}

export function useBusinessMembers(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.members(id ?? ""),
    queryFn: () => fetchBusinessMembers(id!),
    enabled: !!id,
  });
}

function invalidateBusinessLists(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.businesses.all });
  qc.invalidateQueries({ queryKey: adminKeys.stats.overview });
  qc.invalidateQueries({ queryKey: adminKeys.stats.billing });
}

export function useActivateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateBusiness(id),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}

export function useSuspendBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendBusiness(id),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}

export function useDeleteBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBusiness(id),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}
