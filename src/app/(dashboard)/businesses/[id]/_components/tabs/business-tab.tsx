"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { InfoGrid, InfoRow } from "@/components/info-row";
import type { Business } from "@/lib/api";
import { countryLabel, formatDateTime, localeLabel } from "@/lib/format";

const HEARD_FROM_LABELS: Record<string, string> = {
  google: "Google / Search",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  article: "Article / Blog",
  friend: "Friend / Colleague",
  business: "A Stampeo business",
  other: "Other",
};

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: "Solo",
  small: "Small (2–5)",
  medium: "Medium (6–20)",
  large: "Large (20+)",
  "2-5": "2–5",
};

const LOCATIONS_LABELS: Record<string, string> = {
  one: "1 location",
  few: "2–5 locations",
  several: "6–20 locations",
  many: "20+ locations",
  "1": "1 location",
  "2-5": "2–5 locations",
};

const PRIMARY_GOAL_LABELS: Record<string, string> = {
  retention: "Retention",
  frequency: "Frequency",
  basket: "Bigger baskets",
  acquisition: "Acquisition",
  retain: "Retention",
};

const MODE_TONE: Record<string, string> = {
  required: "border-blue-200 bg-blue-50 text-blue-700",
  optional: "border-gray-200 bg-gray-50 text-gray-700",
  off: "border-amber-200 bg-amber-50 text-amber-700",
};

function formatBusinessInfoEntry(entry: {
  type: string;
  data: Record<string, unknown>;
}): { label: string; value: string } | null {
  const data = entry.data ?? {};
  switch (entry.type) {
    case "phone":
      return data.number
        ? { label: "Business phone", value: String(data.number) }
        : null;
    case "website":
      return data.url
        ? { label: "Business website", value: String(data.url) }
        : null;
    case "email":
      return data.email
        ? { label: "Business email", value: String(data.email) }
        : null;
    case "address":
      return data.address
        ? { label: "Address", value: String(data.address) }
        : null;
    case "hours":
      return { label: "Opening hours", value: "(set)" };
    case "custom":
      return data.label && data.value
        ? { label: String(data.label), value: String(data.value) }
        : null;
    default:
      return null;
  }
}

/** `off` is not the same as deleted: the field leaves the sign-up form but
 *  stored answers keep rendering on cards. Absent means "never a choice". */
function modeOf(value: unknown): string {
  if (value === true) return "required";
  if (value === false || value === undefined || value === null) return "off";
  return String(value);
}

type CustomField = {
  key: string;
  label?: string;
  type?: string;
  mode?: string;
  helper_text?: string;
  options?: string[];
  fallback?: string;
  max_length?: number | null;
  min?: number | null;
  max?: number | null;
  sensitive_ack?: boolean;
  translations?: Record<string, Record<string, unknown>>;
};

