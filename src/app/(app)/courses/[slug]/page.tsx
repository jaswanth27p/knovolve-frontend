"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Hourglass } from "lucide-react";
import { api } from "@/lib/api";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", params.slug],
    queryFn: () => api.getCourse(params.slug),
  });
  const tracked = useQuery({ queryKey: ["my-courses"], queryFn: () => api.getMyCourses() });
  const trackedCourse = tracked.data?.find((c) => c.topic_slug === params.slug);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      {isLoading && <p className="text-zinc-500">Loading…</p>}
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
              {data.modules[0]?.chapters[0] && (
                <Link
                  href={`/courses/${data.topic_slug}/chapters/${data.modules[0].chapters[0].id}`}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {trackedCourse.progress > 0 ? "Resume" : "Start"}
                </Link>
              )}
            </div>
          )}
          {data.modules.length === 0 && (
            <EmptyState
              icon={Hourglass}
              title="Content is being generated"
              description="Modules and chapters will appear here as they're ready."
              compact
            />
          )}
          <div className="space-y-4">
            {data.modules.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{m.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">{m.objective}</p>
                  <ul className="space-y-1">
                    {m.chapters.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/courses/${data.topic_slug}/chapters/${c.id}`}
                          className="text-sm underline"
                        >
                          {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/courses/${data.topic_slug}/modules/${m.id}/assignment`}
                    className="mt-2 inline-block text-sm underline"
                  >
                    Module assignment
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
