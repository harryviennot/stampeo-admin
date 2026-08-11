"use client";

import { useState } from "react";
import { ArrowSquareOut, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useOutreachConversationAction,
  useOutreachThread,
  useSendOutreachReply,
} from "@/hooks/use-outreach";
import type { OutreachMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:opacity-50";

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Delivery state, in words rather than ticks nobody can decode at a glance. */
function messageMeta(message: OutreachMessage) {
  const parts: string[] = [formatTime(message.created_at)];
  if (message.channel === "email") parts.push("sent by email");
  if (message.step) parts.push(message.step.toUpperCase());
  if (message.direction === "outbound") parts.push(message.status);
  if (message.error_code) parts.push(`error ${message.error_code}`);
  return parts.join(" · ");
}

export function ThreadView({ conversationId }: { conversationId: string }) {
  const { data, isPending, isError, error } = useOutreachThread(conversationId);
  const reply = useSendOutreachReply();
  const action = useOutreachConversationAction();
  const [draft, setDraft] = useState("");

  if (isPending) {
    return <p className="p-8 text-sm text-muted-foreground">Loading the conversation…</p>;
  }
  if (isError) {
    return (
      <p className="p-8 text-sm text-destructive">
        Could not load the conversation: {String(error)}
      </p>
    );
  }

  const { conversation, messages, business, owner, reply_window: window } = data;
  const windowOpen = window.open;

  function send() {
    const body = draft.trim();
    if (!body) return;
    reply.mutate(
      { id: conversationId, body },
      {
        onSuccess: () => {
          setDraft("");
          toast.success("Reply sent.");
        },
        onError: (e) => toast.error(`Could not send: ${String(e)}`),
      }
    );
  }

  function runAction(
    kind: "close" | "mark-replied" | "mark-opted-out",
    label: string
  ) {
    action.mutate(
      { id: conversationId, action: kind },
      {
        onSuccess: () => toast.success(label),
        onError: (e) => toast.error(`Failed: ${String(e)}`),
      }
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {business.name ?? "Unknown business"}
            </h2>
            <Link
              href={`/businesses?q=${encodeURIComponent(business.name ?? "")}`}
              className="text-muted-foreground hover:text-accent"
              title="Open in Businesses"
            >
              <ArrowSquareOut className="h-4 w-4" />
            </Link>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {owner.name ?? "Owner"} · {conversation.phone_e164 ?? owner.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{conversation.track}</Badge>
          {conversation.variant && (
            <Badge variant="secondary">variant {conversation.variant.toUpperCase()}</Badge>
          )}
          <Badge
            variant={conversation.status === "replied" ? "default" : "outline"}
          >
            {conversation.status}
          </Badge>
        </div>
      </header>

      {/* How far they actually got, which is what makes a good reply possible. */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span>Billing: {business.billing_status ?? "unknown"}</span>
        <span>
          Wizard:{" "}
          {business.wizard_completed
            ? "finished"
            : `stopped at ${business.wizard_last_chapter ?? "the start"}`}
        </span>
        <span>Customers: {business.customer_count ?? 0}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
        )}
        {messages.map((message) => {
          const outbound = message.direction === "outbound";
          return (
            <div
              key={message.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div className={cn("max-w-[80%]", outbound && "text-right")}>
                <div
                  className={cn(
                    "inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    outbound
                      ? "bg-accent/10 text-foreground"
                      : "border bg-background text-foreground"
                  )}
                >
                  {message.body || <em className="text-muted-foreground">(no body recorded)</em>}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {messageMeta(message)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-4 py-3">
        {!windowOpen ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <Warning className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-muted-foreground">
              WhatsApp only allows a free reply for 24 hours after their last
              message, and that window has closed. Email them instead, or wait
              for them to write again.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Reply as Harry…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={reply.isPending}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Goes out from the Stampeo number, in your name.
              </p>
              <Button
                size="sm"
                onClick={send}
                disabled={reply.isPending || !draft.trim()}
              >
                <PaperPlaneTilt className="mr-1.5 h-4 w-4" />
                {reply.isPending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runAction("close", "Conversation closed.")}
            disabled={action.isPending}
          >
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              runAction("mark-replied", "Marked as replied. Automation is off.")
            }
            disabled={action.isPending}
          >
            Mark replied
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              runAction("mark-opted-out", "Recorded. They will not be messaged again.")
            }
            disabled={action.isPending}
          >
            Mark opted out
          </Button>
        </div>
      </div>
    </div>
  );
}
