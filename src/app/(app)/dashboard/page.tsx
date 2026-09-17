"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CourseCard } from "@/components/course-card";
import { DashboardSkeleton, CourseListSkeleton } from "@/components/skeletons";
import { ActivitySection } from "@/components/activity-section";
import { BookOpen, Layers, CircleCheck, Flame } from "lucide-react";
import { api } from "@/lib/api";

const STAT_ICONS = [Layers, BookOpen, CircleCheck, Flame] as const;

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboard(),
  });

  // First page only — the /courses page owns filters + pagination now.
  const coursesQuery = useQuery({
    queryKey: ["myCourses", { page: 1, limit: 5, sort: "date", order: "desc" }],
    queryFn: () =>
      api.getMyCourses({ page: 1, limit: 5, sort: "date", order: "desc" }),
  });

  const stats = data
    ? [
        { label: "Total courses", value: data.total_count },
        { label: "In progress", value: data.in_progress_count },
        { label: "Completed", value: data.completed_count },
        { label: "Day streak", value: data.streak.current },
      ]
    : [];

  const courses = coursesQuery.data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10">
      <h1 className="font-display text-3xl font-medium tracking-tight">Dashboard</h1>

      {isLoading && <DashboardSkeleton />}
      {isError && <p className="text-destructive">Failed to load dashboard.</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = STAT_ICONS[i];
              return (
                <div key={s.label} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                  <Icon className="text-brand size-4" strokeWidth={1.75} />
                  <div className="mt-3 font-mono text-2xl font-medium tabular-nums">{s.value}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          <ActivitySection />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-medium">Your courses</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/courses" />}>View all</Button>
                <Button size="sm" nativeButton={false} render={<Link href="/learn" />}>Create a course</Button>
              </div>
            </div>

            {coursesQuery.isLoading && <CourseListSkeleton count={3} />}
            {coursesQuery.isError && <p className="text-destructive">Failed to load courses.</p>}
            {!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0 && (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Start with a topic — Knovolve builds a structured course for you in about 10–15 minutes."
                actionLabel="Create a course"
                actionHref="/learn"
              />
            )}
            <div className="space-y-2">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  variant="mine"
                  topicSlug={c.topic_slug}
                  topicRaw={c.topic_raw}
                  moduleCount={c.module_count}
                  chapterCount={c.chapter_count}
                  status={c.status}
                  progress={c.progress}
                  weakConceptCount={c.weak_concept_count}
                  strongConceptCount={c.strong_concept_count}
                  timestamp={c.last_opened_at}
                  timestampVerb="Opened"
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
