"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchBillingBreakdown,
  fetchCustomerSignupsByBusiness,
  fetchGlobalStats,
  fetchHeardFromStats,
  fetchTimeseries,
  fetchTopBusinesses,
  fetchTopBusinessesAllTime,
  type CustomerSignupsByBizParams,
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

export function useTopBusinessesAllTime(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinessesAllTime(limit),
    queryFn: () => fetchTopBusinessesAllTime(limit),
  });
}

export function useCustomerSignupsByBusiness(
  params: CustomerSignupsByBizParams = {}
) {
  return useQuery({
    queryKey: adminKeys.stats.customerSignupsByBiz(params),
    queryFn: () => fetchCustomerSignupsByBusiness(params),
  });
}

export function useHeardFromStats() {
  return useQuery({
    queryKey: adminKeys.stats.heardFrom,
    queryFn: fetchHeardFromStats,
  });
}
