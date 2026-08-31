"use client";

import { ArrowRight, CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react";
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
import { InfoRow } from "@/components/info-row";
import { useBusinessSubscription } from "@/hooks/use-businesses";
import {
  GATE_REASON_LABELS,
  type CheckoutGateReason,
} from "@/lib/checkout-gate";
import type { BusinessSubscription } from "@/lib/api";

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

const BILLING_STATUS_STYLES: Record<string, string> = {
  trial: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  grace: "bg-amber-100 text-amber-700 border-amber-200",
  past_due: "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  open: "bg-blue-100 text-blue-700 border-blue-200",
  uncollectible: "bg-red-100 text-red-700 border-red-200",
  void: "bg-gray-100 text-gray-700 border-gray-200",
  draft: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatMoney(amountInCents: number, currency: string) {
  const code = (currency || "eur").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).format(amountInCents / 100);
  } catch {
    return `${(amountInCents / 100).toFixed(2)} ${code}`;
  }
}

function formatUnixDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatIsoDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BillingTab({ businessId }: { businessId: string }) {
  const { data, isPending, isError, error } = useBusinessSubscription(businessId);

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            title="Could not load the subscription"
            description={error instanceof Error ? error.message : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SubscriptionOverview data={data} />
      <SubscriptionStripeIds data={data} />
      <TierChangesCard data={data} />
      <InvoicesCard data={data} />
      {data.stripe_error && (
        <Card>
          <CardContent className="py-3 text-xs text-amber-700 bg-amber-50 rounded-b-xl">
            Stripe lookup failed — invoice & tier-change history may be
            incomplete. ({data.stripe_error})
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SubscriptionOverview({ data }: { data: BusinessSubscription }) {
  const tierLabel = data.subscription_tier
    ? TIER_LABELS[data.subscription_tier] || data.subscription_tier
    : "—";
  const statusKey = data.billing_status || "trial";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Plan & Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <InfoRow
          label="Plan"
          value={
            <span className="flex items-center gap-2">
              <span>{tierLabel}</span>
              {data.is_founding_partner && (
                <Badge
                  variant="outline"
                  className="bg-violet-50 text-violet-700 border-violet-200 gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Founding
                </Badge>
              )}
              {(data.current_price_meta?.interval ?? data.billing_interval) ===
                "year" && (
                <Badge
                  variant="outline"
                  className="bg-sky-50 text-sky-700 border-sky-200"
                >
                  Yearly
                </Badge>
              )}
              {data.current_price_meta?.kind === "founding" && (
                <span className="text-xs text-muted-foreground">
                  (founding price)
                </span>
              )}
            </span>
          }
        />
        <InfoRow
          label="Status"
          value={
            <Badge
              variant="outline"
              className={
                BILLING_STATUS_STYLES[statusKey] ||
                "bg-gray-50 text-gray-700 border-gray-200"
              }
            >
              {statusKey}
            </Badge>
          }
        />
        <InfoRow label="Trial ends" value={formatIsoDate(data.trial_ends_at)} />
        <InfoRow label="Grace ends" value={formatIsoDate(data.grace_ends_at)} />
        {/* Payment-failure deadline. Distinct from "Grace ends" above, which is
            the trial-grace anchor: this one cuts access for a delinquent card. */}
        <InfoRow
          label="Payment grace ends"
          value={formatIsoDate(data.payment_grace_ends_at)}
        />
        {data.checkout_grace_until && (
          <InfoRow
            label="Checkout override until"
            value={formatIsoDate(data.checkout_grace_until)}
          />
        )}
        {data.checkout_gate_reason && (
          <InfoRow
            label="Checkout gate"
            value={
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                {GATE_REASON_LABELS[
                  data.checkout_gate_reason as CheckoutGateReason
                ] ?? data.checkout_gate_reason}
              </Badge>
            }
          />
        )}
        <InfoRow
          label="Current period ends"
          value={formatIsoDate(data.billing_period_end)}
        />
        {/* A queued Stripe schedule flips the cadence at period end. Nothing
            has changed yet, so this is separate from the Plan row above. */}
        {data.pending_billing_interval && (
          <InfoRow
            label="Billing cycle switch"
            value={
              <span className="text-sm">
                Switches to {data.pending_billing_interval}ly on{" "}
                {formatIsoDate(data.billing_period_end)}
              </span>
            }
          />
        )}
        <InfoRow
          label="Cancelled at"
          value={formatIsoDate(data.cancelled_at)}
        />
        <InfoRow
          label="Reseller discount"
          value={
            data.reseller_discount_applied != null
              ? `${data.reseller_discount_applied}%`
              : "—"
          }
        />
        <InfoRow
          label="Total paid"
          value={
            <span>
              <span className="text-base font-semibold">
                {formatMoney(data.total_paid, data.total_paid_currency)}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                {data.paid_invoice_count}{" "}
                {data.paid_invoice_count === 1 ? "invoice" : "invoices"}
              </span>
            </span>
          }
        />
      </CardContent>
    </Card>
  );
}

function SubscriptionStripeIds({ data }: { data: BusinessSubscription }) {
  if (!data.stripe_customer_id && !data.stripe_subscription_id) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stripe</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        {data.stripe_customer_id && (
          <InfoRow
            label="Customer ID"
            value={
              <span className="font-mono text-xs">
                {data.stripe_customer_id}
              </span>
            }
          />
        )}
        {data.stripe_subscription_id && (
          <InfoRow
            label="Subscription ID"
            value={
              <span className="font-mono text-xs">
                {data.stripe_subscription_id}
              </span>
            }
          />
        )}
        {data.stripe_price_id && (
          <InfoRow
            label="Current price ID"
            value={
              <span className="font-mono text-xs">{data.stripe_price_id}</span>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function planLabel(
  tier: string | null | undefined,
  interval: "month" | "year" | null | undefined,
): string {
  if (!tier) return "—";
  const label = TIER_LABELS[tier] || tier;
  if (!interval) return label;
  return `${label} ${interval === "year" ? "/yr" : "/mo"}`;
}

function TierChangesCard({ data }: { data: BusinessSubscription }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Plan changes ({data.tier_changes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.tier_changes.length === 0 ? (
          <EmptyState
            title="No plan changes"
            description="They have stayed on the same plan and cadence since signup."
          />
        ) : (
          <ul className="space-y-2">
            {data.tier_changes.map((change) => (
              <li
                key={change.id}
                className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
              >
                {/* A row can be a pure cadence switch (same tier, /mo -> /yr),
                    so the interval is part of the label, not a separate badge. */}
                <div className="flex items-center gap-2 font-medium">
                  <span>{planLabel(change.old_tier, change.old_interval)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{planLabel(change.new_tier, change.new_interval)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatUnixDate(change.created)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function InvoicesCard({ data }: { data: BusinessSubscription }) {
  const invoices = data.invoices;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Invoices ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {invoices.length === 0 ? (
          <EmptyState
            title={
              data.stripe_customer_id
                ? "No invoices yet"
                : "Not connected to Stripe"
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Number</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-xs">
                    {formatUnixDate(inv.paid_at ?? inv.created)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        INVOICE_STATUS_STYLES[inv.status ?? ""] ||
                        "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {inv.status ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatMoney(
                      inv.amount_paid ?? inv.amount_due ?? 0,
                      inv.currency ?? data.total_paid_currency
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {inv.period_start && inv.period_end
                      ? `${formatUnixDate(inv.period_start)} – ${formatUnixDate(inv.period_end)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {inv.number ?? "—"}
                  </TableCell>
                  <TableCell>
                    {inv.hosted_invoice_url && (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        aria-label="Open invoice in Stripe"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
