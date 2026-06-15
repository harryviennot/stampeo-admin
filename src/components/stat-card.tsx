import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";
import { InfoTooltip } from "@/components/info-tooltip";

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  loading: boolean;
  icon: React.ReactNode;
  badgeClass?: string;
  trend?: { current: number; previous: number };
  /** Optional period count shown under the lifetime value, e.g. "1,204 in last 30d". */
  subValue?: { current: number; label: string };
  info?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  loading,
  icon,
  badgeClass,
  trend,
  subValue,
  info,
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
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {info && <InfoTooltip content={info} />}
            </div>
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" />
              ) : (
                value ?? 0
              )}
            </p>
            {!loading && subValue && (
              <p className="text-xs font-medium tabular-nums text-foreground/80">
                {subValue.current.toLocaleString()} {subValue.label}
              </p>
            )}
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
                    <span className="text-muted-foreground">vs prior 30d</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {trend.current} last 30d (new)
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
