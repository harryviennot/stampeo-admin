"use client";

import { ArrowRight, Coins, CircleDot, Gift, Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import { useBusinessProgram } from "@/hooks/use-businesses";
import type { AdminProgram } from "@/lib/api";
import { formatDate, formatDateTime, limitLabel } from "@/lib/format";

function unit(program: AdminProgram): string {
  return program.type === "points" ? "pts" : "stamps";
}

function num(config: Record<string, unknown>, key: string): number | null {
  const v = config[key];
  return typeof v === "number" ? v : null;
}

function bool(config: Record<string, unknown>, key: string): boolean {
  return config[key] === true;
}

function EarningCap({ program }: { program: AdminProgram }) {
  const cap = program.config.earning_cap as
    | { per_day?: number | null; per_week?: number | null; week_mode?: string }
    | null
    | undefined;
  const { configured, allowed } = program.limits.earning_caps;

  if (!configured) return <InfoRow label="Earning cap" value="None" />;

  return (
    <InfoRow
      label="Earning cap"
      value={
        <span className="flex flex-wrap items-center gap-1.5">
          <span>
            {cap?.per_day ? `${cap.per_day}/day` : "—/day"}
            {" · "}
            {cap?.per_week ? `${cap.per_week}/week` : "—/week"}
            {cap?.week_mode ? ` (${cap.week_mode})` : ""}
          </span>
          {/* Left over from a downgrade: stored, but the plan stops enforcing
              it. Support needs to know the cap is not actually applying. */}
          {!allowed && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-700"
            >
              not enforced on this plan
            </Badge>
          )}
        </span>
      }
    />
  );
}

function BasketBoost({ program }: { program: AdminProgram }) {
  const boost = program.limits.basket_boost_tiers;
  const tiers =
    ((program.config.basket_boost as { tiers?: Record<string, unknown>[] })
      ?.tiers as { threshold: number; kind: string; value: number }[]) ?? [];

  if (!boost.configured) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          Basket boosters
          {boost.clamped && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-700"
            >
              {boost.applied} of {boost.configured} applying
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {boost.clamped && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This plan applies {limitLabel(boost.limit).toLowerCase()} tier
            {boost.limit === 1 ? "" : "s"}. The lowest-threshold rungs keep
            paying out; the rest are stored but never fire. A merchant looking
            at their own settings sees all {boost.configured}.
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Spend threshold</TableHead>
              <TableHead>Boost</TableHead>
              <TableHead className="text-right">Applies?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier, i) => (
              <TableRow key={`${tier.threshold}-${i}`}>
                <TableCell className="font-medium">{tier.threshold}</TableCell>
                <TableCell>
                  {tier.kind === "multiplier"
                    ? `×${tier.value} on the whole basket`
                    : `+${tier.value} pts`}
                </TableCell>
                <TableCell className="text-right">
                  {i < boost.applied ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      yes
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-gray-200 bg-gray-50 text-gray-600"
                    >
                      never fires
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProgramCard({ program }: { program: AdminProgram }) {
  const isPoints = program.type === "points";
  const config = program.config;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {isPoints ? (
              <Coins className="h-4 w-4" />
            ) : (
              <CircleDot className="h-4 w-4" />
            )}
            {program.name || "Untitled program"}
            <Badge variant="outline" className="capitalize">
              {program.type ?? "unknown"}
            </Badge>
            {program.is_default && (
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                default
              </Badge>
            )}
            {!program.is_active && (
              <Badge
                variant="outline"
                className="border-gray-200 bg-gray-50 text-gray-600"
              >
                inactive
              </Badge>
            )}
            {!program.limits.user_configured && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                never configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium">
            {program.summary}
          </div>

          <InfoGrid>
            {isPoints ? (
              <>
                <InfoRow
                  label="Earn rate"
                  value={`${num(config, "points_per_currency_unit") ?? 0} pts per unit spent`}
                />
                <InfoRow
                  label="Starting balance"
                  value={
                    num(config, "initial_points")
                      ? `${num(config, "initial_points")} pts at enrollment`
                      : "None"
                  }
                />
                <InfoRow
                  label="Balance cap"
                  value={
                    num(config, "max_balance")
                      ? `${num(config, "max_balance")} pts`
                      : "Uncapped"
                  }
                />
              </>
            ) : (
              <>
                <InfoRow
                  label="Card length"
                  value={`${num(config, "total_stamps") ?? "—"} stamps`}
                />
                <InfoRow
                  label="Prestamp"
                  value={
                    num(config, "initial_stamps")
                      ? `${num(config, "initial_stamps")} at enrollment`
                      : "None"
                  }
                />
                <InfoRow
                  label="Stackable rewards"
                  value={
                    bool(config, "stackable_rewards")
                      ? `Yes (max ${num(config, "max_stacked_rewards") ?? "∞"})`
                      : "No — card resets on redeem"
                  }
                />
              </>
            )}
            <EarningCap program={program} />
            <InfoRow
              label="Redemption policy"
              value={(config.redemption_policy as string) ?? "—"}
            />
            <InfoRow label="Created" value={formatDate(program.created_at)} />
            <InfoRow label="Updated" value={formatDate(program.updated_at)} />
            {program.type_changed_at && (
              <InfoRow
                label="Type last changed"
                value={formatDateTime(program.type_changed_at)}
              />
            )}
          </InfoGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4" />
            Reward ladder ({program.rewards.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {program.rewards.length === 0 ? (
            <EmptyState
              title="No rewards configured"
              description="Customers have nothing to earn towards."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Threshold</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="w-40">Id</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {program.rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">
                      {reward.threshold} {unit(program)}
                    </TableCell>
                    <TableCell>{reward.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {reward.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BasketBoost program={program} />

      {program.back_fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Card back fields ({program.back_fields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
              {JSON.stringify(program.back_fields, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {Object.keys(program.translations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Translations</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
              {JSON.stringify(program.translations, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ProgramTab({ businessId }: { businessId: string }) {
  const { data, isPending, isError } = useBusinessProgram(businessId);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load the program"
        description="The request failed. Try refreshing."
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="No loyalty program"
        description="This business has no program row at all — nothing can be earned."
      />
    );
  }

  return (
    <div className="space-y-6">
      {data.items.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}

      {data.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Promotional events ({data.events.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(event.starts_at)} – {formatDate(event.ends_at)}
                    </TableCell>
                    <TableCell>{event.is_active ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Program conversions ({data.conversions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.conversions.length === 0 ? (
            <EmptyState
              title="Never converted"
              description="This business has not switched between stamps and points."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Change</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="flex items-center gap-1.5 font-medium capitalize">
                        {c.from_type}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.to_type}
                      </span>
                    </TableCell>
                    <TableCell>{c.rate ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {c.converted_count} / {c.total_enrollments}
                      {c.skipped_count > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({c.skipped_count} skipped)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(c.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
