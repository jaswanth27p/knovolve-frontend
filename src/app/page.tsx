import Link from "next/link";
import { BrandLogo } from "@/components/sidebar-nav";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px] dark:bg-brand/25"
      />
      <main className="relative flex w-full max-w-2xl flex-col items-center gap-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo className="size-16" />
          <span className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-sm text-muted-foreground">
            Learn anything, at your pace
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn <span className="text-brand-gradient">curiosity</span> into a course
          </h1>
          <p className="max-w-lg text-lg leading-8 text-muted-foreground">
            Tell Knovolve what you want to learn and get a complete course&nbsp;— clear lessons, real examples, helpful pictures, and quizzes&nbsp;— ready in about 10–15 minutes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-full bg-brand-gradient px-7 text-white shadow-brand transition-[filter] hover:brightness-110"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full border border-border px-7 transition-colors hover:bg-accent"
          >
            Log in
          </Link>
        </div>

        <ul className="grid w-full gap-3 text-left sm:grid-cols-3">
          {[
            ["1. Tell us your topic", "Type anything — “Italian cooking”, “Python for beginners”, “Marketing basics”."],
            ["2. Get your course", "We organize everything into short, easy-to-follow lessons for you."],
            ["3. Learn and practice", "Read, try quick quizzes, ask questions, and watch your progress grow."],
          ].map(([title, body]) => (
            <li
              key={title}
              className="rounded-lg border border-border bg-card/40 p-4"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>

        <ul className="grid w-full gap-3 text-left sm:grid-cols-2">
          {[
            ["Lessons that make sense", "Every topic is broken into bite-size lessons with examples and visuals."],
            ["Quizzes with instant feedback", "Check what you learned and see exactly what to review next."],
            ["A tutor who knows your course", "Stuck? Ask questions anytime and get answers based on what you're learning."],
            ["Stay motivated", "Track your progress, build streaks, and pick up right where you left off."],
            ["Keep growing your course", "Want more? Add new topics to any course whenever you're curious."],
            ["Learn anywhere", "Save your course as a PDF for offline reading, or explore ready-made courses."],
          ].map(([title, body]) => (
            <li
              key={title}
              className="rounded-lg border border-border bg-card/40 p-4"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>

        <p className="max-w-md text-sm text-muted-foreground">
          Free to start. No teaching experience needed — just bring something you want to learn.
        </p>
      </main>
    </div>
  );
}