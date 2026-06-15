"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkle,
  ArrowUp,
  Bug,
  Trash,
  PencilSimple,
  Image as ImageIcon,
  Rocket,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { adminKeys } from "@/lib/query-keys";
import { areaChipClass } from "@/lib/changelog-areas";
import {
  type ChangelogArea,
  type ChangelogCategory,
  type ChangelogItem,
  type ChangelogRelease,
  type ChangelogRole,
  createChangelogItem,
  deleteChangelogItem,
  fetchChangelogDraft,
  fetchChangelogReleases,
  publishChangelogRelease,
  updateChangelogItem,
  updateChangelogRelease,
  uploadChangelogImage,
} from "@/lib/api";

const CATEGORY_META: Record<
  ChangelogCategory,
  { label: string; Icon: typeof Sparkle }
> = {
  feature: { label: "New", Icon: Sparkle },
  improvement: { label: "Improvement", Icon: ArrowUp },
  fix: { label: "Fix", Icon: Bug },
};

const ROLE_LABELS: Record<ChangelogRole, string> = {
  owner: "Owners",
  scanner: "Team (scanners)",
};

const ALL_ROLES: ChangelogRole[] = ["owner", "scanner"];

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:opacity-50";

function AreaChip({ area }: { area: ChangelogArea }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        areaChipClass(area.color)
      )}
    >
      {area.label_en}
    </span>
  );
}

