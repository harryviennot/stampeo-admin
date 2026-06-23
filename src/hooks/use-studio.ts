"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStudioVariant,
  fetchStudioHealth,
  fetchStudioVariant,
  fetchStudioVariants,
  pushAllStudio,
  pushStudioVariant,
  seedStudioVariants,
  StudioSpec,
  upsertStudioVariant,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useStudioVariants() {
  return useQuery({
    queryKey: adminKeys.studio.list,
    queryFn: fetchStudioVariants,
  });
}

export function useStudioVariant(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.studio.detail(id ?? ""),
    queryFn: () => fetchStudioVariant(id as string),
    enabled: !!id,
  });
}

export function useStudioHealth() {
  return useQuery({
    queryKey: adminKeys.studio.health,
    queryFn: fetchStudioHealth,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.studio.all });
}

export function useSeedStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedStudioVariants,
    onSuccess: () => invalidate(qc),
  });
}

export function useUpsertStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, spec }: { id: string; spec: StudioSpec }) =>
      upsertStudioVariant(id, spec),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudioVariant(id),
    onSuccess: () => invalidate(qc),
  });
}

export function usePushStudio() {
  return useMutation({
    mutationFn: (id: string) => pushStudioVariant(id),
  });
}

export function usePushAllStudio() {
  return useMutation({
    mutationFn: pushAllStudio,
  });
}
