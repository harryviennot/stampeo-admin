import type {
  BucketRangeParams,
  BusinessListParams,
  CustomerSignupsByBizParams,
  RangeParams,
  TimeseriesParams,
  UserListParams,
} from "./api";

export const adminKeys = {
  stats: {
    overview: ["stats", "overview"] as const,
    billing: ["stats", "billing"] as const,
    timeseries: (p: TimeseriesParams) => ["stats", "timeseries", p] as const,
    topBusinesses: (limit: number) =>
      ["stats", "top-businesses", limit] as const,
    topBusinessesAllTime: (limit: number) =>
      ["stats", "top-businesses-all-time", limit] as const,
    customerSignupsByBiz: (p: CustomerSignupsByBizParams) =>
      ["stats", "customer-signups-by-biz", p] as const,
    heardFrom: ["stats", "heard-from"] as const,
    onboardingFunnel: (p: RangeParams) =>
      ["stats", "onboarding-funnel", p] as const,
    activationFunnel: (p: RangeParams) =>
      ["stats", "activation-funnel", p] as const,
    inactiveSnapshot: ["stats", "inactive-snapshot"] as const,
    passLifecycle: (p: BucketRangeParams) =>
      ["stats", "pass-lifecycle", p] as const,
    trialCohorts: (weeks: number) => ["stats", "trial-cohorts", weeks] as const,
    broadcastDeliverability: (p: BucketRangeParams) =>
      ["stats", "broadcast-deliverability", p] as const,
    stampHeatmap: (p: RangeParams) => ["stats", "stamp-heatmap", p] as const,
    topBusinessesDensity: (limit: number) =>
      ["stats", "top-businesses-density", limit] as const,
  },
  businesses: {
    all: ["businesses"] as const,
    list: (p: BusinessListParams) => ["businesses", "list", p] as const,
    detail: (id: string) => ["businesses", "detail", id] as const,
    stats: (id: string) => ["businesses", "stats", id] as const,
    members: (id: string) => ["businesses", "members", id] as const,
    passLifecycle: (id: string, p: BucketRangeParams) =>
      ["businesses", "pass-lifecycle", id, p] as const,
    inactive: (id: string) => ["businesses", "inactive", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (p: UserListParams) => ["users", "list", p] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  certs: {
    pool: ["certs", "pool"] as const,
    passTypeIds: ["certs", "passTypeIds"] as const,
  },
};
