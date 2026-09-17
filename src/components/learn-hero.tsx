"use client";
import { useRef } from "react";
import { ArrowRight, Loader2, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const EXAMPLE_TOPICS = [
  "Linear algebra for ML",
  "React hooks in depth",
  "SQL joins",
  "Bayesian statistics",
  "Rust ownership",
  "System design basics",
];

export function LearnHero({
  topic,
  onTopicChange,
  onSubmit,
  busy,
  isPending,
  isError,
  children,
}: {
  topic: string;
  onTopicChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  isPending: boolean;
  isError: boolean;
  children?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand">
          <NotebookPen className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Learn something new</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          Give us a topic — we&apos;ll build a full course for you.
        </p>
      </div>

      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="space-y-2"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Sparkles
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <Input
                  ref={inputRef}
                  aria-label="Topic to learn"
                  placeholder="What do you want to learn?"
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value)}
                  disabled={busy}
                  autoFocus
                  className="h-12 rounded-xl pl-10 text-base"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-5 text-base"
                disabled={busy || !topic.trim()}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                Generate
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Press Enter to start. Courses usually take 10–15 minutes to build.
            </p>
          </form>

          {isError && (
            <p className="text-center text-sm text-destructive">Failed to start course generation. Please try again.</p>
          )}

          {children}

          <div className="space-y-2 text-center">
            <p className="text-xs font-medium text-muted-foreground">Try one of these</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_TOPICS.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onTopicChange(example);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
