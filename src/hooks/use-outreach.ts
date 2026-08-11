"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchOutreachAudience,
  fetchOutreachConversations,
  fetchOutreachHealth,
  fetchOutreachThread,
  outreachConversationAction,
  sendOutreachReply,
  setOutreachPaused,
  startOutreachBackfill,
} from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

// The inbox polls: a merchant replying is the one event that needs a human, and
// the email notification is the backstop rather than the primary signal.
const INBOX_REFETCH_MS = 30_000;

export function useOutreachConversations(
  params: { status?: string; track?: string } = {}
) {
  return useQuery({
    queryKey: adminKeys.outreach.conversations(params),
    queryFn: () => fetchOutreachConversations(params),
    placeholderData: keepPreviousData,
    refetchInterval: INBOX_REFETCH_MS,
  });
}

export function useOutreachThread(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.outreach.thread(id ?? ""),
    queryFn: () => fetchOutreachThread(id!),
    enabled: !!id,
    refetchInterval: INBOX_REFETCH_MS,
  });
}

export function useOutreachAudience() {
  return useQuery({
    queryKey: adminKeys.outreach.audience,
    queryFn: fetchOutreachAudience,
  });
}

export function useOutreachHealth() {
  return useQuery({
    queryKey: adminKeys.outreach.health,
    queryFn: fetchOutreachHealth,
  });
}

function invalidateThread(
  qc: ReturnType<typeof useQueryClient>,
  conversationId: string
) {
  qc.invalidateQueries({ queryKey: adminKeys.outreach.all });
  qc.invalidateQueries({ queryKey: adminKeys.outreach.thread(conversationId) });
}

export function useSendOutreachReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      sendOutreachReply(id, body),
    onSuccess: (_, vars) => invalidateThread(qc, vars.id),
  });
}

export function useOutreachConversationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "read" | "close" | "mark-replied" | "mark-opted-out";
    }) => outreachConversationAction(id, action),
    onSuccess: (_, vars) => invalidateThread(qc, vars.id),
  });
}

export function useStartOutreachBackfill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (confirm: string) => startOutreachBackfill(confirm),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.outreach.all }),
  });
}

export function useSetOutreachPaused() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paused, reason }: { paused: boolean; reason?: string }) =>
      setOutreachPaused(paused, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.outreach.all }),
  });
}
