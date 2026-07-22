"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchActivationFunnel,
  fetchBillingBreakdown,
  fetchBroadcastDeliverability,
  fetchCustomerSignupsByBusiness,
  fetchCustomerSignupsTopPerBucket,
  fetchGlobalStats,
  fetchBillingOverview,
  fetchRevenueTrend,
  fetchUpcomingPayments,
  fetchAtRiskPayments,
  fetchBillingProjections,
  fetchConversionCohorts,
  type CohortGranularity,
  type CohortUniverse,
  fetchHeardFromStats,
  fetchInactiveSnapshot,
  fetchOnboardingBreakdowns,
  fetchOnboardingFunnel,
  fetchPassLifecycle,
  fetchRevenueSnapshot,
  fetchSetupWizardFunnel,
  fetchScanHeatmap,
  fetchTimeseries,
  fetchTopBusinesses,
  fetchTopBusinessesAllTime,
  fetchTopBusinessesDensity,
  fetchTrialCohorts,
  fetchPlatformHealth,
  fetchBusinessRetention,
  fetchPaywallFunnel,
  fetchPaywallCohorts,
  fetchTopBusinessesRewards,
  fetchTopBusinessesRepeat,
  fetchTopBusinessesHealth,
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

export function useRevenueSnapshot() {
  return useQuery({
    queryKey: adminKeys.stats.revenue,
    queryFn: fetchRevenueSnapshot,
  });
}

export function useBillingOverview() {
  return useQuery({
    queryKey: adminKeys.stats.billingOverview,
    queryFn: fetchBillingOverview,
  });
}

export function useRevenueTrend(months: number = 12) {
  return useQuery({
    queryKey: adminKeys.stats.revenueTrend(months),
    queryFn: () => fetchRevenueTrend(months),
  });
}

export function useUpcomingPayments(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.upcomingPayments(limit),
    queryFn: () => fetchUpcomingPayments(limit),
  });
}

export function useAtRiskPayments() {
  return useQuery({
    queryKey: adminKeys.stats.atRiskPayments,
    queryFn: fetchAtRiskPayments,
  });
}

export function useBillingProjections() {
  return useQuery({
    queryKey: adminKeys.stats.billingProjections,
    queryFn: fetchBillingProjections,
  });
}

export function useConversionCohorts(
  granularity: CohortGranularity,
  universe: CohortUniverse
) {
  return useQuery({
    queryKey: adminKeys.stats.conversionCohorts(granularity, universe),
    queryFn: () => fetchConversionCohorts(granularity, universe),
    placeholderData: (prev) => prev,
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
  params: CustomerSignupsByBizParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: adminKeys.stats.customerSignupsByBiz(params),
    queryFn: () => fetchCustomerSignupsByBusiness(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCustomerSignupsTopPerBucket(
  params: CustomerSignupsByBizParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: adminKeys.stats.customerSignupsTopPerBucket(params),
    queryFn: () => fetchCustomerSignupsTopPerBucket(params),
    enabled: options?.enabled ?? true,
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

export function useScanHeatmap(params: RangeParams = {}) {
  return useQuery({
    queryKey: adminKeys.stats.scanHeatmap(params),
    queryFn: () => fetchScanHeatmap(params),
  });
}

export function useTopBusinessesDensity(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinessesDensity(limit),
    queryFn: () => fetchTopBusinessesDensity(limit),
  });
}

export function usePlatformHealth() {
  return useQuery({
    queryKey: adminKeys.stats.platformHealth,
    queryFn: fetchPlatformHealth,
  });
}

export function useBusinessRetention(weeks: number = 16) {
  return useQuery({
    queryKey: adminKeys.stats.businessRetention(weeks),
    queryFn: () => fetchBusinessRetention(weeks),
  });
}

export function usePaywallFunnel(weeks: number = 12) {
  return useQuery({
    queryKey: adminKeys.stats.paywallFunnel(weeks),
    queryFn: () => fetchPaywallFunnel(weeks),
  });
}

export function usePaywallCohorts(weeks: number = 12) {
  return useQuery({
    queryKey: adminKeys.stats.paywallCohorts(weeks),
    queryFn: () => fetchPaywallCohorts(weeks),
  });
}

export function useTopBusinessesRewards(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinessesRewards(limit),
    queryFn: () => fetchTopBusinessesRewards(limit),
  });
}

export function useTopBusinessesRepeat(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinessesRepeat(limit),
    queryFn: () => fetchTopBusinessesRepeat(limit),
  });
}

export function useTopBusinessesHealth(limit: number = 10) {
  return useQuery({
    queryKey: adminKeys.stats.topBusinessesHealth(limit),
    queryFn: () => fetchTopBusinessesHealth(limit),
  });
}
