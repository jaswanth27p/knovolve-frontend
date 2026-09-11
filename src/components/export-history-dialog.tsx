"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, History, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, parseExportApiError, type ExportJobStatus } from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";

function jobLabel(job: ExportJobStatus): string {
  switch (job.kind) {
    case "course":
      return "Export course";
    case "assignments":
      return "Export assignments";
    case "full_course":
      return "Full course";
    case "full_assignments":
      return "Full assignments";
    case "custom":
      return "Custom request";
  }
}

function jobBadge(job: ExportJobStatus) {
  if (job.status === "succeeded") return <Badge variant="secondary">Ready</Badge>;
  if (job.status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (job.status === "running") return <Badge variant="outline">Generating</Badge>;
  return <Badge variant="outline">Queued</Badge>;
}

export function ExportHistoryDialog({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setDownloadingId(null);
  }

  const jobsQuery = useQuery({
    queryKey: ["export-jobs", slug],
    queryFn: () => api.listExports(slug),
    enabled: open,
    refetchInterval: (query) => {
      const active = query.state.data?.some((job) => job.status === "pending" || job.status === "running");
      return active ? 3000 : false;
    },
  });
  const jobs = jobsQuery.data ?? [];

  const retryMutation = useMutation({
    mutationFn: (job: ExportJobStatus) => api.createExport(slug, job.kind),
    onSuccess: (created) => {
      notifyCourseStatusChanged(queryClient, slug);
      toast.success(`${jobLabel(created)} queued again.`);
    },
    onError: (error) => {
      toast.error(parseExportApiError(error).message);
    },
  });

  async function download(job: ExportJobStatus) {
    setDownloadingId(job.id);
    try {
      await api.downloadExport(slug, job.id, `${slug}-${job.kind}-${job.id}.pdf`);
      toast.success("PDF downloaded.");
    } catch (error) {
      toast.error(parseExportApiError(error).message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline"><History className="size-4" />My Exports</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My exports for this course</DialogTitle>
          <DialogDescription>Only PDFs you requested for this course are listed here.</DialogDescription>
        </DialogHeader>
        {jobsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading your exports…</p>}
        {jobsQuery.isError && <p className="text-sm text-red-600">Failed to load exports.</p>}
        {!jobsQuery.isLoading && jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No exports yet. Use Export to create your first PDF.</p>
        )}
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-black/10 p-3 dark:border-white/10"
            >
              <div>
                <p className="text-sm font-medium">{jobLabel(job)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(job.created_at).toLocaleString()}
                  {job.result_size ? ` · ${Math.round(job.result_size / 1024)} KB` : ""}
                </p>
                {job.status === "failed" && (
                  <p className="mt-1 text-xs text-red-600">{job.error ?? "PDF export failed. Please try again."}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {jobBadge(job)}
                {job.status === "succeeded" && (
                  <Button
                    size="sm"
                    disabled={downloadingId === job.id}
                    onClick={() => download(job)}
                  >
                    {downloadingId === job.id
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Download className="size-4" />}
                    Download
                  </Button>
                )}
                {job.status === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(job)}
                  >
                    <RefreshCw className="size-4" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
