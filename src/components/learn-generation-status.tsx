"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/format-duration";

function jobStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "running":
      return "Generating";
    case "succeeded":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function JobBadge({ status }: { status: string }) {
  if (status === "pending" || status === "running") {
    return (
      <Badge variant="secondary">
        <Loader2 className="size-3 animate-spin" />
        {jobStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{jobStatusLabel(status)}</Badge>;
}

export function LearnGenerationStatus({
  status,
  error,
  isLoading,
  startedAt,
  onRetry,
}: {
  status: string;
  error: string | null;
  isLoading: boolean;
  startedAt: string | null;
  onRetry: () => void;
}) {
  const active = status === "pending" || status === "running";
  const [now, setNow] = useState(() => Date.now());

  // Only tick while a job is in flight; the interval lives here so the rest of
  // the page doesn't re-render every second.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const elapsed = active && startedAt ? formatDuration(now - new Date(startedAt).getTime()) : null;

  const message = isLoading
    ? "Starting…"
    : status === "failed"
      ? error ?? "Generation failed"
      : status === "succeeded"
        ? "Ready"
        : "Building your course…";

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <JobBadge status={status} />
            <span className="text-muted-foreground">{message}</span>
          </div>
          {status === "failed" && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>

        {active && (
          <>
            <div
              role="progressbar"
              aria-valuetext="Course generation in progress"
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-gradient" />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Usually takes 10–15 minutes — you can leave this page and come back.</span>
              {elapsed && <span className="tabular-nums">{elapsed}</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
