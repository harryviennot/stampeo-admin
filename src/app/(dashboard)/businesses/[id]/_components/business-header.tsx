"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BusinessInitials,
  BillingStatusBadge,
  FoundingPartnerBadge,
  PlanBadge,
  ResellerBadge,
  StatusBadge,
} from "@/components/business-utils";
import {
  useActivateBusiness,
  useSuspendBusiness,
} from "@/hooks/use-businesses";
import type { Business } from "@/lib/api";

export function BusinessHeader({ business }: { business: Business }) {
  const router = useRouter();
  const activate = useActivateBusiness();
  const suspend = useSuspendBusiness();

  const busy = activate.isPending || suspend.isPending;

  const handleActivate = () =>
    activate.mutate(business.id, {
      onSuccess: () => toast.success("Business activated"),
      onError: (err) =>
        toast.error("Failed to activate", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });

  const handleSuspend = () =>
    suspend.mutate(business.id, {
      onSuccess: () => toast.success("Business suspended"),
      onError: (err) =>
        toast.error("Failed to suspend", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => router.push("/businesses")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Businesses
      </Button>

      <div className="flex items-start gap-4">
        {business.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={business.logo_url}
            alt={business.name}
            className="h-12 w-12 rounded-xl object-cover"
          />
        ) : (
          <BusinessInitials
            name={business.name}
            color={business.settings?.accentColor}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {business.name}
            </h1>
            <StatusBadge status={business.status} />
            <PlanBadge tier={business.subscription_tier} />
            <BillingStatusBadge status={business.billing_status} />
            {business.is_founding_partner && <FoundingPartnerBadge />}
            {business.owner_is_reseller && <ResellerBadge />}
          </div>
          <div className="font-mono text-sm text-muted-foreground mt-0.5">
            /{business.url_slug}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/businesses/${business.id}/access-sessions`}>
              <History className="mr-1 h-3.5 w-3.5" />
              Access log
            </Link>
          </Button>
          {business.status === "active" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={busy}
                >
                  {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Suspend
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend business?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will suspend &quot;{business.name}&quot;. They will no
                    longer be able to stamp customers or manage their account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleSuspend}
                  >
                    Suspend
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
              disabled={busy}
              onClick={handleActivate}
            >
              {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Reactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
