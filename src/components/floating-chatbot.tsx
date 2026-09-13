"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { api, ChatHistoryTurn, ChatRouteContext } from "@/lib/api";

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  // Only ever set on the assistant turn currently receiving tokens; absent
  // once the stream finishes normally.
  status?: "streaming" | "error";
}

export function FloatingChatbot() {
  const params = useParams<{ slug?: string; chapterId?: string }>();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);
  // Cached learner-context bundle from the first turn; resent on later turns
  // because the server is stateless. Cleared on "start a new chat".
  const [contextBundle, setContextBundle] = useState<unknown | null>(null);

  // Scope the assistant to the page the learner is on (chapter content,
  // assignment, course, or dashboard). This is what lets "explain this
  // chapter" work without the learner naming the chapter.
  const route = useMemo<ChatRouteContext>(() => {
    const courseSlug = params.slug ?? null;
    const chapterId = params.chapterId ? Number(params.chapterId) : null;
    let page: ChatRouteContext["page"] = "dashboard";
    if (pathname.includes("/assignment")) page = "assignment";
    else if (chapterId !== null) page = "chapter_content";
    else if (courseSlug) page = "course";
    return { page, course_slug: courseSlug, chapter_id: chapterId };
  }, [params.slug, params.chapterId, pathname]);

  // Guards a still-running stream from writing into state after the user
  // has started a new chat or closed the sheet — abort() alone doesn't stop
  // an update that's already mid-flight when the signal fires.
  const generation = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  function stopStreaming() {
    controllerRef.current?.abort();
    generation.current += 1;
  }

  function startNewChat() {
    stopStreaming();
    setTurns([]);
    setInput("");
    setSending(false);
    setContextBundle(null);
  }

  useEffect(() => {
    if (!open) stopStreaming();
  }, [open]);

  useEffect(() => stopStreaming, []);

  function updateLastAssistantTurn(update: (turn: ChatTurn) => ChatTurn) {
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last || last.role !== "assistant") return prev;
      next[next.length - 1] = update(last);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    // Snapshot prior turns as the history to resend (the server keeps no
    // session state), then render the new user turn instantly.
    const history: ChatHistoryTurn[] = turns.map((t) => ({ role: t.role, content: t.text }));
    // The user's turn renders the instant this handler runs — it never
    // waits on the network — and the assistant slot shows its own loading
    // state until the first streamed token arrives.
    setTurns((prev) => [...prev, { role: "user", text: message }, { role: "assistant", text: "", status: "streaming" }]);
    setSending(true);

    const myGeneration = ++generation.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await api.streamChatMessage(
        route,
        message,
        history,
        contextBundle,
        (event) => {
          if (generation.current !== myGeneration) return;
          if (event.type === "context") {
            setContextBundle(event.bundle);
          } else if (event.type === "token") {
            updateLastAssistantTurn((turn) => ({ ...turn, text: turn.text + event.text }));
          } else if (event.type === "error") {
            updateLastAssistantTurn(() => ({ role: "assistant", text: event.message, status: "error" }));
          } else if (event.type === "done") {
            updateLastAssistantTurn((turn) => ({ ...turn, status: undefined }));
          }
        },
        controller.signal,
      );
    } catch {
      if (generation.current === myGeneration) {
        updateLastAssistantTurn(() => ({
          role: "assistant", text: "Failed to get a reply. Please try again.", status: "error",
        }));
      }
    } finally {
      if (generation.current === myGeneration) setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
            size="icon"
            aria-label="Open Knovolve AI"
            title="Knovolve AI"
          >
            <MessageCircle />
          </Button>
        }
      />
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="flex-row items-center justify-between gap-2 pr-12">
          <SheetTitle>Knovolve AI</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={startNewChat}
            disabled={turns.length === 0}
            aria-label="Start a new chat"
            title="Start a new chat"
          >
            <SquarePen />
          </Button>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "text-right" : ""}>
              {t.role === "user" ? (
                <p className="inline-block text-sm">{t.text}</p>
              ) : t.status === "error" ? (
                <p className="text-sm text-red-600">{t.text}</p>
              ) : (
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 [&_a]:underline [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.text}</ReactMarkdown>
                  {t.status === "streaming" && t.text === "" && (
                    <span className="inline-flex items-center gap-1 align-middle">
                      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-current" />
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <form className="flex gap-2 p-4" onSubmit={handleSubmit}>
          <input
            className="flex-1 rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${pathname.includes("/courses/") ? "this course" : "your progress"}…`}
          />
          <Button type="submit" disabled={sending || !input.trim()}>Send</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
