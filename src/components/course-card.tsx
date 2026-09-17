"use client";

import Link from "next/link";
import { BookOpen, CircleCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { formatRelativeTime } from "@/lib/relative-time";

export function CourseMonogram({ topic, className }: { topic: string; className?: string }) {
  const letter = topic.trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-lg font-medium text-brand ring-1 ring-brand/20",
        className
      )}
    >
      {letter || <BookOpen className="size-4" strokeWidth={1.75} />}
    </span>
  );
}

export interface CourseCardProps {
  topicSlug: string;
  topicRaw: string;
  moduleCount: number;
  chapterCount: number;
  /** "mine" adds status + progress; "public" stays compact. */
  variant?: "mine" | "public";
  status?: "in_progress" | "completed";
  progress?: number;
  weakConceptCount?: number;
  strongConceptCount?: number;
  timestamp?: string | null;
  /** Word shown before relative time, e.g. "Opened" / "Added". */
  timestampVerb?: string;
  href?: string;
  onRemove?: () => void;
  isRemoving?: boolean;
  removeError?: string | null;
  className?: string;
}

export function CourseCard({
  topicSlug,
  topicRaw,
  moduleCount,
  chapterCount,
  variant = "public",
  status,
  progress = 0,
  weakConceptCount = 0,
  strongConceptCount = 0,
  timestamp,
  timestampVerb = "Added",
  href = `/courses/${topicSlug}`,
  onRemove,
  isRemoving = false,
  removeError = null,
  className,
}: CourseCardProps) {
  const relative = formatRelativeTime(timestamp);
  const pct = Math.round(progress * 100);
  const showConcepts = weakConceptCount > 0 || strongConceptCount > 0;

  return (
    <Card
      className={cn(
        "spotlight-border relative transition-all hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-sm",
        className
      )}
    >
      <Link href={href} className="absolute inset-0 z-10 rounded-xl" aria-label={topicRaw} />
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <CourseMonogram topic={topicRaw} className="mt-0.5" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-medium">{topicRaw}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{moduleCount} modules</span>
                  <span aria-hidden>·</span>
                  <span>{chapterCount} chapters</span>
                  {relative && (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        {timestampVerb} {relative}
                      </span>
                    </>
                  )}
                </p>
              </div>
              {variant === "mine" && status && (
                <Badge variant={status === "completed" ? "secondary" : "default"}>
                  {status === "completed" && <CircleCheck className="size-3" />}
                  {status === "completed" ? "Completed" : "In progress"}
                </Badge>
              )}
            </div>

            {variant === "mine" && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-gradient transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
              </div>
            )}

            {variant === "mine" && (showConcepts || onRemove) && (
              <div className="flex min-h-7 items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex gap-3">
                  {strongConceptCount > 0 && <span>{strongConceptCount} strong</span>}
                  {weakConceptCount > 0 && <span>{weakConceptCount} weak</span>}
                </div>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-1.5 relative z-20 text-muted-foreground"
                    disabled={isRemoving}
                    onClick={onRemove}
                  >
                    {isRemoving ? "Removing…" : "Remove"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {removeError && (
        <p className="relative z-20 px-(--card-spacing) pb-1 text-sm text-destructive">
          Failed to remove course: {removeError}
        </p>
      )}
    </Card>
  );
}
