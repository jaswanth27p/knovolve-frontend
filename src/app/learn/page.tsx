"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function LearnPage() {
  const [topic, setTopic] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);
  const [existingCourse, setExistingCourse] = useState<any>(null);

  const createCourse = useMutation({
    mutationFn: (topic: string) => api.createCourse(topic),
    onSuccess: (data) => {
      if (data.status === "exists" && data.course) {
        // Dedup path (Task 11's find_existing): a published course already
        // matches this topic — render it directly, no job to poll.
        setExistingCourse(data.course);
        setJobId(null);
      } else if (data.job_id) {
        setExistingCourse(null);
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

  const course = existingCourse ?? jobStatus.data?.course;

  return (
    <div className="max-w-2xl mx-auto mt-20 space-y-4">
      <form
        onSubmit={(e) => { e.preventDefault(); createCourse.mutate(topic); }}
        className="flex gap-2"
      >
        <Input placeholder="What do you want to learn?" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <Button type="submit">Start</Button>
      </form>

      {jobStatus.data?.status && jobStatus.data.status !== "succeeded" && (
        <p>Status: {jobStatus.data.status}</p>
      )}
      {jobStatus.data?.status === "failed" && (
        <p className="text-red-600">Generation failed: {jobStatus.data.error}</p>
      )}
      {course && (
        <ul className="space-y-2">
          {course.modules.map((m: any, i: number) => (
            <li key={i}>
              <strong>{m.title}</strong>
              <ul className="ml-4 list-disc">
                {m.chapters.map((c: any, j: number) => <li key={j}>{c.title}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
