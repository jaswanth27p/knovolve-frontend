"use client";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { AssignmentRunner } from "@/components/assignment-runner";

export default function ModuleAssignmentPage() {
  const params = useParams<{ slug: string; moduleId: string }>();
  const moduleId = Number(params.moduleId);
  const dispatched = useRef(false);

  useEffect(() => {
    if (dispatched.current) return;
    dispatched.current = true;
    api.createModuleAssignment(params.slug, moduleId).catch(() => undefined);
  }, [params.slug, moduleId]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Link
        href={`/courses/${params.slug}/modules/${moduleId}`}
        className="flex w-fit items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        <ArrowLeft className="size-4" />
        Back to module
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Module assignment</h1>
      <AssignmentRunner
        slug={params.slug}
        assignmentId={moduleId}
        fetchAssignment={() => api.getModuleAssignment(params.slug, moduleId)}
        resultsHref={(assignmentId, attemptId) =>
          `/courses/${params.slug}/modules/${moduleId}/assignment/results/${assignmentId}/${attemptId}`
        }
      />
    </div>
  );
}
