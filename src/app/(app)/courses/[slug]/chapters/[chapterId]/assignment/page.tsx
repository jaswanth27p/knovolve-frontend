"use client";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { AssignmentRunner } from "@/components/assignment-runner";

export default function ChapterAssignmentPage() {
  const params = useParams<{ slug: string; chapterId: string }>();
  const chapterId = Number(params.chapterId);

  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-6 pb-20">
      <h1 className="text-xl font-semibold">Chapter assignment</h1>
      <AssignmentRunner
        slug={params.slug}
        assignmentId={chapterId}
        fetchAssignment={() => api.getChapterAssignment(params.slug, chapterId)}
        resultsHref={(assignmentId, attemptId) =>
          `/courses/${params.slug}/chapters/${chapterId}/assignment/results/${assignmentId}/${attemptId}`
        }
      />
    </div>
  );
}
