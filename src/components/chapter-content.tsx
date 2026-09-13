"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import "highlight.js/styles/github-dark.css";
import { Button } from "@/components/ui/button";
import { ChapterContentSkeleton } from "@/components/skeletons";
import { api, ChapterContentEvent, ChapterContentSectionEvent, ChapterVersionSection } from "@/lib/api";
import { notifyCourseStatusChanged } from "@/lib/export-status";

// The LLM sometimes repeats the section heading as the first line of
// body_markdown, which would otherwise render twice (once from our own <h2>,
// once from ReactMarkdown). Drop it only when it duplicates section.heading.
function stripLeadingDuplicateHeading(markdown: string, heading: string): string {
  const match = markdown.match(/^\s*#{1,6}\s+(.+?)\s*\n/);
  if (!match) return markdown;
  if (match[1].trim().toLowerCase() !== heading.trim().toLowerCase()) return markdown;
  return markdown.slice(match[0].length);
}

function SectionsView({ sections }: { sections: (ChapterContentSectionEvent | ChapterVersionSection)[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.order} className="space-y-3">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {stripLeadingDuplicateHeading(section.body_markdown, section.heading)}
          </ReactMarkdown>
          {section.examples.map((ex, i) => (
            <div key={i} className="border-l-2 pl-3 space-y-1">
              <p className="font-medium">{ex.prompt}</p>
              <div className="text-sm text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {ex.walkthrough}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {section.diagram_status === "pending" && <p className="text-sm">Rendering diagram…</p>}
          {section.diagram_status === "ready" && section.diagram_image_url && (
            <div className="inline-block rounded-md bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={section.diagram_image_url} alt={section.heading} />
            </div>
          )}
          {section.diagram_status === "failed" && (
            <p className="text-sm text-muted-foreground">Diagram unavailable.</p>
          )}
        </section>
      ))}
    </>
  );
}

interface ChapterContentProps {
  slug: string;
  chapterId: number;
  // null means "follow the latest" — the live streaming view, which may still
  // be generating. A number pins the view to one specific past/finished
  // version (or a still-generating V2+ remediation, shown with a loading UI).
  version: number | null;
}

export function ChapterContent({ slug, chapterId, version }: ChapterContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const viewingPast = version !== null;

  const [sections, setSections] = useState<Record<number, ChapterContentSectionEvent>>({});
  const [error, setError] = useState<string | null>(null);
  const [streamDone, setStreamDone] = useState(false);
  const [remediating, setRemediating] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const versionsQuery = useQuery({
    queryKey: ["chapter-versions", slug, chapterId],
    queryFn: () => api.getChapterVersions(slug, chapterId),
    // Poll while a V2+ remediation is being authored so the nav/latest state
    // picks it up without a manual refresh.
    refetchInterval: 5000,
  });
  const versions = versionsQuery.data ?? [];
  const latest = versions.length > 0 ? versions[versions.length - 1].version : null;
  const current = version ?? latest;

  // Reset per-chapter/per-version view state during render rather than in an
  // effect (React's documented pattern for "adjusting state when a prop
  // changes") — a fresh mount already starts blank. The "live" route keys on
  // the latest version so that when a new V2+ remediation appears, the stale
  // previous-version sections are cleared instead of being left on screen
  // looking finished.
  const followVersion = version !== null ? version : (latest ?? "init");
  const contentKey = `${slug}:${chapterId}:${followVersion}`;
  const [prevContentKey, setPrevContentKey] = useState(contentKey);
  if (prevContentKey !== contentKey) {
    setPrevContentKey(contentKey);
    setSections({});
    setError(null);
    setStreamDone(false);
    setRemediating(false);
  }

  const basePath = `/courses/${slug}/chapters/${chapterId}`;
  const versionHref = (v: number) => `${basePath}/versions/${v}`;
  // The "latest" version always lives on the base route so that following it
  // picks up future remediation versions automatically.
  const hrefForVersion = (v: number) => (latest !== null && v === latest ? basePath : versionHref(v));
  const nav =
    versions.length > 1 && current !== null && latest !== null ? (
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {current > 1 ? (
          <Link
            href={hrefForVersion(current - 1)}
            aria-label="Previous version"
            className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <ChevronLeft className="size-4" />
          </Link>
        ) : (
          <span className="rounded-md p-1 opacity-30">
            <ChevronLeft className="size-4" />
          </span>
        )}
        <span>
          Version {current} of {latest}
          {current === 1 ? " · original" : " · personalized review"}
        </span>
        {current < latest ? (
          <Link
            href={hrefForVersion(current + 1)}
            aria-label="Next version"
            className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="rounded-md p-1 opacity-30">
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    ) : null;

  // Resolve the module that owns this chapter so the top-nav back link goes
  // to the module rather than the course.
  const courseQuery = useQuery({
    queryKey: ["course", slug],
    queryFn: () => api.getCourse(slug),
  });
  const ownerModule = courseQuery.data?.modules.find((m) => m.chapters.some((c) => c.id === chapterId));

  const pastVersion = useQuery({
    queryKey: ["chapter-version", slug, chapterId, version],
    queryFn: () => api.getChapterVersion(slug, chapterId, version as number),
    enabled: viewingPast,
    refetchInterval: (query) => (query.state.data?.status === "generating" ? 3000 : false),
  });

  useEffect(() => {
    if (viewingPast) return; // static past-version view — no live stream to open
    if (!api.isLoggedIn()) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    // Content generation is resumable server-side: stream_chapter_content
    // replays whatever's already persisted (instant, no LLM calls) and only
    // generates the outline entries that are still missing. So re-opening this
    // stream — whether from a fresh mount after navigating away mid-generation,
    // or this retry loop — always picks up exactly where the last one left off.
    function run() {
      let sawGenerating = false;
      api
        .streamChapterContent(slug, chapterId, (event: ChapterContentEvent) => {
          if (event.type === "section_ready") {
            setSections((prev) => ({ ...prev, [event.order]: event }));
          } else if (event.type === "diagram_ready") {
            setSections((prev) => {
              const existing = prev[event.order];
              if (!existing) return prev;
              return {
                ...prev,
                [event.order]: { ...existing, diagram_status: "ready", diagram_image_url: event.diagram_image_url },
              };
            });
          } else if (event.type === "diagram_failed") {
            setSections((prev) => {
              const existing = prev[event.order];
              if (!existing) return prev;
              return { ...prev, [event.order]: { ...existing, diagram_status: "failed" } };
            });
          } else if (event.type === "error") {
            setError(event.message);
          } else if (event.type === "done") {
            setStreamDone(true);
            notifyCourseStatusChanged(queryClient, slug);
          } else if (event.type === "generating") {
            sawGenerating = true;
          }
        }, controller.signal)
        .then(() => {
          if (cancelled) return;
          if (sawGenerating) {
            setRemediating(true);
            retryTimer.current = setTimeout(run, 3000);
          } else {
            setStreamDone(true);
          }
        })
        .catch((err) => {
          if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
          setError("Failed to load chapter content.");
        });
    }
    run();

    return () => {
      cancelled = true;
      controller.abort();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
    // `latest` is a dependency so that when the versions poll discovers a new
    // V2+ remediation while the learner sits on the live route, the stream
    // re-opens and follows it (instead of leaving stale V1 content + a
    // premature assignment button on screen).
  }, [slug, chapterId, queryClient, router, viewingPast, latest]);

  // Diagram fallback: the live SSE tail can time out while the single render
  // worker is saturated, leaving sections at `diagram_status: "pending"` with
  // no further events (the UI sticks on "Rendering diagram…"). Poll the
  // persisted version until every pending diagram resolves.
  const hasPendingDiagram = Object.values(sections).some((s) => s.diagram_status === "pending");
  useEffect(() => {
    if (viewingPast || !streamDone || latest === null || !hasPendingDiagram) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const detail = await api.getChapterVersion(slug, chapterId, latest);
        if (cancelled) return;
        setSections((prev) => {
          const next = { ...prev };
          for (const s of detail.sections) {
            const existing = next[s.order];
            if (existing && existing.diagram_status === "pending" && s.diagram_status !== "pending") {
              next[s.order] = {
                ...existing,
                diagram_status: s.diagram_status,
                diagram_image_url: s.diagram_image_url,
              };
            }
          }
          return next;
        });
        attempts += 1;
        const stillPending = detail.sections.some((s) => s.diagram_status === "pending");
        if (!cancelled && stillPending && attempts < 60) timer = setTimeout(poll, 5000);
      } catch {
        // Best-effort: leave the pending indicator as-is on a transient error.
      }
    };
    timer = setTimeout(poll, 3000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [viewingPast, streamDone, latest, hasPendingDiagram, slug, chapterId]);

  const ordered = Object.values(sections).sort((a, b) => a.order - b.order);
  const pastOrdered = [...(pastVersion.data?.sections ?? [])].sort((a, b) => a.order - b.order);
  const assignmentHref = viewingPast ? `${versionHref(version as number)}/assignment` : `${basePath}/assignment`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10 pb-20">
      <Link
        href={ownerModule ? `/courses/${slug}/modules/${ownerModule.id}` : `/courses/${slug}`}
        className="flex w-fit items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        <ArrowLeft className="size-4" />
        {ownerModule ? "Back to module" : "Back to course"}
      </Link>
      {nav && <div>{nav}</div>}

      {viewingPast ? (
        <>
          {pastVersion.isLoading && <ChapterContentSkeleton />}
          {pastVersion.isError && <p className="text-red-600">Failed to load this version.</p>}
          {pastVersion.data?.status === "failed" && (
            <p className="text-red-600">Generation failed: {pastVersion.data.error}</p>
          )}
          {pastVersion.data?.status === "generating" && (
            <div className="space-y-4">
              <ChapterContentSkeleton />
              <p className="text-sm text-muted-foreground">
                This version is still being prepared — it&apos;ll show up here shortly.
              </p>
            </div>
          )}
          <SectionsView sections={pastOrdered} />
          {pastVersion.data?.status === "ready" && (
            <div className="pt-6">
              <Button nativeButton={false} render={<Link href={assignmentHref} />}>
                Take the assignment
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          {error && <p className="text-red-600">{error}</p>}
          <SectionsView sections={ordered} />
          {ordered.length === 0 && !error && remediating && (
            <div className="space-y-4">
              <ChapterContentSkeleton />
              <p className="text-sm text-muted-foreground">
                Preparing a personalized review based on what you missed — this can take a minute, hang tight.
              </p>
            </div>
          )}
          {ordered.length === 0 && !error && !remediating && <ChapterContentSkeleton />}
          {ordered.length > 0 && !streamDone && !error && (
            <p className="text-sm text-muted-foreground">
              Still adding more content — hold on a minute, the rest of this chapter is on its way.
            </p>
          )}
          {streamDone && (
            <div className="pt-6">
              <Button nativeButton={false} render={<Link href={assignmentHref} />}>
                Take the assignment
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
