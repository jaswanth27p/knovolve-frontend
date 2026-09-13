"use client";
import { useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learn something new</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          Give us a topic — we&apos;ll build a full course for you.
        </p>
      </div>

      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              aria-label="Topic to learn"
              placeholder="e.g. Linear algebra for ML"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              disabled={busy}
              autoFocus
            />
            <Button type="submit" disabled={busy || !topic.trim()}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Start"}
            </Button>
          </form>

          {isError && (
            <p className="text-sm text-destructive">Failed to start course generation. Please try again.</p>
          )}

          {children}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Try one of these</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_TOPICS.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    onTopicChange(example);
                    inputRef.current?.focus();
                  }}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
