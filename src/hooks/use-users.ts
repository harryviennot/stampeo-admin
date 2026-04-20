"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchUserDetail,
  fetchUsers,
  grantReseller,
  revokeReseller,
  updateResellerDiscount,
  type UserListParams,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: adminKeys.users.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.users.detail(id ?? ""),
    queryFn: () => fetchUserDetail(id!),
    enabled: !!id,
  });
}

function invalidateUser(
  qc: ReturnType<typeof useQueryClient>,
  userId: string
) {
  qc.invalidateQueries({ queryKey: adminKeys.users.all });
  qc.invalidateQueries({ queryKey: adminKeys.users.detail(userId) });
}

export function useGrantReseller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      discountPercent,
    }: {
      userId: string;
      discountPercent: number;
    }) => grantReseller(userId, discountPercent),
    onSuccess: (_, vars) => invalidateUser(qc, vars.userId),
  });
}

export function useRevokeReseller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      removeExistingDiscounts,
    }: {
      userId: string;
      removeExistingDiscounts: boolean;
    }) => revokeReseller(userId, removeExistingDiscounts),
    onSuccess: (_, vars) => invalidateUser(qc, vars.userId),
  });
}

export function useUpdateResellerDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      discountPercent,
      applyToExisting,
    }: {
      userId: string;
      discountPercent: number;
      applyToExisting: boolean;
    }) => updateResellerDiscount(userId, discountPercent, applyToExisting),
    onSuccess: (_, vars) => invalidateUser(qc, vars.userId),
  });
}
