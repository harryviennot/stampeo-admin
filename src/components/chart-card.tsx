"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/info-tooltip";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  legend?: React.ReactNode;
  info?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  headerRight,
  legend,
  info,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col min-w-0", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-base">{title}</CardTitle>
              {info && <InfoTooltip content={info} />}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {legend}
            {headerRight}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

export function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-sm" style={{ background: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
