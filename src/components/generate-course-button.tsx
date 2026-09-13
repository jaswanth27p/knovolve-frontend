"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, parseExportApiError } from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";
import { GENERATE_COURSE_EVENT } from "@/components/export-dialog";

export function GenerateCourseButton({ slug }: { slug: string }) {
  const queryClient = useQueryClient();

  const readinessQuery = useQuery({
    queryKey: ["readiness", slug],
    queryFn: () => api.getCourseReadiness(slug),
  });
  const runQuery = useQuery({
    queryKey: ["generation-run", slug],
    queryFn: () => api.getGenerationRun(slug),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 3000 : false;
    },
  });

  const requestGeneration = useCallback(async () => {
    const run = await api.queueCourseGeneration(slug);
    notifyCourseStatusChanged(queryClient, slug);
    if (run.action === "already_complete") {
      toast.success("This course is already fully generated.");
    } else if (run.action === "already_running") {
      toast.success("Course generation is already running.");
    } else {
      toast.success("Generation tasks queued. Missing chapters, assignments, and diagrams will be completed in order.");
    }
  }, [queryClient, slug]);

  const generateMutation = useMutation({
    mutationFn: requestGeneration,
    onError: (error) => {
      toast.error(parseExportApiError(error).message);
    },
  });
  const { mutate: generateCourse } = generateMutation;

  useEffect(() => {
    const handler = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === slug) {
        generateCourse();
      }
    };
    window.addEventListener(GENERATE_COURSE_EVENT, handler);
    return () => window.removeEventListener(GENERATE_COURSE_EVENT, handler);
  }, [generateCourse, slug]);

  const runStatus = runQuery.data?.status;
  const previousRunStatus = useRef(runStatus);
  useEffect(() => {
    const previous = previousRunStatus.current;
    previousRunStatus.current = runStatus;
    const wasActive = previous === "pending" || previous === "running";
    const isTerminal = runStatus === "succeeded" || runStatus === "failed";
    if (wasActive && isTerminal) {
      notifyCourseStatusChanged(queryClient, slug);
    }
  }, [runStatus, queryClient, slug]);

  const run = runQuery.data;
  const active = run?.status === "pending" || run?.status === "running";
  const complete = readinessQuery.data?.status === "complete" && !active;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="h-auto min-h-8 max-w-full whitespace-normal text-center"
        disabled={generateMutation.isPending || active}
        onClick={() => generateMutation.mutate()}
      >
        {generateMutation.isPending || active ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {active && run
          ? `Generating full course · ${run.completed_units}/${run.total_units}`
          : "Generate full course"}
      </Button>
      {complete && (
        <Badge variant="secondary">
          <CheckCircle2 className="size-3" />
          Fully generated
        </Badge>
      )}
      {run?.status === "failed" && (
        <span className="text-xs text-red-600">{run.error ?? "Course generation failed. Please try again."}</span>
      )}
    </div>
  );
}
