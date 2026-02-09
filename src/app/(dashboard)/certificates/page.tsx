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
  fetchPassTypeIds,
  revokePassTypeId,
  type PassTypeId,
} from "@/lib/api";
import { ShieldOff, Loader2 } from "lucide-react";

const statusConfig = {
  available: { label: "Available", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  assigned: { label: "Assigned", className: "bg-blue-100 text-blue-700 border-blue-200" },
  revoked: { label: "Revoked", className: "bg-red-100 text-red-700 border-red-200" },
} as const;

export default function CertificatesPage() {
  const [passTypeIds, setPassTypeIds] = useState<PassTypeId[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchPassTypeIds();
      setPassTypeIds(data);
    } catch (err) {
      toast.error("Failed to load certificates", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRevoke(id: string, identifier: string) {
    setRevokingId(id);
    try {
      await revokePassTypeId(id);
      toast.success("Certificate revoked", {
        description: `${identifier} has been revoked`,
      });
      loadData();
    } catch (err) {
      toast.error("Revoke failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground">
          All Pass Type ID certificates in the pool.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Pool</CardTitle>
          <CardDescription>
            {passTypeIds.length} certificate{passTypeIds.length !== 1 && "s"}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : passTypeIds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No certificates uploaded yet. Go to the Dashboard to upload one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Team ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passTypeIds.map((item) => {
                  const status = statusConfig[item.status] ?? statusConfig.available;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.identifier}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.team_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.business_name ? (
                          <span>{item.business_name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.assigned_at
                          ? new Date(item.assigned_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status !== "revoked" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={revokingId === item.id}
                              >
                                {revokingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ShieldOff className="h-4 w-4" />
                                )}
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke Certificate
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke{" "}
                                  <strong>{item.identifier}</strong>? This will
                                  prevent the associated business from
                                  generating new passes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() =>
                                    handleRevoke(item.id, item.identifier)
                                  }
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Revoked
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
