"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useBusiness } from "@/hooks/use-businesses";
import { BusinessHeader } from "./_components/business-header";
import { StatsRow } from "./_components/stats-row";
import { ChartsRow } from "./_components/charts-row";
import { PassLifecycleChart } from "./_components/pass-lifecycle-chart";
import { ActivityBadge } from "./_components/activity-badge";
import { OnboardingProgressCard } from "./_components/onboarding-progress-card";
import { BusinessTabs } from "./_components/tabs";

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: business, isPending, isError, error } = useBusiness(id);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load business", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      router.push("/businesses");
    }
  }, [isError, error, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) return null;

  return (
    <div className="space-y-6">
      <BusinessHeader business={business} />
      <div className="flex items-center">
        <ActivityBadge businessId={business.id} />
      </div>
      <StatsRow businessId={business.id} />
      <ChartsRow businessId={business.id} />
      <PassLifecycleChart businessId={business.id} />
      <OnboardingProgressCard business={business} />
      <BusinessTabs business={business} />
    </div>
  );
}
