import type {
  AccessSessionListParams,
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
    revenue: ["stats", "revenue"] as const,
    billingOverview: ["stats", "billing-overview"] as const,
    revenueTrend: (months: number) =>
      ["stats", "revenue-trend", months] as const,
    upcomingPayments: (limit: number) =>
      ["stats", "upcoming-payments", limit] as const,
    atRiskPayments: ["stats", "at-risk-payments"] as const,
    billingProjections: ["stats", "billing-projections"] as const,
    conversionCohorts: (granularity: string, universe: string) =>
      ["stats", "conversion-cohorts", granularity, universe] as const,
    timeseries: (p: TimeseriesParams) => ["stats", "timeseries", p] as const,
    topBusinesses: (limit: number) =>
      ["stats", "top-businesses", limit] as const,
    topBusinessesAllTime: (limit: number) =>
      ["stats", "top-businesses-all-time", limit] as const,
    customerSignupsByBiz: (p: CustomerSignupsByBizParams) =>
      ["stats", "customer-signups-by-biz", p] as const,
    customerSignupsTopPerBucket: (p: CustomerSignupsByBizParams) =>
      ["stats", "customer-signups-top-per-bucket", p] as const,
    heardFrom: ["stats", "heard-from"] as const,
    onboardingBreakdowns: ["stats", "onboarding-breakdowns"] as const,
    onboardingFunnel: (p: RangeParams) =>
      ["stats", "onboarding-funnel", p] as const,
    setupWizardFunnel: (p: RangeParams) =>
      ["stats", "setup-wizard-funnel", p] as const,
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
    platformHealth: ["stats", "platform-health"] as const,
    businessRetention: (weeks: number) =>
      ["stats", "business-retention", weeks] as const,
    paywallFunnel: (weeks: number) => ["stats", "paywall-funnel", weeks] as const,
    paywallCohorts: (weeks: number) =>
      ["stats", "paywall-cohorts", weeks] as const,
    topBusinessesRewards: (limit: number) =>
      ["stats", "top-businesses-rewards", limit] as const,
    topBusinessesRepeat: (limit: number) =>
      ["stats", "top-businesses-repeat", limit] as const,
    topBusinessesHealth: (limit: number) =>
      ["stats", "top-businesses-health", limit] as const,
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
    subscription: (id: string) => ["businesses", "subscription", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (p: UserListParams) => ["users", "list", p] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  certs: {
    pool: ["certs", "pool"] as const,
    passTypeIds: ["certs", "passTypeIds"] as const,
    reclaimCandidates: ["certs", "reclaimCandidates"] as const,
  },
  accessSessions: {
    all: ["accessSessions"] as const,
    list: (p: AccessSessionListParams) =>
      ["accessSessions", "list", p] as const,
    detail: (id: string) => ["accessSessions", "detail", id] as const,
  },
  emails: {
    list: ["emails", "list"] as const,
    preview: (
      category: string,
      name: string,
      locale: "fr" | "en" | "es",
      variant?: string
    ) => ["emails", "preview", category, name, locale, variant ?? ""] as const,
    flows: ["emails", "flows"] as const,
  },
  changelog: {
    all: ["changelog"] as const,
    draft: ["changelog", "draft"] as const,
    releases: ["changelog", "releases"] as const,
    release: (id: string) => ["changelog", "release", id] as const,
  },
};
