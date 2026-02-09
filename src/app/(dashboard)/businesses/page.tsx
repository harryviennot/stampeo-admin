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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchBusinesses, type Business } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground">
          All businesses registered on the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Businesses</CardTitle>
          <CardDescription>
            {businesses.length} business{businesses.length !== 1 && "es"} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No businesses registered yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((biz) => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {biz.logo_url && (
                          <img
                            src={biz.logo_url}
                            alt=""
                            className="h-6 w-6 rounded object-cover"
                          />
                        )}
                        {biz.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {biz.url_slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          biz.subscription_tier === "pro"
                            ? "bg-violet-100 text-violet-700 border-violet-200"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {biz.subscription_tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {biz.id.slice(0, 8)}...
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
