"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  fetchBusinesses,
  activateBusiness,
  suspendBusiness,
  type Business,
} from "@/lib/api";
import { Loader2 } from "lucide-react";

function BusinessInitials({ name, color }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
      style={{ backgroundColor: color || "#6366f1" }}
    >
      {initials}
    </div>
  );
}

function PlanBadge({ tier }: { tier: string }) {
  const variant = tier === "pro" ? "default" : "outline";
  const className =
    tier === "pro"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : "bg-secondary text-secondary-foreground";
  return (
    <Badge variant={variant} className={className}>
      {tier}
    </Badge>
  );
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchBusinesses();
      setBusinesses(data);
    } catch (err) {
      toast.error("Failed to load businesses", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActivate = async (id: string) => {
    setActing(id);
    try {
      await activateBusiness(id);
      toast.success("Business activated");
      await loadData();
    } catch (err) {
      toast.error("Failed to activate", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActing(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActing(id);
    try {
      await suspendBusiness(id);
      toast.success("Business suspended");
      await loadData();
    } catch (err) {
      toast.error("Failed to suspend", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActing(null);
    }
  };

  const pending = businesses.filter((b) => b.status === "pending");
  const active = businesses.filter((b) => b.status === "active");
  const suspended = businesses.filter((b) => b.status === "suspended");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground">
          {businesses.length} business{businesses.length !== 1 && "es"} on the
          platform.
        </p>
      </div>

      {/* Pending Applications */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Pending Applications</h2>
          {pending.length > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {pending.length}
            </Badge>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending applications.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((biz) => (
              <Card key={biz.id} className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <BusinessInitials
                      name={biz.name}
                      color={biz.settings?.accentColor}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{biz.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        /{biz.url_slug}
                      </CardDescription>
                    </div>
                    <PlanBadge tier={biz.subscription_tier} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {(biz.owner_name || biz.owner_email) && (
                    <div className="text-sm">
                      {biz.owner_name && (
                        <span className="font-medium">{biz.owner_name}</span>
                      )}
                      {biz.owner_email && (
                        <span className="text-muted-foreground">
                          {biz.owner_name ? " · " : ""}
                          {biz.owner_email}
                        </span>
                      )}
                    </div>
                  )}
                  {biz.settings?.category && (
                    <div className="text-sm text-muted-foreground">
                      {biz.settings.category}
                    </div>
                  )}
                  {biz.settings?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {biz.settings.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Applied {new Date(biz.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={acting === biz.id}
                      onClick={() => handleActivate(biz.id)}
                    >
                      {acting === biz.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : null}
                      Accept
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          disabled={acting === biz.id}
                        >
                          Deny
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deny application?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will suspend &quot;{biz.name}&quot;. The owner
                            will not be able to use the platform.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleSuspend(biz.id)}
                          >
                            Deny
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Active Businesses */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Active Businesses ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active businesses yet.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Activated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((biz) => (
                    <TableRow key={biz.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BusinessInitials
                            name={biz.name}
                            color={biz.settings?.accentColor}
                          />
                          <div>
                            <div className="font-medium">{biz.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              /{biz.url_slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {biz.owner_name && (
                            <div className="font-medium">{biz.owner_name}</div>
                          )}
                          {biz.owner_email && (
                            <div className="text-xs text-muted-foreground">
                              {biz.owner_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {biz.settings?.category || "—"}
                      </TableCell>
                      <TableCell>
                        <PlanBadge tier={biz.subscription_tier} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {biz.activated_at
                          ? new Date(biz.activated_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              disabled={acting === biz.id}
                            >
                              Suspend
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Suspend business?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will suspend &quot;{biz.name}&quot;. They
                                will no longer be able to stamp customers or
                                manage their account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleSuspend(biz.id)}
                              >
                                Suspend
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Suspended Businesses */}
      {suspended.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Suspended ({suspended.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Suspended Since</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspended.map((biz) => (
                    <TableRow key={biz.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BusinessInitials
                            name={biz.name}
                            color={biz.settings?.accentColor}
                          />
                          <div>
                            <div className="font-medium">{biz.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              /{biz.url_slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {biz.owner_name && (
                            <div className="font-medium">{biz.owner_name}</div>
                          )}
                          {biz.owner_email && (
                            <div className="text-xs text-muted-foreground">
                              {biz.owner_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(biz.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-200 text-green-600 hover:bg-green-50"
                          disabled={acting === biz.id}
                          onClick={() => handleActivate(biz.id)}
                        >
                          {acting === biz.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
