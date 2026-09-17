"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ExtensionChapter } from "@/lib/api";

const EXTENSION_STATUS_LABEL: Record<string, string> = {
  pending: "Queued",
  running: "Running",
  succeeded: "Done",
  failed: "Failed",
};

function ExtensionStatusBadge({ status }: { status: string }) {
  const label = EXTENSION_STATUS_LABEL[status] ?? status;
  if (status === "pending" || status === "running") {
    return (
      <Badge variant="secondary">
        <Loader2 className="size-3 animate-spin" />
        {label}
      </Badge>
    );
  }
  if (status === "failed") return <Badge variant="destructive">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

export default function CourseExtendPage() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ExtensionChapter | null>(null);

  const chaptersQuery = useQuery({
    queryKey: ["course-extension-chapters", params.slug],
    queryFn: () => api.getCourseExtensionChapters(params.slug),
  });

  // Derive the in-flight state from the DB-backed job list rather than a
  // component-local id, so returning to this page (or logging out and back in)
  // re-attaches to a still-running extension instead of losing the loading
  // state or hitting a 409 on re-submit.
  const jobsQuery = useQuery({
    queryKey: ["course-extension-jobs", params.slug],
    queryFn: () => api.listCourseExtensionJobs(params.slug),
    refetchInterval: (query) =>
      (query.state.data ?? []).some((j) => j.status === "pending" || j.status === "running") ? 1500 : false,
  });
  const jobs = jobsQuery.data ?? [];
  const activeJob = jobs.find((j) => j.status === "pending" || j.status === "running") ?? null;
  const lastJob = jobs[0] ?? null;

  // TanStack Query v5 has no onSuccess on useQuery: refresh the chapter list
  // whenever the most recent job reaches a successful terminal state.
  useEffect(() => {
    if (lastJob?.status === "succeeded") {
      queryClient.invalidateQueries({ queryKey: ["course-extension-chapters", params.slug] });
    }
  }, [lastJob?.status, params.slug, queryClient]);

  const createMutation = useMutation({
    mutationFn: () => api.createCourseExtension(params.slug, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-extension-jobs", params.slug] });
      setMessage("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (chapterId: number) => api.deleteCourseExtensionChapter(params.slug, chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-extension-chapters", params.slug] });
      setDeleteTarget(null);
    },
  });

  const running = createMutation.isPending || activeJob !== null;
  const conflict = createMutation.isError && createMutation.error instanceof Error
    && createMutation.error.message.startsWith("409");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Link href={`/courses/${params.slug}`} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:underline dark:text-muted-foreground">
        <ArrowLeft className="size-4" /> Back to course
      </Link>

      <div className="space-y-1">
        <h1 className="font-display text-3xl font-medium tracking-tight">Extend this course</h1>
        <p className="text-sm text-muted-foreground">
          Ask for chapters covering concepts this course doesn&apos;t teach. They&apos;re added under &quot;Additional Chapters&quot;.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. add a chapter on TCP three-way handshake and another on DNS resolution"
          rows={4}
          className="focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button onClick={() => createMutation.mutate()} disabled={running || !message.trim()}>
          {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Generate chapters
        </Button>
        {conflict && (
          <p className="text-sm text-destructive">An extension is already running for this course.</p>
        )}
        {createMutation.isError && !conflict && (
          <p className="text-sm text-destructive">Failed to start generation.</p>
        )}
        {jobsQuery.isError && <p className="text-sm text-destructive">Failed to load job status.</p>}
        {!activeJob && lastJob?.status === "failed" && (
          <p className="text-sm text-destructive">{lastJob.error ?? "Extension failed."}</p>
        )}
        {!activeJob && lastJob?.status === "succeeded" && lastJob.added?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No new chapters were needed — that topic looks like it&apos;s already covered in this course.
          </p>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display text-xl font-medium">Extension requests</h2>
          <p className="text-sm text-muted-foreground">
            {activeJob
              ? "Still running — you can leave this page. It keeps going and re-attaches when you return."
              : "Your recent requests for this course."}
          </p>
          <div className="space-y-2">
            {jobs.map((j, i) => (
              <div
                key={j.job_id ?? i}
                className="flex items-start justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{j.request ?? "Extension request"}</p>
                  <p className="text-xs text-muted-foreground">
                    {j.created_at ? new Date(j.created_at).toLocaleString() : ""}
                    {j.status === "succeeded" && j.added
                      ? ` · ${j.added.length} chapter${j.added.length === 1 ? "" : "s"} added`
                      : ""}
                    {j.status === "failed" && j.error ? ` · ${j.error}` : ""}
                  </p>
                </div>
                <ExtensionStatusBadge status={j.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-display text-xl font-medium">Your added chapters</h2>
        {!chaptersQuery.data?.length && <p className="text-sm text-muted-foreground">No chapters added yet.</p>}
        {chaptersQuery.data?.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl bg-card p-3 ring-1 ring-foreground/10">
            <div>
              <p className="text-sm font-medium">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.objective}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/courses/${params.slug}/chapters/${c.id}`} className="text-sm text-muted-foreground hover:underline dark:text-muted-foreground">
                Open
              </Link>
              <button onClick={() => setDeleteTarget(c)} aria-label="Delete chapter" title="Delete chapter">
                <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chapter?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `“${deleteTarget.title}” and any content, assignments, attempts, and versions under it will be permanently deleted. This can’t be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete chapter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
