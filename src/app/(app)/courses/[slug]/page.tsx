"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { CourseDetailSkeleton } from "@/components/skeletons";
import { Hourglass } from "lucide-react";
import { api } from "@/lib/api";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", params.slug],
    queryFn: () => api.getCourse(params.slug),
  });
  // /me/courses is paginated now; this page only needs to know whether the
  // single course being viewed is tracked, so request the max page size
  // rather than adding a dedicated by-slug lookup endpoint.
  const tracked = useQuery({ queryKey: ["my-courses", "detail-lookup"], queryFn: () => api.getMyCourses({ limit: 100 }) });
  const trackedCourse = tracked.data?.items.find((c) => c.topic_slug === params.slug);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      {isLoading && <CourseDetailSkeleton />}
      {isError && <p className="text-red-600">Failed to load course.</p>}
      {data && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">{data.topic_raw}</h1>
          {trackedCourse && (
            <div className="flex items-center justify-between rounded-md border border-black/10 p-4 dark:border-white/10">
              <div>
                <p className="text-sm font-medium">
                  {trackedCourse.status === "completed" ? "Completed" : `In progress · ${Math.round(trackedCourse.progress * 100)}%`}
                </p>
                <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                    style={{ width: `${Math.round(trackedCourse.progress * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {data.modules[0]?.chapters[0] && (
                  <Link
                    href={`/courses/${data.topic_slug}/chapters/${data.modules[0].chapters[0].id}`}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {trackedCourse.progress > 0 ? "Resume" : "Start"}
                  </Link>
                )}
                <Link
                  href={`/courses/${params.slug}/extend`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Extend course
                </Link>
              </div>
            </div>
          )}
          {data.modules.length === 0 && (
            <EmptyState
              icon={Hourglass}
              title="Content is being generated"
              description="Modules will appear here as they're ready."
              compact
            />
          )}
          <div className="space-y-3">
            {data.modules.map((m, i) => (
              <Link key={m.id} href={`/courses/${data.topic_slug}/modules/${m.id}`}>
                <Card className="transition-shadow hover:shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-zinc-400 dark:text-zinc-500">{i + 1}.</span>
                      {m.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{m.objective}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {m.chapters.length} {m.chapters.length === 1 ? "chapter" : "chapters"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
