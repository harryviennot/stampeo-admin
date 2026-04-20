import type {
  BusinessListParams,
  CustomerSignupsByBizParams,
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
  },
  businesses: {
    all: ["businesses"] as const,
    list: (p: BusinessListParams) => ["businesses", "list", p] as const,
    detail: (id: string) => ["businesses", "detail", id] as const,
    stats: (id: string) => ["businesses", "stats", id] as const,
    members: (id: string) => ["businesses", "members", id] as const,
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
