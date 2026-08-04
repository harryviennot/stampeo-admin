"use client";

import { useState } from "react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  availableBusinessActions,
  type BusinessAction,
  type BusinessActionId,
} from "@/lib/business-actions";
import {
  useActivateBusiness,
  useExtendCheckoutWindow,
  useExtendPaymentGrace,
  useGrantNoCardTrial,
  useRequireCard,
  useSuspendBusiness,
} from "@/hooks/use-businesses";
import { useReleasePassTypeId } from "@/hooks/use-certificates";
import { useBusinessStats } from "@/hooks/use-businesses";

interface RowBusiness {
  id: string;
  name: string;
  status: string;
  billing_status?: string | null;
  requires_card_upfront?: boolean;
  payment_grace_ends_at?: string | null;
}

/**
 * Row-level superadmin actions, mirroring the business detail page.
 *
 * The certificate release needs `cert.id` + `cert.status`, which the list
 * endpoint doesn't return, so it is resolved by a per-business stats fetch that
 * only runs once the menu is opened (see `CertificateAware`). Everything else
 * is decided from fields already on the row.
 */
export function BusinessRowActions({ business }: { business: RowBusiness }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<BusinessAction | null>(null);
  const [certificate, setCertificate] = useState<{
    id: string;
    status: string;
  } | null>(null);

  const activate = useActivateBusiness();
  const suspend = useSuspendBusiness();
  const grantNoCard = useGrantNoCardTrial();
  const requireCard = useRequireCard();
  const extendWindow = useExtendCheckoutWindow();
  const extendGrace = useExtendPaymentGrace();
  const release = useReleasePassTypeId();

  const busy =
    activate.isPending ||
    suspend.isPending ||
    grantNoCard.isPending ||
    requireCard.isPending ||
    extendWindow.isPending ||
    extendGrace.isPending ||
    release.isPending;

  const actions = availableBusinessActions(business, {
    certificateStatus: certificate?.status ?? null,
  });

  function run(id: BusinessActionId) {
    const name = business.name;
    const ok = (msg: string) => () => toast.success(msg);
    const fail = (msg: string) => (e: Error) =>
      toast.error(msg, { description: e.message });

    switch (id) {
      case "suspend":
        return suspend.mutate(business.id, {
          onSuccess: ok(`Suspended ${name}`),
          onError: fail("Failed to suspend"),
        });
      case "activate":
        return activate.mutate(business.id, {
          onSuccess: ok(`Activated ${name}`),
          onError: fail("Failed to activate"),
        });
      case "grant_no_card_trial":
        return grantNoCard.mutate(business.id, {
          onSuccess: ok("No-card trial granted"),
          onError: fail("Could not grant no-card trial"),
        });
      case "require_card":
        return requireCard.mutate(business.id, {
          onSuccess: ok("Reverted to card-required"),
          onError: fail("Could not revert to card-required"),
        });
      case "extend_checkout_window":
        return extendWindow.mutate(
          { id: business.id, days: 7 },
          {
            onSuccess: ok("Checkout window extended by 7 days"),
            onError: fail("Could not extend the checkout window"),
          }
        );
      case "extend_payment_grace":
        return extendGrace.mutate(
          { id: business.id, days: 3 },
          {
            onSuccess: ok("Payment grace extended by 3 days"),
            onError: fail("Could not extend the payment grace"),
          }
        );
      case "release_certificate":
        if (!certificate) return;
        return release.mutate(certificate.id, {
          onSuccess: ok("Certificate released"),
          onError: fail("Release failed"),
        });
    }
  }

  function select(action: BusinessAction) {
    setOpen(false);
    // Radix unmounts the popover contents on close, so the dialog is hoisted
    // here and driven by state rather than nested in the menu.
    if (action.confirm) setPending(action);
    else run(action.id);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={busy}
            aria-label={`Actions for ${business.name}`}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-1">
          {open && (
            <CertificateAware
              businessId={business.id}
              onResolved={setCertificate}
            />
          )}
          <ul>
            {actions.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  title={action.hint}
                  onClick={() => select(action)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    action.destructive
                      ? "text-red-600 hover:bg-red-50"
                      : "hover:bg-muted/60"
                  )}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.confirm?.description.replace("{name}", business.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                pending?.destructive && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => {
                if (pending) run(pending.id);
                setPending(null);
              }}
            >
              {pending?.confirm?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Mounts only while the menu is open, so opening one row's menu is what
 * triggers its stats fetch. Renders nothing; it exists to hoist the
 * certificate into the parent once loaded.
 */
function CertificateAware({
  businessId,
  onResolved,
}: {
  businessId: string;
  onResolved: (cert: { id: string; status: string } | null) => void;
}) {
  const { data } = useBusinessStats(businessId);
  const cert = data?.certificate ?? null;

  const resolved = cert ? { id: cert.id, status: cert.status } : null;
  const key = resolved ? `${resolved.id}:${resolved.status}` : "";
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (key !== lastKey) {
    setLastKey(key);
    onResolved(resolved);
  }
  return null;
}
