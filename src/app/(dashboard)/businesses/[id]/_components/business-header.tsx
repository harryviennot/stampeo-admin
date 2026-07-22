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
  useGrantNoCardTrial,
  useRequireCard,
  useSuspendBusiness,
} from "@/hooks/use-businesses";
import type { Business } from "@/lib/api";

export function BusinessHeader({ business }: { business: Business }) {
  const router = useRouter();
  const activate = useActivateBusiness();
  const suspend = useSuspendBusiness();
  const grantNoCard = useGrantNoCardTrial();
  const requireCardMut = useRequireCard();

  const busy =
    activate.isPending ||
    suspend.isPending ||
    grantNoCard.isPending ||
    requireCardMut.isPending;

  // Card-required is the signup default; a no-card trial is a superadmin
  // exception. `requires_card_upfront === false` means the exception is granted.
  const isNoCard = business.requires_card_upfront === false;
  // Only offer a no-card trial before any card is attached — i.e. still parked
  // at checkout. A business with a subscription / card on file must not be
  // detached (the backend rejects it too).
  const canGrantNoCard = business.billing_status === "pending_checkout";

  const handleGrantNoCard = () =>
    grantNoCard.mutate(business.id, {
      onSuccess: () => toast.success("No-card trial granted"),
      onError: (err) =>
        toast.error("Could not grant no-card trial", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });

  const handleRequireCard = () =>
    requireCardMut.mutate(business.id, {
      onSuccess: () => toast.success("Reverted to card-required"),
      onError: (err) =>
        toast.error("Could not revert to card-required", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });

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

          {isNoCard ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={handleRequireCard}
            >
              {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Require card
            </Button>
          ) : canGrantNoCard ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={busy}>
                  {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Grant no-card trial
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Grant a no-card trial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{business.name}&quot; hasn&apos;t attached a card yet.
                    This starts a fresh trial without one and lifts the checkout
                    gate; they&apos;ll need a card only once the trial ends.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGrantNoCard}>
                    Grant no-card trial
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}

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
                    longer be able to scan customers or manage their account.
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
