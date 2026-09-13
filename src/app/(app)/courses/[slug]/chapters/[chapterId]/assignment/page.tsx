"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { AssignmentRunner } from "@/components/assignment-runner";

// Assignment for whichever chapter-content version is currently relevant to
// this learner (their latest V2+ remediation if one exists, else the shared
// V1). Version-specific assignments live at
// `/chapters/[chapterId]/versions/[version]/assignment`.
export default function ChapterAssignmentPage() {
  const params = useParams<{ slug: string; chapterId: string }>();
  const chapterId = Number(params.chapterId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Link
        href={`/courses/${params.slug}/chapters/${chapterId}`}
        className="flex w-fit items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        <ArrowLeft className="size-4" />
        Back to chapter
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Chapter assignment</h1>
      <AssignmentRunner
        slug={params.slug}
        assignmentId={chapterId}
        fetchAssignment={() => api.getChapterAssignment(params.slug, chapterId)}
      />
    </div>
  );
}
