"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, AssignmentStatus, SubmitAnswer } from "@/lib/api";

interface AssignmentRunnerProps {
  slug: string;
  assignmentId: number | null;
  fetchAssignment: () => Promise<AssignmentStatus>;
  resultsHref: (attemptId: number) => string;
}

export function AssignmentRunner({ slug, assignmentId, fetchAssignment, resultsHref }: AssignmentRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const assignmentQuery = useQuery({
    queryKey: ["assignment", slug, assignmentId],
    queryFn: fetchAssignment,
    refetchInterval: (query) => (query.state.data?.status === "generating" ? 2000 : false),
  });

  const submit = useMutation({
    mutationFn: () => {
      const data = assignmentQuery.data;
      // The assignment's own id (not the `assignmentId` prop, which is only
      // the chapter/module id used for the React Query cache key) is what
      // submitAttempt needs — getChapterAssignment's URL is keyed by
      // chapterId, not Assignment.id, so the real id has to come from the
      // fetch response itself.
      if (!data?.questions || data.id === null) throw new Error("assignment not ready");
      const payload: SubmitAnswer[] = data.questions.map((q) => ({
        question_id: q.id, answer: answers[q.id] ?? "",
      }));
      return api.submitAttempt(slug, data.id, payload);
    },
    onSuccess: (result) => router.push(resultsHref(result.attempt_id)),
  });

  const data = assignmentQuery.data;

  if (assignmentQuery.isLoading) return <p className="text-zinc-500">Loading assignment…</p>;
  if (assignmentQuery.isError) return <p className="text-red-600">Failed to load assignment.</p>;
  if (data?.status === "generating") return <p className="text-zinc-500">Generating assignment…</p>;
  if (data?.status === "failed") return <p className="text-red-600">Assignment generation failed: {data.error}</p>;
  if (!data?.questions) return null;

  const allAnswered = data.questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  return (
    <div className="space-y-4">
      {data.questions.map((q) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">{q.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.type === "mcq" && q.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio" name={`q-${q.id}`} value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                />
                {opt}
              </label>
            ))}
            {q.type === "true_false" && ["true", "false"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio" name={`q-${q.id}`} value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                />
                {opt}
              </label>
            ))}
            {q.type === "free_text" && (
              <textarea
                className="w-full rounded-md border border-black/10 p-2 text-sm dark:border-white/10"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              />
            )}
          </CardContent>
        </Card>
      ))}
      <Button disabled={!allAnswered || data.id === null || submit.isPending} onClick={() => submit.mutate()}>
        {submit.isPending ? "Submitting…" : "Submit"}
      </Button>
      {submit.isError && <p className="text-red-600">Failed to submit. Please try again.</p>}
    </div>
  );
}
