"use client";
import { useParams } from "next/navigation";
import { AttemptResults } from "@/components/attempt-results";

export default function ChapterAssignmentResultsPage() {
  const params = useParams<{ slug: string; assignmentId: string; attemptId: string }>();
  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-6 pb-20">
      <h1 className="text-xl font-semibold">Results</h1>
      <AttemptResults
        slug={params.slug}
        assignmentId={Number(params.assignmentId)}
        attemptId={Number(params.attemptId)}
      />
    </div>
  );
}
