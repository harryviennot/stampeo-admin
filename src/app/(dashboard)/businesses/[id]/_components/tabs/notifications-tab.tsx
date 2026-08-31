"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useBusinessNotifications } from "@/hooks/use-businesses";
import type { AdminMilestone, AdminNotificationTemplate } from "@/lib/api";
import { limitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const LOCALES = ["fr", "en", "es", "pl"] as const;

const TRIGGER_LABELS: Record<string, string> = {
  stamp_added: "Stamp added",
  points_earned: "Points earned",
  points_boosted: "Points earned with a basket boost",
  reward_earned: "Reward earned",
  reward_completed: "Final reward earned",
  reward_redeemed: "Reward redeemed",
  near_reward: "Close to a reward",
  milestone: "Milestone",
};

function LocaleBodies({
  body,
  defaultBody,
  authored,
}: {
  body: Record<string, string>;
  defaultBody: Record<string, string>;
  authored: string[] | undefined;
}) {
  return (
    <div className="space-y-1.5">
      {LOCALES.filter((l) => body[l] || defaultBody[l]).map((locale) => {
        // An unauthored locale comes back with an EMPTY body: the customer
        // receives Stampeo's default wording, not the merchant's. That gap is
        // the whole reason this panel shows both columns.
        const isAuthored = authored ? authored.includes(locale) : !!body[locale];
        const text = body[locale] || defaultBody[locale] || "";
        return (
          <div key={locale} className="flex gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 w-8 shrink-0 font-mono text-xs uppercase",
                isAuthored ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {locale}
            </span>
            <span className={cn("min-w-0", !isAuthored && "text-muted-foreground")}>
              {text}
              {!isAuthored && (
                <span className="ml-1.5 text-xs italic">
                  (Stampeo default — merchant never wrote this language)
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TemplateRow({ item }: { item: AdminNotificationTemplate }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        item.is_enabled ? "bg-muted/20" : "border-amber-200 bg-amber-50/50"
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {item.is_enabled ? (
          <Bell className="h-4 w-4 text-emerald-600" />
        ) : (
          <BellOff className="h-4 w-4 text-amber-600" />
        )}
        <span className="text-sm font-medium">
          {TRIGGER_LABELS[item.trigger] ?? item.trigger}
        </span>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {item.trigger}
        </code>
        {!item.is_enabled && (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            disabled by merchant
          </Badge>
        )}
        {item.is_customized ? (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            custom copy
          </Badge>
        ) : (
          <Badge variant="outline">default copy</Badge>
        )}
        {!item.is_editable && (
          <Badge
            variant="outline"
            className="border-gray-200 bg-gray-50 text-gray-600"
          >
            plan does not allow editing
          </Badge>
        )}
      </div>
      <LocaleBodies
        body={item.body}
        defaultBody={item.default_body}
        authored={item.authored_locales}
      />
    </div>
  );
}

function MilestoneRow({ item }: { item: AdminMilestone }) {
  const threshold = item.value ?? item.stamp_equals;
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">At {threshold}</span>
        {item.metric && <Badge variant="outline">{item.metric}</Badge>}
        {!item.is_enabled && (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            disabled
          </Badge>
        )}
      </div>
      <LocaleBodies body={item.body} defaultBody={{}} authored={undefined} />
    </div>
  );
}

export function NotificationsTab({ businessId }: { businessId: string }) {
  const { data, isPending, isError } = useBusinessNotifications(businessId);

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
        title="Could not load notifications"
        description="The request failed. Try refreshing."
      />
    );
  }

  if (!data.program_id) {
    return (
      <EmptyState
        title="No program"
        description="Notification copy lives on a program, and this business has none."
      />
    );
  }

  const allDisabled =
    data.items.length > 0 && data.items.every((i) => !i.is_enabled);

  return (
    <div className="space-y-4">
      {allDisabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Every notification is switched off. Customers of this business receive
          no wallet push at all.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Wallet push copy ({data.items.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Exactly what the merchant sees in their own editor. Triggers are
            type-aware: a {data.program_type} program never lists the other
            type&apos;s triggers.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.items.length === 0 ? (
            <EmptyState title="No triggers for this program type" />
          ) : (
            data.items.map((item) => (
              <TemplateRow key={item.trigger} item={item} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Milestones ({data.milestones.items.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Plan allows: {limitLabel(data.milestones.limit)}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.milestones.items.length === 0 ? (
            <EmptyState
              title="No milestones"
              description={
                data.milestones.limit === 0
                  ? "This plan does not include milestones."
                  : "The merchant has not added any."
              }
            />
          ) : (
            data.milestones.items.map((item) => (
              <MilestoneRow key={item.id} item={item} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
