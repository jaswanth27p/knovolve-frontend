"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboard(),
  });

  const stats = data
    ? [
        { label: "Total courses", value: data.total_count },
        { label: "In progress", value: data.in_progress_count },
        { label: "Completed", value: data.completed_count },
      ]
    : [];

  const courses = data ? [...data.in_progress, ...data.completed] : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {isLoading && <p className="text-zinc-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load dashboard.</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{s.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your courses</h2>
            {courses.length === 0 && (
              <p className="text-zinc-500">
                No courses yet — start one on the{" "}
                <Link href="/learn" className="underline">Learn</Link> page.
              </p>
            )}
            <div className="space-y-2">
              {courses.map((c) => (
                <Link key={c.id} href={`/courses/${c.topic_slug}`}>
                  <Card className="transition-shadow hover:shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{c.topic_raw}</CardTitle>
                      <CardDescription>
                        {c.module_count} modules · {c.chapter_count} chapters
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={c.status === "completed" ? "secondary" : "default"}>
                        {c.status}
                      </Badge>
                      {c.content_ready && (
                        <span className="ml-2 text-xs text-zinc-500">content ready</span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}