"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPassTypeIds,
  fetchPoolStats,
  fetchReclaimCandidates,
  releasePassTypeId,
  revokePassTypeId,
  uploadCertificate,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useCertPool() {
  return useQuery({
    queryKey: adminKeys.certs.pool,
    queryFn: fetchPoolStats,
  });
}

export function usePassTypeIds() {
  return useQuery({
    queryKey: adminKeys.certs.passTypeIds,
    queryFn: fetchPassTypeIds,
  });
}

export function useReclaimCandidates() {
  return useQuery({
    queryKey: adminKeys.certs.reclaimCandidates,
    queryFn: fetchReclaimCandidates,
  });
}

function invalidateCerts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.certs.pool });
  qc.invalidateQueries({ queryKey: adminKeys.certs.passTypeIds });
  qc.invalidateQueries({ queryKey: adminKeys.certs.reclaimCandidates });
  qc.invalidateQueries({ queryKey: adminKeys.stats.overview });
}

export function useUploadCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => uploadCertificate(formData),
    onSuccess: () => invalidateCerts(qc),
  });
}

export function useRevokePassTypeId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokePassTypeId(id),
    onSuccess: () => invalidateCerts(qc),
  });
}

export function useReleasePassTypeId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releasePassTypeId(id),
    onSuccess: (_data, _id, _ctx) => {
      invalidateCerts(qc);
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}
