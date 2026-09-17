"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttemptResults } from "@/components/attempt-results";
import { InlineMarkdown } from "@/components/inline-markdown";
import { AssignmentSkeleton } from "@/components/skeletons";
import { api, AssignmentStatus, parseExportApiError, SubmitAnswer } from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";

interface AssignmentRunnerProps {
  slug: string;
  assignmentId: number | null;
  // Distinguishes the React Query cache entry when the same chapter/module
  // id can back more than one assignment (e.g. a specific past chapter
  // version vs. the live/latest one) — otherwise paging between versions
  // would keep serving the first version's cached response. Defaults to
  // `assignmentId` (the prior single-cache-entry-per-id behavior).
  cacheKey?: string | number | null;
  fetchAssignment: () => Promise<AssignmentStatus>;
}

export function AssignmentRunner({ slug, assignmentId, cacheKey, fetchAssignment }: AssignmentRunnerProps) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // Flipping to the question form to try again is a purely local, temporary
  // view state — never persisted. Closing and reopening this page always
  // lands back on the latest result.
  const [retaking, setRetaking] = useState(false);
  // Which past attempt's results to show inline; null = the latest attempt.
  // Attempt history never gets its own route — it's local view state scoped
  // to this assignment (which is itself scoped to one chapter version), so
  // attempts for different versions can never bleed into one another.
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

  const assignmentQuery = useQuery({
    queryKey: ["assignment", slug, cacheKey ?? assignmentId],
    queryFn: fetchAssignment,
    refetchInterval: (query) => (query.state.data?.status === "generating" ? 2000 : false),
  });
  const data = assignmentQuery.data;
  const previousAssignmentStatus = useRef(data?.status);
  useEffect(() => {
    if (previousAssignmentStatus.current === "generating" && data?.status === "ready") {
      notifyCourseStatusChanged(queryClient, slug);
    }
    previousAssignmentStatus.current = data?.status;
  }, [data?.status, queryClient, slug]);
  const realAssignmentId = data?.id ?? null;

  const attemptsQuery = useQuery({
    queryKey: ["attempts", slug, realAssignmentId],
    queryFn: () => api.listAttempts(slug, realAssignmentId as number),
    enabled: realAssignmentId !== null,
  });

  const submit = useMutation({
    mutationFn: async () => {
      // The assignment's own id (not the `assignmentId` prop, which is only
      // the chapter/module id used for the React Query cache key) is what
      // submitAttempt needs.
      if (!data?.questions || data.id === null) throw new Error("assignment not ready");
      const payload: SubmitAnswer[] = data.questions.map((q) => ({
        question_id: q.id, answer: answers[q.id] ?? "",
      }));
      const result = await api.submitAttempt(slug, data.id, payload);
      return { ...result, assignmentId: data.id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["attempts", slug, result.assignmentId] });
      setRetaking(false);
      setSelectedAttemptId(result.attempt_id);
      setAnswers({});
    },
  });

  if (assignmentQuery.isLoading) return <AssignmentSkeleton />;
  if (assignmentQuery.isError) {
    const { status } = parseExportApiError(assignmentQuery.error);
    const message =
      status === 409
        ? "This assignment isn't ready yet — every chapter in the module must finish generating first."
        : status === 404
          ? "This assignment isn't ready yet. It will appear once the content finishes generating."
          : "Failed to load assignment.";
    return <p className="text-destructive">{message}</p>;
  }
  if (data?.status === "generating") return (
    <div className="space-y-4">
      <AssignmentSkeleton />
      <p className="text-sm text-muted-foreground">
        Putting your assignment together — hold on a minute, it&apos;ll be ready shortly.
      </p>
    </div>
  );
  if (data?.status === "failed") return <p className="text-destructive">Assignment generation failed: {data.error}</p>;
  if (!data?.questions || realAssignmentId === null) return null;
  // Wait for the attempt history before deciding which view to show —
  // otherwise a learner with a prior attempt would briefly flash the blank
  // question form before it flips to their latest result.
  if (attemptsQuery.isLoading) return <AssignmentSkeleton />;
  if (attemptsQuery.isError) return <p className="text-destructive">Failed to load your attempt history.</p>;

  const attempts = attemptsQuery.data ?? [];
  const latest = attempts[0];
  const selected = selectedAttemptId != null
    ? attempts.find((a) => a.id === selectedAttemptId) ?? latest
    : latest;

  if (latest && !retaking && selected) {
    return (
      <div className="space-y-6">
        <AttemptResults slug={slug} assignmentId={realAssignmentId} attemptId={selected.id} />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => { setAnswers({}); setRetaking(true); }}>
            Retake this assignment
          </Button>
          {selected.id !== latest.id && (
            <Button variant="ghost" onClick={() => setSelectedAttemptId(null)}>
              Back to latest result
            </Button>
          )}
        </div>
        {attempts.length > 1 && (
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Past attempts</h3>
            <div className="space-y-1.5">
              {attempts.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAttemptId(a.id)}
                  className={
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
                    + (a.id === selected.id ? " bg-muted" : "")
                  }
                >
                  <span>
                    Attempt {attempts.length - i}
                    {a.id === latest.id && <span className="text-muted-foreground"> (latest)</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    {a.status === "graded" && (
                      <Badge variant={a.passed ? "secondary" : "outline"}>
                        {Math.round((a.overall_score ?? 0) * 100)}%
                      </Badge>
                    )}
                    {a.status !== "graded" && <Badge variant="outline">{a.status}</Badge>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const allAnswered = data.questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  return (
    <div className="space-y-4">
      {latest && retaking && (
        <button type="button" onClick={() => setRetaking(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
          Back to latest result
        </button>
      )}
      {data.questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              <span className="text-muted-foreground">{i + 1}. </span>
              <InlineMarkdown>{q.text}</InlineMarkdown>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.type === "mcq" && q.options?.map((opt) => (
              <label
                key={opt}
                className="has-[:checked]:border-brand has-[:checked]:bg-accent flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <input
                  type="radio" name={`q-${q.id}`} value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className="accent-brand size-4"
                />
                <InlineMarkdown>{opt}</InlineMarkdown>
              </label>
            ))}
            {q.type === "true_false" && ["true", "false"].map((opt) => (
              <label
                key={opt}
                className="has-[:checked]:border-brand has-[:checked]:bg-accent flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm capitalize transition-colors hover:bg-muted"
              >
                <input
                  type="radio" name={`q-${q.id}`} value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className="accent-brand size-4"
                />
                {opt}
              </label>
            ))}
            {q.type === "free_text" && (
              <textarea
                className="focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition-colors focus-visible:ring-3"
                rows={4}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              />
            )}
          </CardContent>
        </Card>
      ))}
      <Button disabled={!allAnswered || submit.isPending} onClick={() => submit.mutate()}>
        {submit.isPending ? "Submitting…" : "Submit"}
      </Button>
      {submit.isError && <p className="text-destructive">Failed to submit. Please try again.</p>}
    </div>
  );
}
