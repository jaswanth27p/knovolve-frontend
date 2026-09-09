"use client";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
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
    <div className="max-w-3xl mx-auto mt-12 space-y-6 pb-20">
      <h1 className="text-xl font-semibold">Module assignment</h1>
      <AssignmentRunner
        slug={params.slug}
        assignmentId={moduleId}
        fetchAssignment={() => api.getModuleAssignment(params.slug, moduleId)}
        resultsHref={(attemptId) => `/courses/${params.slug}/modules/${moduleId}/assignment/results/${attemptId}`}
      />
    </div>
  );
}
