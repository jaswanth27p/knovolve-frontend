"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineMarkdown } from "@/components/inline-markdown";
import { ResultsSkeleton } from "@/components/skeletons";
import { api, AttemptAnswerResult } from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";
import { cn } from "cn";

interface AttemptResultsProps {
  slug: string;
  assignmentId: number;
  attemptId: number;
}

function optionsFor(answer: AttemptAnswerResult): string[] {
  if (answer.type === "true_false") return ["true", "false"];
  return answer.options ?? [];
}

function AnswerReview({ answer }: { answer: AttemptAnswerResult }) {
  if (answer.type === "free_text") {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Your answer</p>
          <p
            className={cn(
              "mt-1 rounded-lg border px-3 py-2 text-sm",
              answer.is_correct
                ? "border-brand-accent/60 bg-brand-accent/10"
                : "border-destructive/60 bg-destructive/10",
            )}
          >
            {answer.user_answer.trim() || "No answer"}
          </p>
        </div>
        {answer.feedback && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Reasoning</p>
            <p className="mt-1 text-sm">{answer.feedback}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Correct answer</p>
          <p className="mt-1 text-sm">{answer.correct_answer}</p>
        </div>
        {answer.explanation && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Explanation</p>
            <p className="mt-1 text-sm">{answer.explanation}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {optionsFor(answer).map((opt) => {
          const isCorrect = opt === answer.correct_answer;
          const isPicked = opt === answer.user_answer;
          return (
            <div
              key={opt}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm",
                isCorrect
                  ? "border-brand-accent/60 bg-brand-accent/10"
                  : isPicked
                    ? "border-destructive/60 bg-destructive/10"
                    : "border-border",
              )}
            >
              <span className={cn(answer.type === "true_false" && "capitalize")}>
                <InlineMarkdown>{opt}</InlineMarkdown>
              </span>
              {isCorrect ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-accent">
                  <Check className="size-3.5" strokeWidth={2.5} />
                  Correct answer
                </span>
              ) : isPicked ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-destructive">
                  <X className="size-3.5" strokeWidth={2.5} />
                  Your answer
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {answer.explanation && <p className="text-sm text-muted-foreground">{answer.explanation}</p>}
    </div>
  );
}

export function AttemptResults({ slug, assignmentId, attemptId }: AttemptResultsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt", slug, assignmentId, attemptId],
    queryFn: () => api.getAttempt(slug, assignmentId, attemptId),
    refetchInterval: (query) => (query.state.data?.status === "grading" ? 2000 : false),
  });

  const queryClient = useQueryClient();
  const previousAttemptStatus = useRef(data?.status);
  useEffect(() => {
    if (previousAttemptStatus.current === "grading" && data?.status !== "grading") {
      notifyCourseStatusChanged(queryClient, slug);
    }
    previousAttemptStatus.current = data?.status;
  }, [data?.status, queryClient, slug]);

  if (isLoading) return <ResultsSkeleton />;
  if (isError) return <p className="text-destructive">Failed to load results.</p>;
  if (data?.status === "grading") return (
    <div className="space-y-4">
      <ResultsSkeleton />
      <p className="text-sm text-muted-foreground">Grading your answers — this only takes a moment.</p>
    </div>
  );
  if (data?.status === "failed") return <p className="text-destructive">Grading failed: {data.error}</p>;
  if (!data?.answers) return null;

  const scorePct = Math.round((data.overall_score ?? 0) * 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="font-mono text-4xl font-medium tracking-tight tabular-nums">{scorePct}%</p>
            <p className="text-sm text-muted-foreground">Overall score</p>
          </div>
          {data.passed !== null && (
            <Badge variant={data.passed ? "secondary" : "outline"} className="text-sm">
              {data.passed ? "Passed" : "Not passed"}
            </Badge>
          )}
        </CardContent>
      </Card>
      {data.concept_scores && (
        <div className="flex flex-wrap gap-2">
          {data.concept_scores.map((c) => (
            <Badge key={c.concept_tag} variant={c.correct === c.total ? "secondary" : "outline"}>
              {c.concept_tag}: {c.correct}/{c.total}
            </Badge>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {data.answers.map((a, i) => (
          <Card key={a.question_id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                {a.is_correct ? (
                  <Check className="text-brand-accent size-4" strokeWidth={2.5} />
                ) : (
                  <X className="text-destructive size-4" strokeWidth={2.5} />
                )}
                {i + 1}. {a.is_correct ? "Correct" : "Incorrect"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">
                <InlineMarkdown>{a.text}</InlineMarkdown>
              </p>
              <AnswerReview answer={a} />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="pt-2">
        {data.level === "chapter" && data.passed && data.next_chapter_id && (
          <Button nativeButton={false} render={<Link href={`/courses/${slug}/chapters/${data.next_chapter_id}`} />}>
            Continue to next chapter
          </Button>
        )}
        {data.level === "chapter" && data.passed && !data.next_chapter_id && (
          <Button nativeButton={false} render={<Link href={`/courses/${slug}`} />}>
            <GraduationCap /> Course complete — back to course
          </Button>
        )}
        {data.level === "chapter" && !data.passed && data.chapter_id && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We&apos;re putting together a shorter, targeted review covering what you missed.
            </p>
            <Button
              nativeButton={false}
              render={<Link href={`/courses/${slug}/chapters/${data.chapter_id}`} />}
            >
              Continue to review
            </Button>
          </div>
        )}
        {data.level === "module" && (
          <Button variant="outline" nativeButton={false} render={<Link href={`/courses/${slug}`} />}>
            Back to course
          </Button>
        )}
      </div>
    </div>
  );
}
