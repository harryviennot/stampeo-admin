"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchActivationFunnel,
  fetchBillingBreakdown,
  fetchBroadcastDeliverability,
  fetchCustomerSignupsByBusiness,
  fetchGlobalStats,
  fetchHeardFromStats,
  fetchInactiveSnapshot,
  fetchOnboardingBreakdowns,
  fetchOnboardingFunnel,
  fetchPassLifecycle,
  fetchSetupWizardFunnel,
  fetchStampHeatmap,
  fetchTimeseries,
  fetchTopBusinesses,
  fetchTopBusinessesAllTime,
  fetchTopBusinessesDensity,
  fetchTrialCohorts,
  type BucketRangeParams,
  type CustomerSignupsByBizParams,
  type RangeParams,
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

export function useOnboardingBreakdowns() {
  return useQuery({
    queryKey: adminKeys.stats.onboardingBreakdowns,
    queryFn: fetchOnboardingBreakdowns,
  });
}

export function useOnboardingFunnel(params: RangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.onboardingFunnel(params),
    queryFn: () => fetchOnboardingFunnel(params),
  });
}

export function useSetupWizardFunnel(params: RangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.setupWizardFunnel(params),
    queryFn: () => fetchSetupWizardFunnel(params),
  });
}

export function useActivationFunnel(params: RangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.activationFunnel(params),
    queryFn: () => fetchActivationFunnel(params),
  });
}

export function useInactiveSnapshot() {
  return useQuery({
    queryKey: adminKeys.stats.inactiveSnapshot,
    queryFn: fetchInactiveSnapshot,
  });
}

export function usePassLifecycle(params: BucketRangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.passLifecycle(params),
    queryFn: () => fetchPassLifecycle(params),
  });
}

export function useTrialCohorts(weeks: number = 12) {
  return useQuery({
    queryKey: adminKeys.stats.trialCohorts(weeks),
    queryFn: () => fetchTrialCohorts(weeks),
  });
}

export function useBroadcastDeliverability(params: BucketRangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.broadcastDeliverability(params),
    queryFn: () => fetchBroadcastDeliverability(params),
  });
}

export function useStampHeatmap(params: RangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.stampHeatmap(params),
    queryFn: () => fetchStampHeatmap(params),
  });
}

export function useTopBusinessesDensity(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinessesDensity(limit),
    queryFn: () => fetchTopBusinessesDensity(limit),
  });
}
