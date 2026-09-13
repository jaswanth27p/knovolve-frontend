"use client";
import { useParams } from "next/navigation";
import { ChapterContent } from "@/components/chapter-content";

export default function ChapterVersionPage() {
  const params = useParams<{ slug: string; chapterId: string; version: string }>();
  const version = Number(params.version);
  return <ChapterContent slug={params.slug} chapterId={Number(params.chapterId)} version={version} />;
}
