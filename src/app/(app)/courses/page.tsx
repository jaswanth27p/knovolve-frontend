"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, TrackedCourse } from "@/lib/api";

function CourseLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/courses/${slug}`}>{children}</Link>;
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [removeErrors, setRemoveErrors] = useState<Record<number, string>>({});

  const myCourses = useQuery({ queryKey: ["myCourses"], queryFn: () => api.getMyCourses() });
  const publicCourses = useQuery({ queryKey: ["publicCourses"], queryFn: () => api.getPublicCourses() });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteMyCourse(id),
    onMutate: (id) => {
      setPendingIds((prev) => new Set(prev).add(id));
      setRemoveErrors((prev) => {
        const { [id]: _omit, ...rest } = prev;
        return rest;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCourses"] });
      queryClient.invalidateQueries({ queryKey: ["publicCourses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err, id) => {
      setRemoveErrors((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Failed to remove course.",
      }));
    },
    onSettled: (_data, _err, id) => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  function MyCard({ c }: { c: TrackedCourse }) {
    const isPending = pendingIds.has(c.id);
    const error = removeErrors[c.id];
    return (
      <Card>
        <CardHeader className="pb-2">
          <CourseLink slug={c.topic_slug}>
            <CardTitle className="text-base hover:underline">{c.topic_raw}</CardTitle>
          </CourseLink>
          <CardDescription>
            {c.module_count} modules · {c.chapter_count} chapters
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant={c.status === "completed" ? "secondary" : "default"}>{c.status}</Badge>
          {c.content_ready && <span className="text-xs text-zinc-500">content ready</span>}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-zinc-500"
            disabled={isPending}
            onClick={() => remove.mutate(c.id)}
          >
            Remove
          </Button>
        </CardContent>
        {error && <p className="px-6 pb-3 text-sm text-red-600">Failed to remove course: {error}</p>}
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My courses</h2>
        {myCourses.isLoading && <p className="text-zinc-500">Loading…</p>}
        {myCourses.isError && <p className="text-red-600">Failed to load courses.</p>}
        {myCourses.data?.length === 0 && (
          <p className="text-zinc-500">You haven&apos;t started any courses yet.</p>
        )}
        <div className="space-y-2">
          {myCourses.data?.map((c) => <MyCard key={c.id} c={c} />)}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Public courses</h2>
        {publicCourses.isLoading && <p className="text-zinc-500">Loading…</p>}
        {publicCourses.isError && <p className="text-red-600">Failed to load public courses.</p>}
        {publicCourses.data?.length === 0 && (
          <p className="text-zinc-500">No public courses available.</p>
        )}
        <div className="space-y-2">
          {publicCourses.data?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CourseLink slug={c.topic_slug}>
                  <CardTitle className="text-base hover:underline">{c.topic_raw}</CardTitle>
                </CourseLink>
                <CardDescription>
                  {c.module_count} modules · {c.chapter_count} chapters
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
