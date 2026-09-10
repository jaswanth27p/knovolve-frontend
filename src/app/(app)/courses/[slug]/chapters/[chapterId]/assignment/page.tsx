"use client";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { AssignmentRunner } from "@/components/assignment-runner";

export default function ChapterAssignmentPage() {
  const params = useParams<{ slug: string; chapterId: string }>();
  const chapterId = Number(params.chapterId);
  // A `?version=` param pins this page to one specific past chapter-content
  // version's own assignment/attempt history (see chapter page's version
  // nav) — omitted, it falls back to whichever version is currently
  // relevant (the live/latest one), same as before this param existed.
  const versionParam = useSearchParams().get("version");
  const version = versionParam !== null ? Number(versionParam) : null;

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
        cacheKey={version !== null ? `${chapterId}:v${version}` : chapterId}
        fetchAssignment={() =>
          version !== null
            ? api.getChapterVersionAssignment(params.slug, chapterId, version)
            : api.getChapterAssignment(params.slug, chapterId)
        }
        resultsHref={(assignmentId, attemptId) =>
          `/courses/${params.slug}/chapters/${chapterId}/assignment/results/${assignmentId}/${attemptId}`
        }
      />
    </div>
  );
}
