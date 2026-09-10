"use client";
import { useParams } from "next/navigation";
import { AttemptResults } from "@/components/attempt-results";

export default function ModuleAssignmentResultsPage() {
  const params = useParams<{ slug: string; assignmentId: string; attemptId: string }>();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
      <AttemptResults
        slug={params.slug}
        assignmentId={Number(params.assignmentId)}
        attemptId={Number(params.attemptId)}
      />
    </div>
  );
}
