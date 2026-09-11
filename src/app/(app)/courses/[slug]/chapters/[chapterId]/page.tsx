"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

// Version nav: null `viewVersion` means "follow the latest" (the live
// streaming view below, which may still be generating). A non-null value
// pins the page to a specific past version, fetched as a static payload —
// no streaming needed since a past version is by definition already
// finished. Resets to "latest" whenever the chapter itself changes.
function useVersionNav(slug: string, chapterId: number) {
  // A manually-picked version is tagged with the chapter key it was picked
  // for. If the chapter has since changed (navigated to a different
  // chapter), the stale selection is simply ignored rather than "reset" —
  // no render-time state mutation needed to fall back to "latest".
  const [selection, setSelection] = useState<{ key: string; version: number } | null>(null);
  const key = `${slug}:${chapterId}`;
  const viewVersion = selection && selection.key === key ? selection.version : null;
  const setViewVersion = (version: number | null) =>
    setSelection(version === null ? null : { key, version });

  const versionsQuery = useQuery({
    queryKey: ["chapter-versions", slug, chapterId],
    queryFn: () => api.getChapterVersions(slug, chapterId),
  });
  const versions = versionsQuery.data ?? [];
  const latest = versions.length > 0 ? versions[versions.length - 1].version : null;
  const current = viewVersion ?? latest;

  const nav =
    versions.length > 1 && current !== null && latest !== null ? (
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <button
          type="button"
          aria-label="Previous version"
          disabled={current <= 1}
          onClick={() => setViewVersion(current - 1)}
          className="rounded-md p-1 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-900"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span>
          Version {current} of {latest}
          {current === 1 ? " · original" : " · personalized review"}
        </span>
        <button
          type="button"
          aria-label="Next version"
          disabled={current >= latest}
          onClick={() => setViewVersion(current + 1 === latest ? null : current + 1)}
          className="rounded-md p-1 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-900"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    ) : null;

  return { viewVersion, latest, nav };
}

export default function ChapterPage() {
  const router = useRouter();
  const params = useParams<{ slug: string; chapterId: string }>();
  const chapterId = Number(params.chapterId);
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<Record<number, ChapterContentSectionEvent>>({});
  const [error, setError] = useState<string | null>(null);
  const [streamDone, setStreamDone] = useState(false);
  const [remediating, setRemediating] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset per-chapter view state during render rather than in an effect
  // (React's documented pattern for "adjusting state when a prop changes")
  // — this only fires when navigating from one chapter straight to another
  // without an intervening unmount; a fresh mount already starts blank.
  const contentKey = `${params.slug}:${params.chapterId}`;
  const [prevContentKey, setPrevContentKey] = useState(contentKey);
  if (prevContentKey !== contentKey) {
    setPrevContentKey(contentKey);
    setSections({});
    setError(null);
    setStreamDone(false);
    setRemediating(false);
  }

  const { viewVersion, nav } = useVersionNav(params.slug, chapterId);
  const viewingPast = viewVersion !== null;

  // Resolve the module that owns this chapter so the top-nav back link goes
  // to the module rather than the course.
  const courseQuery = useQuery({
    queryKey: ["course", params.slug],
    queryFn: () => api.getCourse(params.slug),
  });
  const ownerModule = courseQuery.data?.modules.find((m) => m.chapters.some((c) => c.id === chapterId));

  const pastVersion = useQuery({
    queryKey: ["chapter-version", params.slug, chapterId, viewVersion],
    queryFn: () => api.getChapterVersion(params.slug, chapterId, viewVersion as number),
    enabled: viewingPast,
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
    // generates the outline entries that are still missing (see that
    // function's docstring). So re-opening this stream — whether from a
    // fresh mount after navigating away mid-generation, or this retry loop
    // below — always picks up exactly where the last one left off; nothing
    // is lost, and nothing is regenerated from scratch.
    function run() {
      let sawGenerating = false;
      api
        .streamChapterContent(params.slug, chapterId, (event: ChapterContentEvent) => {
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
            notifyCourseStatusChanged(queryClient, params.slug);
          } else if (event.type === "generating") {
            sawGenerating = true;
          }
        }, controller.signal)
        .then(() => {
          // A personalized review (v2+) is still being built by a background
          // job — the backend deliberately doesn't hold this request open
          // for it (see stream_chapter_content), so re-open the stream after
          // a short delay until real sections show up. Bail out if the user
          // has since navigated away (cleanup already aborted the fetch, but
          // that resolves the promise rather than rejecting it).
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
  }, [params.slug, params.chapterId, chapterId, queryClient, router, viewingPast]);

  const ordered = Object.values(sections).sort((a, b) => a.order - b.order);
  const pastOrdered = [...(pastVersion.data?.sections ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10 pb-20">
      <Link
        href={
          ownerModule
            ? `/courses/${params.slug}/modules/${ownerModule.id}`
            : `/courses/${params.slug}`
        }
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
          <SectionsView sections={pastOrdered} />
          {pastVersion.data?.status === "ready" && viewVersion !== null && (
            <div className="pt-6">
              <Button
                nativeButton={false}
                render={<Link href={`/courses/${params.slug}/chapters/${params.chapterId}/assignment?version=${viewVersion}`} />}
              >
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
              <Button nativeButton={false} render={<Link href={`/courses/${params.slug}/chapters/${params.chapterId}/assignment`} />}>
                Take the assignment
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
