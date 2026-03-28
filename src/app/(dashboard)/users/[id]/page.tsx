"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  fetchUserDetail,
  grantReseller,
  revokeReseller,
  type AdminUserDetail,
} from "@/lib/api";
import {
  BusinessInitials,
  ResellerBadge,
  StatusBadge,
  PlanBadge,
} from "@/components/business-utils";

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resellerActing, setResellerActing] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const data = await fetchUserDetail(id);
      setUser(data);
    } catch (err) {
      toast.error("User not found", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      router.push("/users");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleGrantReseller = async () => {
    if (!user) return;
    setResellerActing(true);
    try {
      await grantReseller(user.id);
      toast.success("Reseller status granted");
      await loadUser();
    } catch (err) {
      toast.error("Failed to grant reseller status", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setResellerActing(false);
    }
  };

  const handleRevokeReseller = async () => {
    if (!user) return;
    setResellerActing(true);
    try {
      await revokeReseller(user.id);
      toast.success("Reseller status revoked");
      await loadUser();
    } catch (err) {
      toast.error("Failed to revoke reseller status", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setResellerActing(false);
    }
  };

  if (loading) {
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
                    ? "Active — 30% discount on all tiers"
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
                      <AlertDialogDescription>
                        This will remove reseller status from {user.name},
                        removing the 30% discount from all{" "}
                        {user.memberships.length} business
                        {user.memberships.length !== 1 && "es"} they belong to.
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
                        Grant reseller status?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will grant reseller status to {user.name}, applying
                        a 30% discount across all tiers for all businesses they
                        own.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleGrantReseller}
                      >
                        Grant
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
