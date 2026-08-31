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
  fetchBusinessActivity,
  fetchBusinessBroadcasts,
  fetchBusinessComms,
  fetchBusinessDesigns,
  fetchBusinessHealth,
  fetchBusinessLocations,
  fetchBusinessNotifications,
  fetchBusinessProgram,
  fetchBusinessTeam,
  rebuildCardAssets,
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

// ── Business support console ──────────────────────────────────────────────
// One hook per tab. Radix unmounts an inactive TabsContent, so a panel's query
// only fires when somebody actually opens that tab.

export function useBusinessTeam(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.team(id ?? ""),
    queryFn: () => fetchBusinessTeam(id!),
    enabled: !!id,
  });
}

export function useBusinessProgram(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.program(id ?? ""),
    queryFn: () => fetchBusinessProgram(id!),
    enabled: !!id,
  });
}

export function useBusinessDesigns(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.designs(id ?? ""),
    queryFn: () => fetchBusinessDesigns(id!),
    enabled: !!id,
  });
}

export function useBusinessLocations(id: string | undefined, range = "30d") {
  return useQuery({
    queryKey: adminKeys.businesses.locations(id ?? "", range),
    queryFn: () => fetchBusinessLocations(id!, range),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useBusinessNotifications(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.notifications(id ?? ""),
    queryFn: () => fetchBusinessNotifications(id!),
    enabled: !!id,
  });
}

export function useBusinessBroadcasts(
  id: string | undefined,
  limit = 25,
  offset = 0
) {
  return useQuery({
    queryKey: adminKeys.businesses.broadcasts(id ?? "", limit, offset),
    queryFn: () => fetchBusinessBroadcasts(id!, limit, offset),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useBusinessActivity(
  id: string | undefined,
  limit = 50,
  offset = 0
) {
  return useQuery({
    queryKey: adminKeys.businesses.activity(id ?? "", limit, offset),
    queryFn: () => fetchBusinessActivity(id!, limit, offset),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useBusinessComms(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.comms(id ?? ""),
    queryFn: () => fetchBusinessComms(id!),
    enabled: !!id,
  });
}

export function useBusinessHealth(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.businesses.health(id ?? ""),
    queryFn: () => fetchBusinessHealth(id!),
    enabled: !!id,
  });
}

/** Rebuild the active design's strips and re-push every installed pass. */
export function useRebuildCardAssets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rebuildCardAssets(id),
    onSuccess: (_data, id) => {
      // strip_status flips to `regenerating`, which the health chips read.
      qc.invalidateQueries({ queryKey: adminKeys.businesses.designs(id) });
      qc.invalidateQueries({ queryKey: adminKeys.businesses.health(id) });
    },
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
