"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import { ScaledCardWrapper } from "@/components/card/ScaledCardWrapper";
import { WalletCard } from "@/components/card/WalletCard";
import { useBusinessDesigns } from "@/hooks/use-businesses";
import { buildPreviewValues } from "@/lib/design-preview";
import type { AdminDesign, Business } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function Swatch({ label, color }: { label: string; color?: string }) {
  if (!color) return null;
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-5 w-5 shrink-0 rounded border"
        style={{ background: color }}
      />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-xs">{color}</div>
      </div>
    </div>
  );
}

function FieldTable({
  title,
  fields,
}: {
  title: string;
  fields: { key: string; label: string; value: string }[] | undefined;
}) {
  if (!fields || fields.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title} ({fields.length})
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Key</TableHead>
            <TableHead className="w-48">Label</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, i) => (
            <TableRow key={`${field.key}-${i}`}>
              <TableCell className="font-mono text-xs">{field.key}</TableCell>
              <TableCell className="text-sm">{field.label}</TableCell>
              <TableCell className="font-mono text-xs">{field.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DesignPreview({
  design,
  business,
}: {
  design: AdminDesign;
  business: Business;
}) {
  const { values, locale } = buildPreviewValues({
    design,
    business: {
      id: business.id,
      name: business.name,
      primary_locale: business.primary_locale,
      customer_data_collection: business.settings?.customer_data_collection as
        | Record<string, unknown>
        | undefined,
    },
  });

  // Three-quarters of the way round reads as "in use". The old tab hardcoded
  // stamps={3}, which drew a stamp grid even on a points business; the points
  // balance and ladder now ride along on the design, so WalletCard resolves
  // both itself and each type renders in its own mode.
  const stamps = Math.max(1, Math.round((design.total_stamps ?? 10) * 0.75));

  return (
    <ScaledCardWrapper baseWidth={280} aspectRatio={1.282} minScale={0.6}>
      <WalletCard
        design={design}
        stamps={stamps}
        showQR={false}
        variableValues={values}
        locale={locale}
      />
    </ScaledCardWrapper>
  );
}

function DesignDetail({
  design,
  business,
}: {
  design: AdminDesign;
  business: Business;
}) {
  if (design.render_error) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-6">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <div className="text-sm font-medium">
              {design.name || "Unreadable design"}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {design.render_error}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {design.name}
          <Badge variant="outline" className="capitalize">
            {design.card_type ?? "stamp"}
          </Badge>
          {design.is_active ? (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              active
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-gray-200 bg-gray-50 text-gray-600"
            >
              draft
            </Badge>
          )}
          {design.strip_status === "regenerating" && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-700"
            >
              strips regenerating
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full max-w-[320px] shrink-0">
            <DesignPreview design={design} business={business} />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <InfoGrid className="lg:grid-cols-2">
              <InfoRow label="Design id" value={design.id} mono />
              <InfoRow
                label="Organization name"
                value={design.organization_name}
              />
              <InfoRow label="Logo text" value={design.logo_text} />
              <InfoRow label="Description" value={design.description} />
              <InfoRow
                label="Stamp icon mode"
                value={design.stamp_icon_mode ?? "preset"}
              />
              {design.card_type === "points" && (
                <InfoRow
                  label="Points strip style"
                  value={design.points_strip_style ?? "big_point"}
                />
              )}
              <InfoRow
                label="Custom stamp icons"
                value={
                  design.custom_stamp_config?.icons?.length
                    ? `${design.custom_stamp_config.icons.length} uploaded · ${design.custom_stamp_config.arrangement} · empty ${design.custom_stamp_config.empty_mode}`
                    : "None"
                }
              />
              <InfoRow
                label="Strip image"
                value={design.strip_background_url ? "Uploaded" : "None"}
              />
              <InfoRow
                label="Hidden card-back keys"
                value={
                  design.hidden_business_info_keys?.length
                    ? design.hidden_business_info_keys.join(", ")
                    : "None hidden"
                }
              />
              <InfoRow
                label="Translations"
                value={
                  design.translations &&
                  Object.keys(design.translations).length > 0
                    ? Object.keys(design.translations).join(", ")
                    : "None"
                }
              />
              <InfoRow label="Created" value={formatDate(design.created_at)} />
              <InfoRow label="Updated" value={formatDate(design.updated_at)} />
            </InfoGrid>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Colors
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Swatch label="Background" color={design.background_color} />
                <Swatch label="Foreground" color={design.foreground_color} />
                <Swatch label="Label" color={design.label_color} />
                <Swatch label="Stamp filled" color={design.stamp_filled_color} />
                <Swatch label="Stamp empty" color={design.stamp_empty_color} />
                <Swatch label="Stamp border" color={design.stamp_border_color} />
                <Swatch label="Icon" color={design.icon_color} />
                <Swatch
                  label="Progress accent"
                  color={design.progress_accent_color}
                />
                <Swatch
                  label="Strip background"
                  color={design.strip_background_color}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <FieldTable title="Secondary fields" fields={design.secondary_fields} />
          <FieldTable title="Auxiliary fields" fields={design.auxiliary_fields} />
          <FieldTable title="Back fields" fields={design.back_fields} />
        </div>
      </CardContent>
    </Card>
  );
}

export function CardTab({ business }: { business: Business }) {
  const { data, isPending, isError } = useBusinessDesigns(business.id);
  const [showDrafts, setShowDrafts] = useState(true);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load the designs"
        description="The request failed. Try refreshing."
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="No card designs"
        description="This business has never created one — customers cannot install a pass."
      />
    );
  }

  const drafts = data.items.filter((d) => !d.is_active);
  const shown = showDrafts ? data.items : data.items.filter((d) => d.is_active);

  return (
    <div className="space-y-4">
      {drafts.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {data.items.length} design{data.items.length === 1 ? "" : "s"} ·{" "}
            {drafts.length} draft{drafts.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => setShowDrafts((v) => !v)}
            className="cursor-pointer font-medium hover:underline"
          >
            {showDrafts ? "Show active only" : "Show all"}
          </button>
        </div>
      )}

      {data.schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Scheduled swaps ({data.schedules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Design</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Reverts to</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      {s.design_id}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(s.starts_at)} – {formatDate(s.ends_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.revert_to_design_id ?? "—"}
                    </TableCell>
                    <TableCell>{s.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className={cn("space-y-4")}>
        {shown.map((design) => (
          <DesignDetail key={design.id} design={design} business={business} />
        ))}
      </div>
    </div>
  );
}