export default function ChangelogPage() {
  const qc = useQueryClient();
  const draftQuery = useQuery({
    queryKey: adminKeys.changelog.draft,
    queryFn: fetchChangelogDraft,
  });
  const releasesQuery = useQuery({
    queryKey: adminKeys.changelog.releases,
    queryFn: fetchChangelogReleases,
  });

  const draft = draftQuery.data?.draft;
  const areas = useMemo(() => draftQuery.data?.areas ?? [], [draftQuery.data]);
  const items = draft?.changelog_items ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminKeys.changelog.draft });
    qc.invalidateQueries({ queryKey: adminKeys.changelog.releases });
  };

  if (draftQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading the open draft…</p>;
  }
  if (draftQuery.isError || !draft) {
    return (
      <p className="text-sm text-destructive">
        Could not load the changelog draft. {String(draftQuery.error ?? "")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
          <p className="text-sm text-muted-foreground">
            Author this week&apos;s release. Items roll up into one published post
            that powers the showcase timeline, the dashboard &ldquo;What&apos;s
            new&rdquo; widget, and the product-update email.
          </p>
        </div>
        <PublishBar
          draft={draft}
          itemCount={items.length}
          suggestedVersion={draftQuery.data?.suggested_version ?? "1.0.0"}
          onPublished={invalidate}
        />
      </div>

      <PostEditor draft={draft} onSaved={invalidate} />

      <ItemComposer
        releaseItems={items}
        areas={areas}
        onChanged={invalidate}
      />

      <PublishedReleases releases={releasesQuery.data ?? []} />
    </div>
  );
}

// ─── Post editor (title + article body + hero image) ─────────────────

function PostEditor({
  draft,
  onSaved,
}: {
  draft: ChangelogRelease;
  onSaved: () => void;
}) {
  const [titleFr, setTitleFr] = useState(draft.title_fr ?? "");
  const [titleEn, setTitleEn] = useState(draft.title_en ?? "");
  const [bodyFr, setBodyFr] = useState(draft.body_fr ?? "");
  const [bodyEn, setBodyEn] = useState(draft.body_en ?? "");
  const [uploading, setUploading] = useState(false);

  // Re-sync when the draft id changes (e.g. after a publish opens a new draft).
  useEffect(() => {
    setTitleFr(draft.title_fr ?? "");
    setTitleEn(draft.title_en ?? "");
    setBodyFr(draft.body_fr ?? "");
    setBodyEn(draft.body_en ?? "");
  }, [draft.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateChangelogRelease>[1]) =>
      updateChangelogRelease(draft.id, payload),
    onSuccess: () => {
      onSaved();
    },
    onError: (e) => toast.error(`Save failed: ${String(e)}`),
  });

  const saveField = (
    field: "title_fr" | "title_en" | "body_fr" | "body_en",
    value: string,
    original: string | null
  ) => {
    if (value === (original ?? "")) return;
    saveMutation.mutate({ [field]: value || null });
  };

  const handleImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadChangelogImage(file);
      await updateChangelogRelease(draft.id, { image_url: url });
      toast.success("Hero image updated");
      onSaved();
    } catch (e) {
      toast.error(`Upload failed: ${String(e)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Release post</CardTitle>
        <CardDescription>
          The headline, article body (Markdown), and hero image. English falls
          back to French when left empty. Changes save when you click away.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Title (FR)</Label>
            <Input
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              onBlur={() => saveField("title_fr", titleFr, draft.title_fr)}
              placeholder="Une grosse semaine pour vos cartes"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Title (EN)</Label>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              onBlur={() => saveField("title_en", titleEn, draft.title_en)}
              placeholder="A big week for your cards"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Article body (FR) — Markdown</Label>
            <textarea
              className={cn(textareaClass, "min-h-28")}
              value={bodyFr}
              onChange={(e) => setBodyFr(e.target.value)}
              onBlur={() => saveField("body_fr", bodyFr, draft.body_fr)}
              placeholder="Racontez la nouveauté principale…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Article body (EN) — Markdown</Label>
            <textarea
              className={cn(textareaClass, "min-h-28")}
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              onBlur={() => saveField("body_en", bodyEn, draft.body_en)}
              placeholder="Tell the story of the headline feature…"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Hero image (optional)</Label>
          {draft.image_url ? (
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.image_url}
                alt="Hero preview"
                className="h-28 w-48 rounded-lg border object-cover"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  saveMutation.mutate({ image_url: null });
                }}
              >
                <Trash className="h-4 w-4" /> Remove
              </Button>
            </div>
          ) : (
            <label className="flex h-28 w-48 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50">
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">{uploading ? "Uploading…" : "Upload image"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImage(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Item composer + list ────────────────────────────────────────────

const EMPTY_ITEM = {
  category: "feature" as ChangelogCategory,
  area: "" as string,
  affects: [...ALL_ROLES] as ChangelogRole[],
  title_fr: "",
  title_en: "",
  body_fr: "",
  body_en: "",
};

function ItemComposer({
  releaseItems,
  areas,
  onChanged,
}: {
  releaseItems: ChangelogItem[];
  areas: ChangelogArea[];
  onChanged: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_ITEM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ChangelogItem | null>(null);

  const reset = () => {
    setForm({ ...EMPTY_ITEM });
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category: form.category,
        area: form.area || null,
        affects: form.affects,
        title_fr: form.title_fr.trim(),
        title_en: form.title_en.trim() || null,
        body_fr: form.body_fr.trim() || null,
        body_en: form.body_en.trim() || null,
      };
      if (editingId) return updateChangelogItem(editingId, payload);
      return createChangelogItem(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Item updated" : "Item added");
      reset();
      onChanged();
    },
    onError: (e) => toast.error(`Could not save item: ${String(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChangelogItem(id),
    onSuccess: () => {
      toast.success("Item removed");
      setDeleting(null);
      onChanged();
    },
    onError: (e) => toast.error(`Delete failed: ${String(e)}`),
  });

  const startEdit = (item: ChangelogItem) => {
    setEditingId(item.id);
    setForm({
      category: item.category,
      area: item.area ?? "",
      affects: item.affects?.length ? item.affects : [...ALL_ROLES],
      title_fr: item.title_fr,
      title_en: item.title_en ?? "",
      body_fr: item.body_fr ?? "",
      body_en: item.body_en ?? "",
    });
  };

  const toggleRole = (role: ChangelogRole) => {
    setForm((f) => {
      const has = f.affects.includes(role);
      const next = has ? f.affects.filter((r) => r !== role) : [...f.affects, role];
      return { ...f, affects: next.length ? next : f.affects };
    });
  };

  const areaBySlug = useMemo(
    () => new Map(areas.map((a) => [a.slug, a])),
    [areas]
  );

  const canSave = form.title_fr.trim().length > 0 && form.affects.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items ({releaseItems.length})</CardTitle>
        <CardDescription>
          Each line is tagged with a platform area and the roles it affects.
          Owners and team members only receive the items that concern them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Existing items */}
        <div className="space-y-2">
          {releaseItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No items yet. Add the first one below.
            </p>
          ) : (
            releaseItems.map((item) => {
              const meta = CATEGORY_META[item.category];
              const area = item.area ? areaBySlug.get(item.area) : undefined;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <meta.Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{item.title_fr}</span>
                      {area && <AreaChip area={area} />}
                      <span className="text-[11px] text-muted-foreground">
                        {item.affects.map((r) => ROLE_LABELS[r]).join(" · ")}
                      </span>
                    </div>
                    {item.title_en && (
                      <p className="truncate text-xs text-muted-foreground">
                        EN: {item.title_en}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(item)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer form */}
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            {editingId ? "Edit item" : "Add item"}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                className={cn(textareaClass, "h-9")}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ChangelogCategory,
                  }))
                }
              >
                {(Object.keys(CATEGORY_META) as ChangelogCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Area</Label>
              <select
                className={cn(textareaClass, "h-9")}
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              >
                <option value="">— none —</option>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.label_en}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Affects</Label>
              <div className="flex h-9 items-center gap-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.affects.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title (FR) *</Label>
              <Input
                value={form.title_fr}
                onChange={(e) => setForm((f) => ({ ...f, title_fr: e.target.value }))}
                placeholder="Nouvelles icônes de tampon"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Title (EN)</Label>
              <Input
                value={form.title_en}
                onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                placeholder="New stamp icons"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Detail (FR)</Label>
              <textarea
                className={cn(textareaClass, "min-h-16")}
                value={form.body_fr}
                onChange={(e) => setForm((f) => ({ ...f, body_fr: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Detail (EN)</Label>
              <textarea
                className={cn(textareaClass, "min-h-16")}
                value={form.body_en}
                onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              disabled={!canSave || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {editingId ? "Save changes" : "Add item"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this item?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title_fr}&rdquo; will be removed from the draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ─── Publish bar ─────────────────────────────────────────────────────

function PublishBar({
  draft,
  itemCount,
  suggestedVersion,
  onPublished,
}: {
  draft: ChangelogRelease;
  itemCount: number;
  suggestedVersion: string;
  onPublished: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(suggestedVersion);

  useEffect(() => setVersion(suggestedVersion), [suggestedVersion]);

  const publishMutation = useMutation({
    mutationFn: () => publishChangelogRelease(draft.id, version.trim()),
    onSuccess: (r) => {
      toast.success(`Published ${r.version} — emails queued`);
      setOpen(false);
      onPublished();
    },
    onError: (e) => toast.error(`Publish failed: ${String(e)}`),
  });

  return (
    <>
      <Button
        disabled={itemCount === 0}
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        <Rocket className="h-4 w-4" /> Publish this week
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish the changelog</AlertDialogTitle>
            <AlertDialogDescription>
              This publishes {itemCount} item{itemCount === 1 ? "" : "s"} to the
              showcase, lights the dashboard badge, and queues the role-targeted
              product-update email. Set the platform version (SemVer).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label>Version</Label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.4.0"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (version.trim()) publishMutation.mutate();
              }}
            >
              {publishMutation.isPending ? "Publishing…" : `Publish ${version}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Published releases list ─────────────────────────────────────────

function PublishedReleases({ releases }: { releases: ChangelogRelease[] }) {
  const published = releases.filter((r) => r.status === "published");
  if (published.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Published releases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {published.map((r) => {
          const count = Array.isArray(r.changelog_items)
            ? (r.changelog_items[0] as unknown as { count?: number })?.count ?? 0
            : 0;
          return (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold">{r.version}</span>
                <span className="text-muted-foreground">
                  {r.title_fr || r.title_en || "Untitled"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{count} items</span>
                <span>
                  {r.published_at
                    ? new Date(r.published_at).toLocaleDateString()
                    : ""}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
