"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearnHero } from "@/components/learn-hero";
import { LearnGenerationsPanel } from "@/components/learn-generations-panel";
import { LearnExploreCourses } from "@/components/learn-explore-courses";
import { LearnHowItWorks } from "@/components/learn-how-it-works";
import { api, CourseCandidate, CourseJobResponse } from "@/lib/api";
import { readTrackedJobId, writeTrackedJobId } from "@/lib/tracked-job";

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
  // Topic + start time for the tracked job, kept locally so the panel can show
  // an elapsed timer immediately — before the 4s `myJobs` poll catches up.
  const [trackedTopic, setTrackedTopic] = useState<string | null>(null);
  const [trackedStartAtMs, setTrackedStartAtMs] = useState<number | null>(null);

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
        setTrackedTopic(input.topic);
        setTrackedStartAtMs(Date.now());
        setTopic("");
        setSimilar(null);
      }
    },
  });

  const jobStatus = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.getJob(jobId as number),
    enabled: jobId !== null,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" || query.state.data?.status === "running" ? 2000 : false,
  });

  // A tracked job that no longer resolves (stale localStorage ID after a DB
  // reset, or a dedup job that finished and got pruned) must not strand the
  // page on a phantom "Queued" box — drop it so the form is usable again.
  // Only 404s clear: transient network errors keep the tracking + error text.
  // Adjusting state during render (rather than in an effect) is the documented
  // React pattern for deriving state from a query change and avoids a
  // cascading render (react-hooks/set-state-in-effect).
  const trackedJobMissing =
    jobStatus.isError && jobId !== null && jobStatus.error instanceof Error
    && jobStatus.error.message.startsWith("404");
  const [clearedMissingJobId, setClearedMissingJobId] = useState<number | null>(null);
  if (trackedJobMissing && clearedMissingJobId !== jobId) {
    setClearedMissingJobId(jobId);
    writeTrackedJobId(null);
    setJobId(null);
    setTrackedTopic(null);
    setTrackedStartAtMs(null);
  }

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

  const busy = createCourse.isPending || jobStatus.data?.status === "pending" || jobStatus.data?.status === "running";

  function trackJob(id: number) {
    const job = myJobs.data?.find((j) => j.id === id);
    setJobId(id);
    writeTrackedJobId(id);
    setTrackedTopic(job?.topic_raw ?? null);
    setTrackedStartAtMs(job ? new Date(job.created_at).getTime() : Date.now());
  }

  function startOver() {
    writeTrackedJobId(null);
    setJobId(null);
    setSimilar(null);
    setTrackedTopic(null);
    setTrackedStartAtMs(null);
    createCourse.reset();
  }

  function submitTopic() {
    if (!busy && topic.trim()) createCourse.mutate({ topic: topic.trim() });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-10 px-6 py-10">
      <LearnHero
        topic={topic}
        onTopicChange={setTopic}
        onSubmit={submitTopic}
        busy={busy}
        isPending={createCourse.isPending}
        isError={createCourse.isError}
      >
        {similar && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              We found {similar.candidates.length} similar course
              {similar.candidates.length > 1 ? "s" : ""} for{" "}
              <span className="font-medium text-foreground">{"\u201C"}{similar.topic}{"\u201D"}</span>.
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
                    setTrackedTopic(c.topic_raw);
                    setTrackedStartAtMs(Date.now());
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
      </LearnHero>

      <LearnGenerationsPanel
        jobs={myJobs.data ?? []}
        trackedJobId={jobId}
        trackedTopic={trackedTopic}
        trackedStatus={jobId !== null ? jobStatus.data?.status ?? "pending" : null}
        trackedError={jobStatus.data?.error ?? null}
        trackedStartAtMs={trackedStartAtMs}
        pendingTopic={createCourse.isPending ? topic.trim() || null : null}
        onTrack={trackJob}
        onRetry={startOver}
      />

      {jobStatus.isError && !trackedJobMissing && (
        <p className="text-sm text-destructive">Failed to check course generation status. Please try again.</p>
      )}

      <LearnExploreCourses />

      <LearnHowItWorks />
    </div>
  );
}

function SimilarCourseRow({ candidate, onTrack }: { candidate: CourseCandidate; onTrack: () => void }) {
  const published = candidate.course_url;
  const content = (
    <Card className="spotlight-border transition-colors hover:bg-card/80">
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{candidate.topic_raw}</p>
          {published && candidate.module_count !== null && (
            <p className="text-xs text-muted-foreground">
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
