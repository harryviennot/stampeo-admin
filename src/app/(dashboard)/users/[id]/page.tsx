"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Calendar,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoRow } from "@/components/info-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ResellerBadge,
  StatusBadge,
} from "@/components/business-utils";
import {
  useGrantReseller,
  useRevokeReseller,
  useUpdateResellerDiscount,
  useUser,
} from "@/hooks/use-users";

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: "bg-violet-50 text-violet-700 border-violet-200",
    admin: "bg-blue-50 text-blue-700 border-blue-200",
    scanner: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <Badge variant="outline" className={styles[role] || ""}>
      {role}
    </Badge>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: user, isPending, isError, error } = useUser(id);
  const grant = useGrantReseller();
  const revoke = useRevokeReseller();
  const update = useUpdateResellerDiscount();
  const resellerActing =
    grant.isPending || revoke.isPending || update.isPending;

  const [discountPercent, setDiscountPercent] = useState(25);
  const [newDiscountPercent, setNewDiscountPercent] = useState(25);
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [removeDiscounts, setRemoveDiscounts] = useState(false);

  useEffect(() => {
    if (isError) {
      toast.error("User not found", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      router.push("/users");
    }
  }, [isError, error, router]);

  const handleGrantReseller = () => {
    if (!user) return;
    if (discountPercent < 1 || discountPercent > 50) {
      toast.error("Discount must be between 1% and 50%");
      return;
    }
    grant.mutate(
      { userId: user.id, discountPercent },
      {
        onSuccess: () =>
          toast.success(
            `Reseller status granted with ${discountPercent}% discount`
          ),
        onError: (err) =>
          toast.error("Failed to grant reseller status", {
            description: err instanceof Error ? err.message : "Unknown error",
          }),
      }
    );
  };

  const handleRevokeReseller = () => {
    if (!user) return;
    revoke.mutate(
      { userId: user.id, removeExistingDiscounts: removeDiscounts },
      {
        onSuccess: () => {
          toast.success(
            removeDiscounts
              ? "Reseller status revoked and discounts removed"
              : "Reseller status revoked (existing discounts kept)"
          );
          setRemoveDiscounts(false);
        },
        onError: (err) =>
          toast.error("Failed to revoke reseller status", {
            description: err instanceof Error ? err.message : "Unknown error",
          }),
      }
    );
  };

  const handleUpdateDiscount = () => {
    if (!user) return;
    if (newDiscountPercent < 1 || newDiscountPercent > 50) {
      toast.error("Discount must be between 1% and 50%");
      return;
    }
    update.mutate(
      {
        userId: user.id,
        discountPercent: newDiscountPercent,
        applyToExisting,
      },
      {
        onSuccess: () => {
          toast.success(
            applyToExisting
              ? `Discount updated to ${newDiscountPercent}% (applied to existing subscriptions)`
              : `Discount updated to ${newDiscountPercent}% (new subscriptions only)`
          );
          setApplyToExisting(false);
        },
        onError: (err) =>
          toast.error("Failed to update reseller discount", {
            description: err instanceof Error ? err.message : "Unknown error",
          }),
      }
    );
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const roles = [...new Set(user.memberships.map((m) => m.role))];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => router.push("/users")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Users
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {user.name}
              </h1>
              {roles.map((role) => (
                <RoleBadge key={role} role={role} />
              ))}
              {user.is_reseller && <ResellerBadge />}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <InfoRow label="Name" value={user.name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Locale" value={user.locale} />
            <InfoRow
              label="Joined"
              value={new Date(user.created_at).toLocaleDateString()}
            />
          </CardContent>
        </Card>

        {/* Reseller Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reseller Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {user.is_reseller
                    ? `Active — ${user.reseller_discount_percent ?? "?"}% discount on all tiers`
                    : "Not a reseller"}
                </div>
                {user.is_reseller && user.reseller_granted_at && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Granted on{" "}
                    {new Date(user.reseller_granted_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              {user.is_reseller ? (
                <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      disabled={resellerActing}
                    >
                      {resellerActing && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Revoke
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Revoke reseller status?
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-3">
                          <p>
                            This will remove reseller status from {user.name}.
                            New businesses they create will no longer receive a discount.
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={removeDiscounts}
                              onChange={(e) => setRemoveDiscounts(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">
                              Also remove discounts from existing subscriptions
                            </span>
                          </label>
                          {removeDiscounts && (
                            <p className="text-xs text-red-600">
                              All {user.memberships.filter((m) => m.role === "owner").length} business(es)
                              owned by this user will pay full price starting next billing cycle.
                            </p>
                          )}
                          {!removeDiscounts && (
                            <p className="text-xs text-muted-foreground">
                              Existing subscriptions will keep their current {user.reseller_discount_percent}% discount.
                            </p>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleRevokeReseller}
                      >
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog onOpenChange={(open) => {
                  if (open) setNewDiscountPercent(user.reseller_discount_percent ?? 25);
                }}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resellerActing}
                    >
                      Change discount
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Change reseller discount</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-3">
                          <p>
                            Current discount: <strong>{user.reseller_discount_percent ?? "?"}%</strong>.
                            Choose a new rate for {user.name}.
                          </p>
                          <div>
                            <Label htmlFor="new-discount-input" className="text-sm font-medium">
                              New discount (1–50%)
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                id="new-discount-input"
                                type="number"
                                min={1}
                                max={50}
                                value={newDiscountPercent}
                                onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={applyToExisting}
                              onChange={(e) => setApplyToExisting(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Apply to existing subscriptions</span>
                          </label>
                          {applyToExisting ? (
                            <p className="text-xs text-amber-600">
                              All active subscriptions and their billing page prices will switch to {newDiscountPercent}%. Stripe coupons are swapped — the new rate applies from the next billing cycle.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Only new subscriptions will use {newDiscountPercent}%. Existing ones keep {user.reseller_discount_percent ?? "?"}%.
                            </p>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleUpdateDiscount}
                        disabled={newDiscountPercent < 1 || newDiscountPercent > 50 || newDiscountPercent === (user.reseller_discount_percent ?? -1)}
                      >
                        Update to {newDiscountPercent}%
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      disabled={resellerActing}
                    >
                      {resellerActing && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      Grant Reseller
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Grant reseller status
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-3">
                          <p>
                            Choose a discount percentage for {user.name}.
                            A unique Stripe coupon will be created automatically.
                          </p>
                          <div>
                            <Label htmlFor="discount-input" className="text-sm font-medium">
                              Discount (1–50%)
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                id="discount-input"
                                type="number"
                                min={1}
                                max={50}
                                value={discountPercent}
                                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This discount will apply to all new business subscriptions
                            created by this user. Existing businesses are not affected.
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleGrantReseller}
                        disabled={discountPercent < 1 || discountPercent > 50}
                      >
                        Grant with {discountPercent}% discount
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Businesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Businesses ({user.memberships.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {user.memberships.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This user doesn&apos;t belong to any business.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.businesses ? (
                        <div className="flex items-center gap-3">
                          <BusinessInitials
                            name={m.businesses.name}
                          />
                          <div>
                            <Link
                              href={`/businesses/${m.business_id}`}
                              className="font-medium hover:underline"
                            >
                              {m.businesses.name}
                            </Link>
                            <div className="font-mono text-xs text-muted-foreground">
                              /{m.businesses.url_slug}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={m.role} />
                    </TableCell>
                    <TableCell>
                      {m.businesses && (
                        <StatusBadge status={m.businesses.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
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
