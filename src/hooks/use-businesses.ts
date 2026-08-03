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
  fetchBusinessInactiveSnapshot,
  fetchBusinessMembers,
  fetchBusinessPassLifecycle,
  fetchBusinesses,
  fetchBusinessStats,
  fetchBusinessSubscription,
  grantNoCardTrial,
  requireCard,
  extendCheckoutWindow,
  extendPaymentGrace,
  suspendBusiness,
  type BucketRangeParams,
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

export function useBusinessPassLifecycle(
  id: string | undefined,
  params: BucketRangeParams = {}
) {
  return useQuery({
    queryKey: adminKeys.businesses.passLifecycle(id ?? "", params),
    queryFn: () => fetchBusinessPassLifecycle(id!, params),
    enabled: !!id,
  });
}

export function useBusinessInactiveSnapshot(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.inactive(id ?? ""),
    queryFn: () => fetchBusinessInactiveSnapshot(id!),
    enabled: !!id,
  });
}

export function useBusinessSubscription(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.subscription(id ?? ""),
    queryFn: () => fetchBusinessSubscription(id!),
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

export function useGrantNoCardTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => grantNoCardTrial(id),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}

export function useRequireCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requireCard(id),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}

/** Escape hatch: give a gated pending_checkout business more free setup time. */
export function useExtendCheckoutWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      extendCheckoutWindow(id, days),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}

/** Escape hatch: push back a payment deadline, lifting a payment suspension. */
export function useExtendPaymentGrace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      extendPaymentGrace(id, days),
    onSuccess: () => invalidateBusinessLists(qc),
  });
}
