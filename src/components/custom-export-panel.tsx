"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  api,
  parseExportApiError,
  type ClarifyChatTurn,
  type ClarifyPlan,
  type ExportJobStatus,
} from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";

export function formatAssistantReply(reply: string, questions: string[]): string {
  if (questions.length === 0) return reply;
  const bulleted = questions.map((question) => `- ${question}`).join("\n");
  return reply ? `${reply}\n${bulleted}` : bulleted;
}

export function buildCustomBrief(initialRequest: string, turns: ClarifyChatTurn[]): string {
  const lines = [`Initial request: ${initialRequest.trim()}`];
  for (const turn of turns) {
    const content = turn.content.trim();
    if (!content) continue;
    lines.push(`${turn.role === "user" ? "Learner" : "Assistant"}: ${content}`);
  }
  return lines.join("\n");
}

const OUTPUT_KINDS: ClarifyPlan["output_kind"][] = ["summary", "qa", "cheat_sheet", "custom"];
const LENGTHS: ClarifyPlan["length"][] = ["short", "medium", "long"];

const fieldClassName =
  "mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CustomExportPanel({
  slug,
  onQueued,
}: {
  slug: string;
  onQueued: (job: ExportJobStatus) => void;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ClarifyChatTurn[]>([]);
  const [initialRequest, setInitialRequest] = useState("");
  const [plan, setPlan] = useState<ClarifyPlan | null>(null);
  const [draft, setDraft] = useState<ClarifyPlan | null>(null);
  const [sending, setSending] = useState(false);
  // The finalized plan becomes the primary action once it arrives, so surface
  // it the moment it renders instead of leaving the user to scroll for it.
  const planRef = useRef<HTMLDivElement>(null);
  const [highlightPlan, setHighlightPlan] = useState(false);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Called from the send handler (not an effect) right after a plan lands —
  // scrolls the freshly rendered panel into view and pulses a brand ring.
  function revealPlan() {
    setHighlightPlan(true);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightPlan(false), 2200);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        planRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      )
    );
  }

  const clarifyMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ClarifyChatTurn[] }) =>
      api.clarifyExport(slug, message, history),
  });
  const generateMutation = useMutation({
    mutationFn: () => {
      if (!initialRequest.trim() || !draft) {
        throw new Error("Finalize the custom request before generating the PDF.");
      }
      if (draft.item_count !== null && (!Number.isInteger(draft.item_count) || draft.item_count < 1)) {
        throw new Error("Item count must be a positive whole number or empty.");
      }
      return api.createExport(slug, "custom", {
        brief: buildCustomBrief(initialRequest, turns),
        plan: draft,
      });
    },
    onSuccess: (job) => {
      onQueued(job);
      notifyCourseStatusChanged(queryClient, slug);
      toast.success("Custom PDF queued. We’ll prepare your document.");
    },
    onError: (error) => {
      toast.error(parseExportApiError(error).message);
    },
  });

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;
    const nextHistory = [...turns, { role: "user", content: message } as ClarifyChatTurn];
    setInput("");
    setTurns([...nextHistory, { role: "assistant", content: "" }]);
    setSending(true);
    if (!initialRequest) setInitialRequest(message);
    try {
      const response = await clarifyMutation.mutateAsync({ message, history: turns });
      const content = formatAssistantReply(response.reply, response.questions);
      setTurns([...nextHistory, { role: "assistant", content }]);
      if (response.type === "plan" && response.plan) {
        setPlan(response.plan);
        setDraft(response.plan);
        revealPlan();
      }
    } catch (error) {
      setTurns(nextHistory);
      toast.error(parseExportApiError(error).message);
    } finally {
      setSending(false);
    }
  }

  function updateDraft(update: Partial<ClarifyPlan>) {
    setDraft((current) => (current ? { ...current, ...update } : current));
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <MessageSquareText className="text-brand size-4" strokeWidth={1.75} />
        Custom request
      </h3>
      <p className="text-sm text-muted-foreground">
        Examples: “Interview questions with answers,” “A short summary,” or “A revision cheat sheet.”
        The assistant may ask how long it should be or how many items you want.
      </p>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-card p-3 ring-1 ring-foreground/10">
        {turns.length === 0 && (
          <p className="text-sm text-muted-foreground">Describe the PDF you want.</p>
        )}
        {turns.map((turn, index) => (
          <p
            key={index}
            className={`text-sm whitespace-pre-line ${turn.role === "user" ? "text-right" : "text-muted-foreground"}`}
          >
            {turn.content || (sending && index === turns.length - 1 ? "Thinking…" : "")}
          </p>
        ))}
      </div>
      {plan && draft && (
        <div
          ref={planRef}
          className={`space-y-2 rounded-lg bg-card p-3 ring-1 transition-shadow ${
            highlightPlan ? "ring-brand/50 shadow-brand" : "ring-foreground/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" strokeWidth={1.75} aria-hidden />
            <p className="text-sm font-medium">Review the finalized request</p>
            <Badge variant="secondary" className="ml-auto">Ready to generate</Badge>
          </div>
          <label className="block text-xs text-muted-foreground">
            Title
            <input
              className={fieldClassName}
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-muted-foreground">
              Format
              <select
                className={fieldClassName}
                value={draft.output_kind}
                onChange={(event) => updateDraft({ output_kind: event.target.value as ClarifyPlan["output_kind"] })}
              >
                {OUTPUT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Length
              <select
                className={fieldClassName}
                value={draft.length}
                onChange={(event) => updateDraft({ length: event.target.value as ClarifyPlan["length"] })}
              >
                {LENGTHS.map((length) => (
                  <option key={length} value={length}>{length}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-muted-foreground">
            Item count, if applicable
            <input
              type="number"
              min={1}
              className={fieldClassName}
              value={draft.item_count ?? ""}
              onChange={(event) =>
                updateDraft({ item_count: event.target.value === "" ? null : Number(event.target.value) })
              }
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Notes
            <textarea
              className={fieldClassName}
              value={draft.notes ?? ""}
              onChange={(event) => updateDraft({ notes: event.target.value || null })}
            />
          </label>
          <Button disabled={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
            {generateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Generate custom PDF
          </Button>
        </div>
      )}
      <form className="flex gap-2" onSubmit={send}>
        <input
          className={`flex-1 ${fieldClassName}`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={plan ? "Want to adjust it? Tell the assistant…" : "Prepare interview questions for this topic…"}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send
        </Button>
      </form>
    </div>
  );
}
