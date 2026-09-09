"use client";
import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export function FloatingChatbot() {
  const params = useParams<{ slug?: string; chapterId?: string }>();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  const send = useMutation({
    mutationFn: (message: string) =>
      api.sendChatMessage(params.slug ?? null, params.chapterId ? Number(params.chapterId) : null, message),
    onSuccess: (result, message) => {
      setTurns((prev) => [...prev, { role: "user", text: message }, { role: "assistant", text: result.reply }]);
      setInput("");
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg" size="lg">
            Ask
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Ask about your progress</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {turns.map((t, i) => (
            <p key={i} className={t.role === "user" ? "text-right text-sm" : "text-sm text-zinc-600 dark:text-zinc-400"}>
              {t.text}
            </p>
          ))}
        </div>
        <form
          className="flex gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) send.mutate(input);
          }}
        >
          <input
            className="flex-1 rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${pathname.includes("/courses/") ? "this course" : "your progress"}…`}
          />
          <Button type="submit" disabled={send.isPending}>Send</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
