"use client";
import { useParams } from "next/navigation";
import { ChapterContent } from "@/components/chapter-content";

export default function ChapterPage() {
  const params = useParams<{ slug: string; chapterId: string }>();
  return <ChapterContent slug={params.slug} chapterId={Number(params.chapterId)} version={null} />;
}
