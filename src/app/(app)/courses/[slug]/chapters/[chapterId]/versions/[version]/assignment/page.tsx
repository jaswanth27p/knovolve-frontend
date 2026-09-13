"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { AssignmentRunner } from "@/components/assignment-runner";

// Assignment pinned to one specific chapter-content version. Each version has
// its own Assignment row (keyed by chapter_content_id), so attempts submitted
// here are naturally isolated from every other version's attempts.
export default function ChapterVersionAssignmentPage() {
  const params = useParams<{ slug: string; chapterId: string; version: string }>();
  const chapterId = Number(params.chapterId);
  const version = Number(params.version);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Link
        href={`/courses/${params.slug}/chapters/${chapterId}/versions/${version}`}
        className="flex w-fit items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        <ArrowLeft className="size-4" />
        Back to version {version}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Chapter assignment · version {version}</h1>
      <AssignmentRunner
        slug={params.slug}
        assignmentId={chapterId}
        cacheKey={`${chapterId}:v${version}`}
        fetchAssignment={() => api.getChapterVersionAssignment(params.slug, chapterId, version)}
      />
    </div>
  );
}
