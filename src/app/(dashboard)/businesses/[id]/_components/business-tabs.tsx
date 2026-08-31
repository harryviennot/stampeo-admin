"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Business } from "@/lib/api";
import { OverviewTab } from "./tabs/overview-tab";
import { BusinessTab } from "./tabs/business-tab";
import { ProgramTab } from "./tabs/program-tab";
import { CardTab } from "./tabs/card-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { BroadcastsTab } from "./tabs/broadcasts-tab";
import { TeamTab } from "./tabs/team-tab";
import { LocationsTab } from "./tabs/locations-tab";
import { BillingTab } from "./tabs/billing-tab";
import { OpsTab } from "./tabs/ops-tab";

const TABS = [
  "overview",
  "business",
  "program",
  "card",
  "notifications",
  "broadcasts",
  "team",
  "locations",
  "billing",
  "ops",
] as const;

type TabKey = (typeof TABS)[number];

const LABELS: Record<TabKey, string> = {
  overview: "Overview",
  business: "Business",
  program: "Program",
  card: "Card",
  notifications: "Notifications",
  broadcasts: "Broadcasts",
  team: "Team",
  locations: "Locations",
  billing: "Billing",
  ops: "Ops",
};

function TabsInner({ business }: { business: Business }) {
  const router = useRouter();
  const params = useSearchParams();

  const raw = params.get("tab");
  const active: TabKey = (TABS as readonly string[]).includes(raw ?? "")
    ? (raw as TabKey)
    : "overview";

  // The URL is the source of truth, like every other admin list page -- so a
  // tab is linkable ("look at ?tab=broadcasts") and survives a refresh.
  const setTab = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  return (
    <Tabs value={active} onValueChange={setTab}>
      <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:flex lg:justify-end lg:px-0">
        <TabsList variant="line" className="w-max">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Radix unmounts an inactive panel, so each tab's queries only fire
          when somebody opens it -- ten panels never load at once. */}
      <TabsContent value="overview">
        <OverviewTab business={business} />
      </TabsContent>
      <TabsContent value="business">
        <BusinessTab business={business} />
      </TabsContent>
      <TabsContent value="program">
        <ProgramTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="card">
        <CardTab business={business} />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="broadcasts">
        <BroadcastsTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="team">
        <TeamTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="locations">
        <LocationsTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="billing">
        <BillingTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="ops">
        <OpsTab business={business} />
      </TabsContent>
    </Tabs>
  );
}

export function BusinessTabs({ business }: { business: Business }) {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <TabsInner business={business} />
    </Suspense>
  );
}
