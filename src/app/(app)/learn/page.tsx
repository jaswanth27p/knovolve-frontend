"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, CourseCandidate, CourseJobResponse, MyCourseJob } from "@/lib/api";

const TRACKED_JOB_KEY = "knovolve:learn:tracked_job_id";

function readTrackedJobId(): number | null {
  try {
    const raw = localStorage.getItem(TRACKED_JOB_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeTrackedJobId(jobId: number | null) {
  try {
    if (jobId === null) localStorage.removeItem(TRACKED_JOB_KEY);
    else localStorage.setItem(TRACKED_JOB_KEY, String(jobId));
  } catch {
    // localStorage unavailable — the box just won't survive a navigation away and back.
  }
}

function jobStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "running":
      return "Generating";
    case "succeeded":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function JobBadge({ status }: { status: string }) {
  if (status === "pending" || status === "running") {
    return (
      <Badge variant="secondary">
        <Loader2 className="size-3 animate-spin" />
        {jobStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{jobStatusLabel(status)}</Badge>;
}

interface SimilarSubmit {
  topic: string;
  candidates: CourseCandidate[];
  searchToken: string;
}

export default function LearnPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  // (app)/layout.tsx gates every child behind a client-mount check before
  // rendering anything, so this page never runs during SSR — safe to read
  // localStorage straight into the initial render. Restores whatever job
  // this tab was tracking before a navigation away, so coming back to
  // /learn doesn't lose all trace of an in-flight job.
  const [jobId, setJobId] = useState<number | null>(() => readTrackedJobId());
  const [similar, setSimilar] = useState<SimilarSubmit | null>(null);

  // Auth is gated by (app)/layout.tsx for every route in this group.

  const createCourse = useMutation({
    mutationFn: (input: { topic: string; force?: boolean; searchToken?: string }) =>
      api.createCourse(input.topic, { force: input.force, searchToken: input.searchToken }),
    onSuccess: (data: CourseJobResponse, input) => {
      if (data.status === "similar" && data.candidates && data.search_token) {
        writeTrackedJobId(null);
        setSimilar({ topic: input.topic, candidates: data.candidates, searchToken: data.search_token });
      } else if (data.status === "exists" && data.course) {
        writeTrackedJobId(null);
        router.push(`/courses/${data.course.topic_slug}`);
      } else if (data.job_id) {
        setJobId(data.job_id);
        writeTrackedJobId(data.job_id);
        setTopic("");
        setSimilar(null);
      }
    },
  });

  const jobStatus = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.getJob(jobId as number),
    enabled: jobId !== null,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" || query.state.data?.status === "running" ? 2000 : false,
  });

  useEffect(() => {
    if (jobStatus.data?.status === "succeeded" && jobStatus.data.course) {
      writeTrackedJobId(null);
      router.push(`/courses/${jobStatus.data.course.topic_slug}`);
    }
  }, [jobStatus.data, router]);

  const myJobs = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => api.getMyJobs(),
    refetchInterval: 4000,
  });

  // Only jobs still in flight belong here — a finished one has nothing left
  // to track, and course creation itself is blocked below while any job is
  // ongoing, so this can only ever hold pending/running work.
  const otherJobs = (myJobs.data ?? []).filter(
    (j) => j.id !== jobId && (j.status === "pending" || j.status === "running")
  );

  const busy = createCourse.isPending || jobStatus.data?.status === "pending" || jobStatus.data?.status === "running";

  function startOver() {
    writeTrackedJobId(null);
    setJobId(null);
    setSimilar(null);
    createCourse.reset();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center space-y-8 px-6 py-16">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Learn something new</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Give us a topic — we&apos;ll build a full course for you.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            What do you want to learn?
          </CardTitle>
          <CardDescription>Takes a couple of minutes — you can leave this page and come back.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy && topic.trim()) createCourse.mutate({ topic: topic.trim() });
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="e.g. Linear algebra for ML"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={busy}
              autoFocus
            />
            <Button type="submit" disabled={busy || !topic.trim()}>
              {createCourse.isPending ? <Loader2 className="size-4 animate-spin" /> : "Start"}
            </Button>
          </form>

          {createCourse.isError && (
            <p className="text-sm text-red-600">Failed to start course generation. Please try again.</p>
          )}

          {similar && (
            <div className="space-y-3">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                We found {similar.candidates.length} similar course
                {similar.candidates.length > 1 ? "s" : ""} for{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{"\u201C"}{similar.topic}{"\u201D"}</span>.
                Pick one to continue, or generate a fresh course.
              </div>
              <div className="space-y-2">
                {similar.candidates.map((c) => (
                  <SimilarCourseRow
                    key={c.id}
                    candidate={c}
                    onTrack={() => {
                      setJobId(c.id);
                      writeTrackedJobId(c.id);
                      setSimilar(null);
                    }}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={createCourse.isPending}
                onClick={() =>
                  createCourse.mutate({ topic: similar.topic, force: true, searchToken: similar.searchToken })
                }
              >
                {createCourse.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Generate a new course anyway"
                )}
              </Button>
            </div>
          )}

          {jobId !== null && (
            <div className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <JobBadge status={jobStatus.data?.status ?? "pending"} />
                <span className="text-zinc-600 dark:text-zinc-400">
                  {jobStatus.isLoading && !jobStatus.data ? "Starting…" : jobStatus.data?.status === "failed" ? jobStatus.data.error ?? "Generation failed" : "Building your course…"}
                </span>
              </div>
              {jobStatus.data?.status === "failed" && (
                <Button size="sm" variant="outline" onClick={startOver}>
                  Try again
                </Button>
              )}
            </div>
          )}

          {jobStatus.isError && (
            <p className="text-sm text-red-600">Failed to check course generation status. Please try again.</p>
          )}
        </CardContent>
      </Card>

      {otherJobs.length > 0 && (
        <div className="w-full max-w-md space-y-2">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Your other courses in progress</h2>
          <div className="space-y-2">
            {otherJobs.map((job) => (
              <OtherJobRow key={job.id} job={job} onTrack={() => { setJobId(job.id); writeTrackedJobId(job.id); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimilarCourseRow({ candidate, onTrack }: { candidate: CourseCandidate; onTrack: () => void }) {
  const published = candidate.course_url;
  const content = (
    <Card className="transition-shadow hover:shadow">
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{candidate.topic_raw}</p>
          {published && candidate.module_count !== null && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {candidate.module_count} modules · {candidate.chapter_count} chapters
            </p>
          )}
        </div>
        {published ? (
          <Badge variant="outline">{Math.round(candidate.similarity * 100)}% match</Badge>
        ) : (
          <Badge variant="secondary">
            <Loader2 className="size-3 animate-spin" />
            In progress
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (published) {
    return <Link href={published}>{content}</Link>;
  }
  return (
    <button type="button" onClick={onTrack} className="block w-full text-left">
      {content}
    </button>
  );
}

function OtherJobRow({ job, onTrack }: { job: MyCourseJob; onTrack: () => void }) {
  const content = (
    <Card className="transition-shadow hover:shadow">
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{job.topic_raw}</p>
        </div>
        <JobBadge status={job.status} />
      </CardContent>
    </Card>
  );

  if (job.status === "succeeded" && job.course_slug) {
    return <Link href={`/courses/${job.course_slug}`}>{content}</Link>;
  }
  return (
    <button type="button" onClick={onTrack} className="block w-full text-left">
      {content}
    </button>
  );
}
