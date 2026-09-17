"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CourseDetailSkeleton } from "@/components/skeletons";
import { Hourglass } from "lucide-react";
import { api } from "@/lib/api";
import { ExportDialog } from "@/components/export-dialog";
import { ExportHistoryDialog } from "@/components/export-history-dialog";
import { GenerateCourseButton } from "@/components/generate-course-button";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", params.slug],
    queryFn: () => api.getCourse(params.slug),
  });
  // Dedicated by-slug lookup: this page only needs to know whether the single
  // course being viewed is tracked, not the learner's whole library.
  const tracked = useQuery({ queryKey: ["my-course", params.slug], queryFn: () => api.getMyCourseBySlug(params.slug) });
  const trackedCourse = tracked.data ?? undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      {isLoading && <CourseDetailSkeleton />}
      {isError && <p className="text-destructive">Failed to load course.</p>}
      {data && (
        <>
          <h1 className="font-display text-3xl font-medium tracking-tight">{data.topic_raw}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ExportDialog slug={data.topic_slug} />
            <ExportHistoryDialog slug={data.topic_slug} />
            <GenerateCourseButton slug={data.topic_slug} />
          </div>
          {trackedCourse && (
            <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {trackedCourse.status === "completed" ? "Completed" : `In progress · ${Math.round(trackedCourse.progress * 100)}%`}
                </p>
                <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-gradient"
                    style={{ width: `${Math.round(trackedCourse.progress * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.modules[0]?.chapters[0] && (
                  <Button
                    size="sm"
                    className="shrink-0"
                    nativeButton={false}
                    render={<Link href={`/courses/${data.topic_slug}/chapters/${data.modules[0].chapters[0].id}`} />}
                  >
                    {trackedCourse.progress > 0 ? "Resume" : "Start"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  nativeButton={false}
                  render={<Link href={`/courses/${params.slug}/extend`} />}
                >
                  Extend course
                </Button>
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
                <Card className="spotlight-border transition-colors hover:bg-card/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="font-display text-brand-gradient">{i + 1}.</span>
                      {m.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{m.objective}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
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
