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
  CaretDown,
  CaretRight,
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
import { AreaDot } from "@/components/changelog-area-chip";
import {
  type ChangelogArea,
  type ChangelogCategory,
  type ChangelogItem,
  type ChangelogRelease,
  type ChangelogRole,
  createChangelogItem,
  deleteChangelogItem,
  fetchChangelogDraft,
  fetchChangelogRelease,
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
  admin: "Admins",
  scanner: "Scanners",
};

const ALL_ROLES: ChangelogRole[] = ["owner", "admin", "scanner"];

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:opacity-50";

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminKeys.changelog.all });
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

  const published = (releasesQuery.data ?? []).filter(
    (r) => r.status === "published"
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
          <p className="text-sm text-muted-foreground">
            Author this week&apos;s release, and edit past releases to reword or
            clarify them. Items roll up into one published post on the showcase,
            the dashboard widget, and the product-update email.
          </p>
        </div>
        <PublishBar
          draft={draft}
          itemCount={draft.changelog_items?.length ?? 0}
          suggestedVersion={draftQuery.data?.suggested_version ?? "1.0.0"}
          onPublished={invalidate}
        />
      </div>

      {/* Open draft */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          This week&apos;s draft
        </h2>
        <ReleaseEditor release={draft} areas={areas} onChanged={invalidate} />
      </section>

      {/* Published history — expand to edit */}
      {published.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Published releases
          </h2>
          <div className="space-y-2">
            {published.map((r) => (
              <PublishedReleaseRow
                key={r.id}
                release={r}
                areas={areas}
                onChanged={invalidate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── A collapsible published release that expands into the editor ────

function PublishedReleaseRow({
  release,
  areas,
  onChanged,
}: {
  release: ChangelogRelease;
  areas: ChangelogArea[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const full = useQuery({
    queryKey: adminKeys.changelog.release(release.id),
    queryFn: () => fetchChangelogRelease(release.id),
    enabled: open,
  });
  const count = Array.isArray(release.changelog_items)
    ? (release.changelog_items[0] as unknown as { count?: number })?.count ?? 0
    : 0;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40"
      >
        {open ? (
          <CaretDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="font-mono text-sm font-semibold">{release.version}</span>
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {release.title_fr || release.title_en || "Untitled"}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {count} items
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {release.published_at
            ? new Date(release.published_at).toLocaleDateString()
            : ""}
        </span>
      </button>
      {open && (
        <div className="border-t p-4">
          {full.isLoading || !full.data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ReleaseEditor
              release={full.data}
              areas={areas}
              onChanged={() => {
                full.refetch();
                onChanged();
              }}
            />
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Release editor: post fields + items, works for draft or published ───

function ReleaseEditor({
  release,
  areas,
  onChanged,
}: {
  release: ChangelogRelease;
  areas: ChangelogArea[];
  onChanged: () => void;
}) {
  return (
    <div className="space-y-4">
      <PostEditor release={release} onSaved={onChanged} />
      <ItemComposer
        releaseId={release.id}
        releaseItems={release.changelog_items ?? []}
        areas={areas}
        onChanged={onChanged}
      />
    </div>
  );
}

// ─── Post editor (title + article body + hero image) ─────────────────

function PostEditor({
  release,
  onSaved,
}: {
  release: ChangelogRelease;
  onSaved: () => void;
}) {
  const [titleFr, setTitleFr] = useState(release.title_fr ?? "");
  const [titleEn, setTitleEn] = useState(release.title_en ?? "");
  const [bodyFr, setBodyFr] = useState(release.body_fr ?? "");
  const [bodyEn, setBodyEn] = useState(release.body_en ?? "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitleFr(release.title_fr ?? "");
    setTitleEn(release.title_en ?? "");
    setBodyFr(release.body_fr ?? "");
    setBodyEn(release.body_en ?? "");
  }, [release.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateChangelogRelease>[1]) =>
      updateChangelogRelease(release.id, payload),
    onSuccess: onSaved,
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
      await updateChangelogRelease(release.id, { image_url: url });
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
          Headline, article body (Markdown), and hero image. English falls back
          to French when empty. Changes save when you click away.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Title (FR)</Label>
            <Input
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              onBlur={() => saveField("title_fr", titleFr, release.title_fr)}
              placeholder="Une grosse semaine pour vos cartes"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Title (EN)</Label>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              onBlur={() => saveField("title_en", titleEn, release.title_en)}
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
              onBlur={() => saveField("body_fr", bodyFr, release.body_fr)}
              placeholder="Racontez la nouveauté principale…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Article body (EN) — Markdown</Label>
            <textarea
              className={cn(textareaClass, "min-h-28")}
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              onBlur={() => saveField("body_en", bodyEn, release.body_en)}
              placeholder="Tell the story of the headline feature…"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Hero image (optional)</Label>
          {release.image_url ? (
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={release.image_url}
                alt="Hero preview"
                className="h-28 w-48 rounded-lg border object-cover"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveMutation.mutate({ image_url: null })}
              >
                <Trash className="h-4 w-4" /> Remove
              </Button>
            </div>
          ) : (
            <label className="flex h-28 w-48 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50">
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">
                {uploading ? "Uploading…" : "Upload image"}
              </span>
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
  releaseId,
  releaseItems,
  areas,
  onChanged,
}: {
  releaseId: string;
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
      return createChangelogItem(releaseId, payload);
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
      const next = has
        ? f.affects.filter((r) => r !== role)
        : [...f.affects, role];
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
          Owners, admins, and scanners only receive the items that concern them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
                      {area && <AreaDot area={area} />}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(item)}
                    >
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
              <div className="flex h-9 flex-wrap items-center gap-x-3 gap-y-1">
                {ALL_ROLES.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-1.5 text-sm"
                  >
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, title_fr: e.target.value }))
                }
                placeholder="Nouvelles icônes de tampon"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Title (EN)</Label>
              <Input
                value={form.title_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title_en: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, body_fr: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Detail (EN)</Label>
              <textarea
                className={cn(textareaClass, "min-h-16")}
                value={form.body_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body_en: e.target.value }))
                }
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
              &ldquo;{deleting?.title_fr}&rdquo; will be removed from this
              release.
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

// ─── Publish bar (draft only) ────────────────────────────────────────

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
