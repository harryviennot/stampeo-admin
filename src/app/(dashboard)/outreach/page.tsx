"use client";

import { Suspense, useEffect } from "react";
import { ChatCircleDots } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { SegmentedToggle } from "@/components/segmented-toggle";
import { Badge } from "@/components/ui/badge";
import {
  useOutreachConversationAction,
  useOutreachConversations,
} from "@/hooks/use-outreach";
import type { OutreachConversation } from "@/lib/api";
import { cn } from "@/lib/utils";

import { ControlsPanel } from "./_components/controls-panel";
import { ThreadView } from "./_components/thread-view";

type View = "inbox" | "controls";

const FILTERS = [
  { value: "", label: "All" },
  { value: "replied", label: "Replied" },
  { value: "active", label: "Waiting" },
  { value: "opted_out", label: "Opted out" },
] as const;

export default function OutreachPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <OutreachPageInner />
    </Suspense>
  );
}

function OutreachPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = (searchParams.get("view") as View) ?? "inbox";
  const status = searchParams.get("status") ?? "";
  const selectedId = searchParams.get("c") ?? undefined;

  const { data, isPending, isError, error } = useOutreachConversations(
    status ? { status } : {}
  );
  const markRead = useOutreachConversationAction();

  // Opening a thread clears its unread mark, so the badge means "needs me".
  const selected = data?.conversations.find((c) => c.id === selectedId);
  const selectedUnread = selected?.unread ?? false;
  useEffect(() => {
    if (selectedId && selectedUnread) {
      markRead.mutate({ id: selectedId, action: "read" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedUnread]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/outreach?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChatCircleDots className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-semibold">Outreach</h1>
          {(data?.unread_count ?? 0) > 0 && (
            <Badge>{data!.unread_count} waiting</Badge>
          )}
        </div>
        <SegmentedToggle<View>
          value={view}
          onChange={(v) => setParam("view", v === "inbox" ? "" : v)}
          options={[
            { value: "inbox", label: "Inbox" },
            { value: "controls", label: "Controls" },
          ]}
        />
      </header>

      {view === "controls" ? (
        <ControlsPanel />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border bg-background">
            <div className="border-b p-2">
              <SegmentedToggle<string>
                value={status}
                onChange={(v) => setParam("status", v)}
                options={FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>

            {isPending && (
              <p className="p-4 text-sm text-muted-foreground">
                Loading conversations…
              </p>
            )}
            {isError && (
              <p className="p-4 text-sm text-destructive">
                Could not load conversations: {String(error)}
              </p>
            )}
            {data && data.conversations.length === 0 && (
              <div className="p-6">
                <EmptyState
                  icon={<ChatCircleDots className="h-6 w-6" />}
                  title="No conversations yet"
                  description="They appear here once the daily sweep sends its first message."
                />
              </div>
            )}
            {data && data.conversations.length > 0 && (
              <nav className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2">
                {data.conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    selected={conversation.id === selectedId}
                    onSelect={() => setParam("c", conversation.id)}
                  />
                ))}
              </nav>
            )}
          </aside>

          <section className="rounded-lg border bg-background">
            {selectedId ? (
              <ThreadView conversationId={selectedId} />
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Pick a conversation to read it and reply.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: OutreachConversation;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = conversation.business?.name ?? "Unknown business";
  const when = conversation.last_inbound_at ?? conversation.created_at;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "block w-full rounded-md px-3 py-2 text-left transition-colors",
        selected ? "bg-accent/10" : "hover:bg-muted"
      )}
    >
      <div className="flex items-center gap-2">
        {conversation.unread && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
        )}
        <span
          className={cn(
            "truncate text-sm",
            selected || conversation.unread
              ? "font-medium text-foreground"
              : "text-foreground"
          )}
        >
          {name}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="truncate">{conversation.status}</span>
        <span>·</span>
        <span className="truncate">{conversation.track}</span>
        <span>·</span>
        <span className="shrink-0">
          {new Date(when).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>
    </button>
  );
}
