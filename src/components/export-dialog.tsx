"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Files, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, parseExportApiError, type ExportJobStatus, type ExportKind } from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";
import { CustomExportPanel } from "@/components/custom-export-panel";

export const GENERATE_COURSE_EVENT = "knovolve:generate-course";

const STANDARD_OPTIONS: Array<{ kind: ExportKind; title: string; description: string }> = [
  {
    kind: "course",
    title: "Export course",
    description: "Global chapters and content only. No personalized versions.",
  },
  {
    kind: "assignments",
    title: "Export assignments",
    description: "Global chapter and module assignments, with answer key.",
  },
  {
    kind: "full_course",
    title: "Full course",
    description: "Global content plus your Additional Chapters and personalized versions.",
  },
  {
    kind: "full_assignments",
    title: "Full assignments",
    description: "Global and personalized assignments, with answer key.",
  },
];

function optionLabel(kind: ExportKind): string {
  if (kind === "custom") return "Custom request";
  return STANDARD_OPTIONS.find((option) => option.kind === kind)?.title ?? "Export";
}

export function ExportDialog({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExportKind>("course");
  const [queuedId, setQueuedId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelected("course");
      setQueuedId(null);
      setDownloading(false);
    }
  }

  const activeJob = useQuery({
    queryKey: ["export-job", slug, queuedId],
    queryFn: () => api.getExport(slug, queuedId as number),
    enabled: open && queuedId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 3000 : false;
    },
  });
  const job: ExportJobStatus | undefined = activeJob.data;

  const createMutation = useMutation({
    mutationFn: (kind: ExportKind) => api.createExport(slug, kind),
    onSuccess: (created) => {
      setQueuedId(created.id);
      notifyCourseStatusChanged(queryClient, slug);
      toast.success(`${optionLabel(created.kind)} queued. We’ll prepare your PDF.`);
    },
    onError: (error) => {
      const parsed = parseExportApiError(error);
      if (parsed.status === 409) {
        toast.error(parsed.message, {
          action: {
            label: "Generate full course",
            onClick: () => {
              window.dispatchEvent(new CustomEvent(GENERATE_COURSE_EVENT, { detail: slug }));
            },
          },
        });
      } else {
        toast.error(parsed.message);
      }
    },
  });

  async function downloadActiveJob() {
    if (!job || job.status !== "succeeded") return;
    setDownloading(true);
    try {
      await api.downloadExport(slug, job.id, `${slug}-${job.kind}-${job.id}.pdf`);
      notifyCourseStatusChanged(queryClient, slug);
      toast.success("PDF downloaded.");
    } catch (error) {
      toast.error(parseExportApiError(error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline">Export</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export this course as PDF</DialogTitle>
          <DialogDescription>
            Standard exports are generated asynchronously. You can close this dialog and track them under My Exports.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {STANDARD_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              onClick={() => setSelected(option.kind)}
              className={`rounded-md border p-3 text-left transition ${
                selected === option.kind
                  ? "border-zinc-900 dark:border-zinc-100"
                  : "border-black/10 dark:border-white/10"
              }`}
              aria-pressed={selected === option.kind}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {option.kind === "course" || option.kind === "full_course" ? <FileText className="size-4" /> : <Files className="size-4" />}
                {option.title}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate(selected)}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Generate PDF
          </Button>
        </div>
        <CustomExportPanel
          slug={slug}
          onQueued={(job) => {
            setQueuedId(job.id);
            notifyCourseStatusChanged(queryClient, slug);
          }}
        />
        {job && (
          <div className="rounded-md border border-black/10 p-3 text-sm dark:border-white/10">
            <p className="font-medium">{optionLabel(job.kind)}: {job.status}</p>
            {job.status === "failed" && (
              <p className="mt-1 text-red-600">{job.error ?? "PDF export failed. Please try again."}</p>
            )}
            {job.status === "succeeded" && (
              <Button className="mt-2" disabled={downloading} onClick={downloadActiveJob}>
                {downloading && <Loader2 className="size-4 animate-spin" />}
                Download PDF
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
