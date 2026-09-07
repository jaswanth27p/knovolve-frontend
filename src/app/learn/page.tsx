"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, CourseJobResponse, CourseSummary } from "@/lib/api";

export default function LearnPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);
  const [existingCourse, setExistingCourse] = useState<CourseSummary | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("refresh_token")) {
      router.push("/login");
    }
  }, [router]);

  const createCourse = useMutation({
    mutationFn: (topic: string) => api.createCourse(topic),
    onSuccess: (data: CourseJobResponse) => {
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
      {course && (
        <ul className="space-y-2">
          {course.modules.map((m, i) => (
            <li key={i}>
              <strong>{m.title}</strong>
              <ul className="ml-4 list-disc">
                {m.chapters.map((c) => (
                  <li key={c.id}>
                    <Link href={`/courses/${course.topic_slug}/chapters/${c.id}`} className="underline">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
