"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCardDesigns, type CardDesignListParams } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useCardDesigns(params: CardDesignListParams = {}) {
  return useQuery({
    queryKey: adminKeys.cardDesigns.list(params),
    queryFn: () => fetchCardDesigns(params),
    placeholderData: keepPreviousData,
  });
}
