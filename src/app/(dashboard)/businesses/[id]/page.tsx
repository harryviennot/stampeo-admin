"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useBusiness } from "@/hooks/use-businesses";
import { BusinessHeader } from "./_components/business-header";
import { SummaryStrip } from "./_components/summary-strip";
import { BusinessTabs } from "./_components/business-tabs";

/**
 * The superadmin support console for one business.
 *
 * Everything the platform knows about a merchant, minus their customers'
 * personal data. Identity and actions up top, the facts worth knowing on every
 * tab in the strip below them, then one tab per surface.
 */
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
    <div className="space-y-5">
      <BusinessHeader business={business} />
      <SummaryStrip business={business} />
      <BusinessTabs business={business} />
    </div>
  );
}
