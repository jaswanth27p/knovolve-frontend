import Link from "next/link";
import { BrandLogo } from "@/components/sidebar-nav";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-20">
      <main className="flex w-full max-w-2xl flex-col items-center gap-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo className="size-16 text-foreground" />
          <span className="rounded-full border border-black/10 px-3 py-1 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            Learn anything, at your pace
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn curiosity into a course
          </h1>
          <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Tell Knovolve what you want to learn and get a complete course&nbsp;— clear lessons, real examples, helpful pictures, and quizzes&nbsp;— ready in about 10–15 minutes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full border border-black/10 px-7 transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
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
              className="rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
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
              className="rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
            </li>
          ))}
        </ul>

        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Free to start. No teaching experience needed — just bring something you want to learn.
        </p>
      </main>
    </div>
  );
}