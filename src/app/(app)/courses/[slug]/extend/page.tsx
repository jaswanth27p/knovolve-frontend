"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ExtensionChapter, ExtensionJobStatus } from "@/lib/api";

export default function CourseExtendPage() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExtensionChapter | null>(null);

  const chaptersQuery = useQuery({
    queryKey: ["course-extension-chapters", params.slug],
    queryFn: () => api.getCourseExtensionChapters(params.slug),
  });

  const jobQuery = useQuery({
    queryKey: ["course-extension-job", params.slug, jobId],
    queryFn: () => api.getCourseExtensionJob(params.slug, jobId as number),
    enabled: jobId != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "succeeded" || status === "failed" ? false : 1500;
    },
  });

  // TanStack Query v5 has no onSuccess on useQuery: poll completion is
  // handled here instead (clear jobId + refresh chapters on terminal status).
  useEffect(() => {
    const status = jobQuery.data?.status;
    if ((status === "succeeded" || status === "failed") && jobId != null) {
      queryClient.invalidateQueries({ queryKey: ["course-extension-chapters", params.slug] });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJobId(null);
    }
  }, [jobQuery.data?.status, jobId, params.slug, queryClient]);

  const createMutation = useMutation({
    mutationFn: () => api.createCourseExtension(params.slug, message),
    onSuccess: (data: ExtensionJobStatus) => {
      if (data.job_id != null) setJobId(data.job_id);
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

  const running = createMutation.isPending || (jobQuery.status === "success" && jobId != null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Link href={`/courses/${params.slug}`} className="flex w-fit items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400">
        <ArrowLeft className="size-4" /> Back to course
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Extend this course</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ask for chapters covering concepts this course doesn&apos;t teach. They&apos;re added under &quot;Additional Chapters&quot;.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. add a chapter on TCP three-way handshake and another on DNS resolution"
          rows={4}
          className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
        />
        <Button onClick={() => createMutation.mutate()} disabled={running || !message.trim()}>
          {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Generate chapters
        </Button>
        {createMutation.isError && <p className="text-sm text-red-600">Failed to start generation.</p>}
        {running && <p className="text-sm text-zinc-500">Generating… new chapters will appear here when done.</p>}
        {jobQuery.isError && <p className="text-sm text-red-600">Failed to load job status.</p>}
        {jobQuery.data?.status === "failed" && (
          <p className="text-sm text-red-600">{jobQuery.data.error ?? "Extension failed."}</p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your added chapters</h2>
        {!chaptersQuery.data?.length && <p className="text-sm text-zinc-500">No chapters added yet.</p>}
        {chaptersQuery.data?.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-md border border-black/10 p-3 dark:border-white/10">
            <div>
              <p className="text-sm font-medium">{c.title}</p>
              <p className="text-xs text-zinc-500">{c.objective}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/courses/${params.slug}/chapters/${c.id}`} className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
                Open
              </Link>
              <button onClick={() => setDeleteTarget(c)} aria-label="Delete chapter" title="Delete chapter">
                <Trash2 className="size-4 text-zinc-400 hover:text-red-600" />
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