function SignupFields({ business }: { business: Business }) {
  const collection = (business.settings?.customer_data_collection ?? {}) as {
    collect_name?: unknown;
    collect_email?: unknown;
    collect_phone?: unknown;
    collect_birthday?: unknown;
    custom_fields?: CustomField[];
    predefined?: Record<string, Record<string, unknown>>;
  };

  const predefined = [
    { key: "name", mode: modeOf(collection.collect_name) },
    { key: "email", mode: modeOf(collection.collect_email) },
    { key: "phone", mode: modeOf(collection.collect_phone) },
    { key: "birthday", mode: modeOf(collection.collect_birthday) },
  ];
  const custom = collection.custom_fields ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign-up fields</CardTitle>
        <p className="text-xs text-muted-foreground">
          What this merchant asks their customers for. These are the field
          DEFINITIONS — the answers customers gave are their personal data and
          are never shown here.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Built-in
          </div>
          <div className="flex flex-wrap gap-2">
            {predefined.map((field) => (
              <Badge
                key={field.key}
                variant="outline"
                className={MODE_TONE[field.mode] ?? MODE_TONE.off}
              >
                {field.key}: {field.mode}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Merchant-defined ({custom.length})
          </div>
          {custom.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No custom fields.
            </p>
          ) : (
            <div className="space-y-3">
              {custom.map((field) => (
                <div
                  key={field.key}
                  className="rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{field.label}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {`{{${field.key}}}`}
                    </code>
                    <Badge variant="outline">{field.type}</Badge>
                    <Badge
                      variant="outline"
                      className={MODE_TONE[field.mode ?? "required"]}
                    >
                      {field.mode ?? "required"}
                    </Badge>
                    {field.sensitive_ack && (
                      <Badge
                        variant="outline"
                        className="border-violet-200 bg-violet-50 text-violet-700"
                      >
                        Article 9 acknowledged
                      </Badge>
                    )}
                  </div>
                  {field.helper_text && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {field.helper_text}
                    </p>
                  )}
                  <InfoGrid className="mt-2 lg:grid-cols-3">
                    {field.options && field.options.length > 0 && (
                      <InfoRow
                        label="Options"
                        value={field.options.join(" · ")}
                      />
                    )}
                    <InfoRow
                      label="Fallback when unanswered"
                      value={
                        field.fallback
                          ? field.fallback
                          : "(hides the whole line)"
                      }
                    />
                    {field.translations && (
                      <InfoRow
                        label="Translated into"
                        value={Object.keys(field.translations).join(", ")}
                      />
                    )}
                  </InfoGrid>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessTab({ business }: { business: Business }) {
  const settings = business.settings ?? {};
  const infoEntries = business.business_info ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoGrid>
            <InfoRow label="Name" value={business.name} />
            <InfoRow label="Slug" value={`/${business.url_slug}`} mono />
            <InfoRow label="Business id" value={business.id} mono />
            <InfoRow
              label="Category"
              value={settings.category as string | undefined}
            />
            <InfoRow
              label="Primary locale"
              value={localeLabel(business.primary_locale)}
            />
            <InfoRow
              label="Country"
              value={
                <span>
                  {countryLabel(business.country_code, business.country)}
                  {business.country_source && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (via {business.country_source})
                    </span>
                  )}
                </span>
              }
            />
            <InfoRow label="Timezone" value={business.timezone} />
            <InfoRow
              label="Applied"
              value={formatDateTime(business.created_at)}
            />
            <InfoRow
              label="Activated"
              value={formatDateTime(business.activated_at)}
            />
            <InfoRow
              label="Loyalty-card website"
              value={
                business.identity_website ? (
                  <a
                    href={
                      business.identity_website.startsWith("http")
                        ? business.identity_website
                        : `https://${business.identity_website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {business.identity_website}
                  </a>
                ) : null
              }
            />
            {(settings.description as string | undefined) && (
              <InfoRow
                span
                label="Description"
                value={settings.description as string}
              />
            )}
          </InfoGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoGrid>
            <InfoRow label="Name" value={business.owner_name} />
            <InfoRow label="Email" value={business.owner_email} />
            <InfoRow label="Phone" value={business.owner_phone} />
            <InfoRow
              label="Reseller"
              value={business.owner_is_reseller ? "Yes" : "No"}
            />
          </InfoGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Contact details on the card back
          </CardTitle>
        </CardHeader>
        <CardContent>
          {infoEntries.length === 0 ? (
            <EmptyState
              title="Nothing added"
              description="The card back shows no shop contact details."
            />
          ) : (
            <InfoGrid>
              {infoEntries.map((entry, idx) => {
                const formatted = formatBusinessInfoEntry(entry);
                if (!formatted) return null;
                return (
                  <InfoRow
                    key={`${entry.type}-${idx}`}
                    label={formatted.label}
                    value={formatted.value}
                  />
                );
              })}
            </InfoGrid>
          )}
        </CardContent>
      </Card>

      <SignupFields business={business} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signup survey</CardTitle>
          <p className="text-xs text-muted-foreground">
            What the owner told us at signup. Claims, not facts — compare
            against the real counts above.
          </p>
        </CardHeader>
        <CardContent>
          <InfoGrid>
            <InfoRow
              label="Heard from"
              value={
                business.heard_from === "other" && business.heard_from_other
                  ? `Other: ${business.heard_from_other}`
                  : business.heard_from
                    ? (HEARD_FROM_LABELS[business.heard_from] ??
                      business.heard_from)
                    : null
              }
            />
            <InfoRow
              label="Team size"
              value={
                business.team_size
                  ? (TEAM_SIZE_LABELS[business.team_size] ?? business.team_size)
                  : null
              }
            />
            <InfoRow
              label="Locations"
              value={
                business.locations_count
                  ? (LOCATIONS_LABELS[business.locations_count] ??
                    business.locations_count)
                  : null
              }
            />
            <InfoRow
              label="Primary goal"
              value={
                business.primary_goal
                  ? (PRIMARY_GOAL_LABELS[business.primary_goal] ??
                    business.primary_goal)
                  : null
              }
            />
            <InfoRow
              label="Business type"
              value={settings.business_type as string | undefined}
            />
          </InfoGrid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Raw settings</CardTitle>
          <p className="text-xs text-muted-foreground">
            Everything in <code>businesses.settings</code>, for the cases the
            panels above do not cover.
          </p>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
