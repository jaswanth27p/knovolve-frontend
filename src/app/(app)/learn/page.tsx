"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, CourseJobResponse } from "@/lib/api";

export default function LearnPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);

  // Auth is gated by (app)/layout.tsx for every route in this group.

  const createCourse = useMutation({
    mutationFn: (topic: string) => api.createCourse(topic),
    onSuccess: (data: CourseJobResponse) => {
      if (data.status === "exists" && data.course) {
        router.push(`/courses/${data.course.topic_slug}`);
      } else if (data.job_id) {
        setJobId(data.job_id);
      }
    },
  });

  const jobStatus = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.getJob(jobId as number),
    enabled: jobId !== null,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" || query.state.data?.status === "running" ? 3000 : false,
  });

  useEffect(() => {
    if (jobStatus.data?.status === "succeeded" && jobStatus.data.course) {
      router.push(`/courses/${jobStatus.data.course.topic_slug}`);
    }
  }, [jobStatus.data, router]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-6 px-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Generate a course from a topic, or revisit one you&apos;ve made.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); createCourse.mutate(topic); }}
        className="flex gap-2"
      >
        <Input placeholder="What do you want to learn?" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <Button type="submit">Start</Button>
      </form>

      {createCourse.isError && (
        <p className="text-red-600">Failed to start course generation. Please try again.</p>
      )}

      {jobStatus.isError && (
        <p className="text-red-600">Failed to check course generation status. Please try again.</p>
      )}

      {jobStatus.data?.status && jobStatus.data.status !== "succeeded" && jobStatus.data.status !== "failed" && (
        <p>Status: {jobStatus.data.status}</p>
      )}
      {jobStatus.data?.status === "failed" && (
        <p className="text-red-600">Generation failed: {jobStatus.data.error}</p>
      )}
    </div>
  );
}
