"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityBadge } from "../activity-badge";
import { ChartsRow } from "../charts-row";
import { HealthPanel } from "../health-panel";
import { OnboardingProgressCard } from "../onboarding-progress-card";
import { PassLifecycleChart } from "../pass-lifecycle-chart";
import { StatsRow } from "../stats-row";
import { ActivityFeed } from "./activity-feed";
import type { Business } from "@/lib/api";

export function OverviewTab({ business }: { business: Business }) {
  return (
    <div className="space-y-6">
      <HealthPanel businessId={business.id} />

      <div className="flex items-center">
        <ActivityBadge businessId={business.id} />
      </div>

      <StatsRow businessId={business.id} />
      <ChartsRow businessId={business.id} />
      <PassLifecycleChart businessId={business.id} />
      <OnboardingProgressCard business={business} />
      <ActivityFeed businessId={business.id} />
    </div>
  );
}
