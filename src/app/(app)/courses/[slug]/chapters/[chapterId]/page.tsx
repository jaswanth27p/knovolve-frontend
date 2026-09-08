"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { api, ChapterContentEvent, ChapterContentSectionEvent } from "@/lib/api";

// The LLM sometimes repeats the section heading as the first line of
// body_markdown, which would otherwise render twice (once from our own <h2>,
// once from ReactMarkdown). Drop it only when it duplicates section.heading.
function stripLeadingDuplicateHeading(markdown: string, heading: string): string {
  const match = markdown.match(/^\s*#{1,6}\s+(.+?)\s*\n/);
  if (!match) return markdown;
  if (match[1].trim().toLowerCase() !== heading.trim().toLowerCase()) return markdown;
  return markdown.slice(match[0].length);
}

export default function ChapterPage() {
  const router = useRouter();
  const params = useParams<{ slug: string; chapterId: string }>();
  const [sections, setSections] = useState<Record<number, ChapterContentSectionEvent>>({});
  const [error, setError] = useState<string | null>(null);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!api.isLoggedIn()) {
      router.push("/login");
      return;
    }
    const key = `${params.slug}:${params.chapterId}`;
    if (startedFor.current === key) return;
    startedFor.current = key;
    setSections({});
    setError(null);

    api
      .streamChapterContent(params.slug, Number(params.chapterId), (event: ChapterContentEvent) => {
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
        }
      })
      .catch(() => setError("Failed to load chapter content."));
  }, [params.slug, params.chapterId, router]);

  const ordered = Object.values(sections).sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-8 pb-20">
      {error && <p className="text-red-600">{error}</p>}
      {ordered.map((section) => (
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
      {ordered.length === 0 && !error && <p>Loading chapter…</p>}
    </div>
  );
}
