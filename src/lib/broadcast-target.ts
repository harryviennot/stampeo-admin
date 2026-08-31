/**
 * Turn a broadcast's stored `target_filter` into words.
 *
 * The raw JSON is unreadable at a glance (`{"value_min":5,"inactive_days":30}`),
 * and support needs to answer "who did this actually go to?" without decoding
 * it. Pure, so the rules are unit-tested rather than eyeballed.
 *
 * Legacy rows written before the stamps->scans rename carry
 * `stamp_count_min/max` instead of `value_min/max`; both are read here for the
 * same reason the merchant app normalizes them.
 */

export type TargetFilter = Record<string, unknown>;

function num(filter: TargetFilter, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = filter[key];
    if (typeof v === "number") return v;
  }
  return null;
}

export function describeTargetFilter(filter: TargetFilter | null | undefined): string {
  if (!filter || typeof filter !== "object") return "Everyone";
  if (filter.all === true) return "Everyone";

  const parts: string[] = [];

  const min = num(filter, "value_min", "stamp_count_min");
  const max = num(filter, "value_max", "stamp_count_max");
  if (min !== null && max !== null) parts.push(`progress ${min}–${max}`);
  else if (min !== null) parts.push(`progress ${min}+`);
  else if (max !== null) parts.push(`progress up to ${max}`);

  const before = num(filter, "enrolled_before_days");
  if (before !== null) parts.push(`joined more than ${before}d ago`);

  const after = num(filter, "enrolled_after_days");
  if (after !== null) parts.push(`joined within ${after}d`);

  const inactive = num(filter, "inactive_days");
  if (inactive !== null) parts.push(`inactive ${inactive}d+`);

  if (filter.has_unredeemed_reward === true) parts.push("holds a reward");
  if (filter.has_redeemed === true) parts.push("has redeemed before");
  if (filter.has_redeemed === false) parts.push("never redeemed");

  const enrolledAt = filter.enrolled_at_location_ids as
    | { ids?: unknown[]; include_no_location?: boolean }
    | undefined;
  if (enrolledAt?.ids?.length) {
    parts.push(
      `enrolled at ${enrolledAt.ids.length} location${enrolledAt.ids.length === 1 ? "" : "s"}` +
        (enrolledAt.include_no_location ? " (or none)" : "")
    );
  }

  const activeAt = filter.active_at_location_ids as
    | { ids?: unknown[]; days?: number }
    | undefined;
  if (activeAt?.ids?.length) {
    parts.push(
      `active at ${activeAt.ids.length} location${activeAt.ids.length === 1 ? "" : "s"}` +
        (activeAt.days ? ` in ${activeAt.days}d` : "")
    );
  }

  return parts.length ? parts.join(" · ") : "Everyone";
}
