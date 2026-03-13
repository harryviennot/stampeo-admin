import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
  badgeClass?: string;
  trend?: { current: number; previous: number };
}

export function StatCard({
  label,
  value,
  loading,
  icon,
  badgeClass,
  trend,
}: StatCardProps) {
  const trendPct =
    trend && trend.previous > 0
      ? Math.round(((trend.current - trend.previous) / trend.previous) * 100)
      : null;
  const trendUp = trendPct !== null ? trendPct >= 0 : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" />
              ) : (
                value ?? 0
              )}
            </p>
            {!loading && trend && (
              <div className="flex items-center gap-1 text-xs">
                {trendPct !== null ? (
                  <>
                    {trendUp ? (
                      <ArrowUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={
                        trendUp ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {trendUp ? "+" : ""}
                      {trendPct}%
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {trend.current} this month (new)
                  </span>
                )}
              </div>
            )}
          </div>
          <Badge
            className={badgeClass ?? "bg-secondary text-secondary-foreground"}
            variant="secondary"
          >
            {icon}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
