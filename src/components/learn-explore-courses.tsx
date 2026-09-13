"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export function LearnExploreCourses() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["learnPublicCourses"],
    queryFn: () => api.getPublicCourses({ page: 1, limit: 6, sort: "date", order: "desc" }),
    staleTime: 60_000,
  });

  const courses = data?.items ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Explore public courses</h2>
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-destructive">Failed to load public courses.</p>}

      {!isLoading && !isError && courses.length === 0 && (
        <EmptyState
          icon={Globe}
          title="No public courses yet"
          description="Courses show up here once they're generated."
          compact
        />
      )}

      {courses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="relative transition-shadow hover:shadow">
              <Link
                href={`/courses/${c.topic_slug}`}
                className="absolute inset-0 z-10 rounded-xl"
                aria-label={c.topic_raw}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.topic_raw}</CardTitle>
                <CardDescription>
                  {c.module_count} modules · {c.chapter_count} chapters
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
