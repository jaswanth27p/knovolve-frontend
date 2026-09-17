"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { CourseCardSkeleton } from "@/components/skeletons";
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
        <h2 className="font-display text-lg font-medium">Explore public courses</h2>
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CourseCardSkeleton key={i} />
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
            <CourseCard
              key={c.id}
              topicSlug={c.topic_slug}
              topicRaw={c.topic_raw}
              moduleCount={c.module_count}
              chapterCount={c.chapter_count}
              timestamp={c.created_at}
              timestampVerb="Added"
            />
          ))}
        </div>
      )}
    </section>
  );
}
