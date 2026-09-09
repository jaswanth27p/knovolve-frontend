"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface AttemptResultsProps {
  slug: string;
  assignmentId: number;
  attemptId: number;
}

export function AttemptResults({ slug, assignmentId, attemptId }: AttemptResultsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt", slug, assignmentId, attemptId],
    queryFn: () => api.getAttempt(slug, assignmentId, attemptId),
    refetchInterval: (query) => (query.state.data?.status === "grading" ? 2000 : false),
  });

  if (isLoading) return <p className="text-zinc-500">Loading results…</p>;
  if (isError) return <p className="text-red-600">Failed to load results.</p>;
  if (data?.status === "grading") return <p className="text-zinc-500">Grading…</p>;
  if (data?.status === "failed") return <p className="text-red-600">Grading failed: {data.error}</p>;
  if (!data?.answers) return null;

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">
        Score: {Math.round((data.overall_score ?? 0) * 100)}%
      </p>
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
        {data.answers.map((a) => (
          <Card key={a.question_id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {a.is_correct ? "✅ Correct" : "❌ Incorrect"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{a.feedback}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="pt-2">
        {data.level === "chapter" && data.passed && data.next_chapter_id && (
          <Button nativeButton={false} render={<Link href={`/courses/${slug}/chapters/${data.next_chapter_id}`} />}>
            Next chapter →
          </Button>
        )}
        {data.level === "chapter" && data.passed && !data.next_chapter_id && (
          <Button nativeButton={false} render={<Link href={`/courses/${slug}`} />}>
            🎉 Course complete — back to course
          </Button>
        )}
        {data.level === "chapter" && !data.passed && data.chapter_id && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
