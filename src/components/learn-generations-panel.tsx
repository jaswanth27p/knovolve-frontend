"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseMonogram } from "@/components/course-card";
import { formatDuration } from "@/lib/format-duration";
import type { MyCourseJob } from "@/lib/api";

export function jobStatusLabel(status: string): string {
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

function elapsed(startMs: number | null, now: number): string | null {
  if (startMs === null) return null;
  return formatDuration(now - startMs);
}

function TrackedRow({
  topic,
  status,
  error,
  startedAtMs,
  now,
  onRetry,
}: {
  topic: string;
  status: string;
  error: string | null;
  startedAtMs: number | null;
  now: number;
  onRetry: () => void;
}) {
  const active = status === "pending" || status === "running";
  const label = elapsed(startedAtMs, now);
  const message =
    status === "failed"
      ? error ?? "Generation failed"
      : status === "succeeded"
        ? "Ready — opening your course…"
        : "Building your course…";

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <CourseMonogram topic={topic} className="size-9 text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{topic}</p>
            <JobBadge status={status} />
          </div>

          {active && (
            <div
              role="progressbar"
              aria-valuetext="Course generation in progress"
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="animate-indeterminate h-full w-1/3 rounded-full bg-brand-gradient" />
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{message}</span>
            {active && label && <span className="shrink-0 tabular-nums">{label}</span>}
          </div>

          {active && (
            <p className="mt-1 text-xs text-muted-foreground">
              Usually takes 10–15 minutes — you can leave this page and come back.
            </p>
          )}

          {status === "failed" && (
            <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactRow({ job, now, onTrack }: { job: MyCourseJob; now: number; onTrack: () => void }) {
  const label = elapsed(new Date(job.created_at).getTime(), now);
  return (
    <button
      type="button"
      onClick={onTrack}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <CourseMonogram topic={job.topic_raw} className="size-9 text-base" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{job.topic_raw}</span>
      {label && <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{label}</span>}
      <JobBadge status={job.status} />
    </button>
  );
}

export function LearnGenerationsPanel({
  jobs,
  trackedJobId,
  trackedTopic,
  trackedStatus,
  trackedError,
  trackedStartAtMs,
  pendingTopic,
  onTrack,
  onRetry,
}: {
  jobs: MyCourseJob[];
  trackedJobId: number | null;
  trackedTopic: string | null;
  trackedStatus: string | null;
  trackedError: string | null;
  trackedStartAtMs: number | null;
  pendingTopic: string | null;
  onTrack: (jobId: number) => void;
  onRetry: () => void;
}) {
  const activeJobs = jobs.filter(
    (job) => job.id !== trackedJobId && (job.status === "pending" || job.status === "running")
  );
  const hasTracked = trackedJobId !== null;
  const trackedActive = trackedStatus === "pending" || trackedStatus === "running";
  const anyActive = pendingTopic !== null || activeJobs.length > 0 || (hasTracked && trackedActive);
  const count = activeJobs.length + (hasTracked ? 1 : 0) + (pendingTopic !== null ? 1 : 0);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!anyActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [anyActive]);

  if (count === 0) return null;

  const trackedTopicResolved =
    trackedTopic ??
    (trackedJobId !== null ? jobs.find((job) => job.id === trackedJobId)?.topic_raw ?? null : null) ??
    "Your course";
  const trackedStartedAt =
    trackedStartAtMs ??
    (trackedJobId !== null
      ? (() => {
          const iso = jobs.find((job) => job.id === trackedJobId)?.created_at;
          return iso ? new Date(iso).getTime() : null;
        })()
      : null);

  const rows: React.ReactNode[] = [];
  if (pendingTopic !== null) {
    rows.push(
      <div key="pending" className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-brand ring-1 ring-brand/20">
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{pendingTopic}</span>
        <Badge variant="secondary">
          <Loader2 className="size-3 animate-spin" />
          Starting
        </Badge>
      </div>
    );
  }
  if (hasTracked) {
    rows.push(
      <TrackedRow
        key={`tracked-${trackedJobId}`}
        topic={trackedTopicResolved}
        status={trackedStatus ?? "pending"}
        error={trackedError}
        startedAtMs={trackedStartedAt}
        now={now}
        onRetry={onRetry}
      />
    );
  }
  for (const job of activeJobs) {
    rows.push(<CompactRow key={job.id} job={job} now={now} onTrack={() => onTrack(job.id)} />);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Generations in progress</h2>
        <span className="text-xs tabular-nums text-muted-foreground">{count} active</span>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {rows}
      </div>
    </section>
  );
}
