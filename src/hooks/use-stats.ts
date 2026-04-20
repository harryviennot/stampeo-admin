"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchBillingBreakdown,
  fetchGlobalStats,
  fetchHeardFromStats,
  fetchTimeseries,
  fetchTopBusinesses,
  type TimeseriesParams,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export function useGlobalStats() {
  return useQuery({
    queryKey: adminKeys.stats.overview,
    queryFn: fetchGlobalStats,
  });
}

export function useBillingBreakdown() {
  return useQuery({
    queryKey: adminKeys.stats.billing,
    queryFn: fetchBillingBreakdown,
  });
}

export function useTimeseries(params: TimeseriesParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.timeseries(params),
    queryFn: () => fetchTimeseries(params),
  });
}

export function useTopBusinesses(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinesses(limit),
    queryFn: () => fetchTopBusinesses(limit),
  });
}

export function useHeardFromStats() {
  return useQuery({
    queryKey: adminKeys.stats.heardFrom,
    queryFn: fetchHeardFromStats,
  });
}
