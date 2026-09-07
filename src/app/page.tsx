import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="rounded-full border border-black/10 px-3 py-1 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            Adaptive learning
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Knovolve
          </h1>
          <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Type any topic and get a structured, AI-generated course&nbsp;— modules, chapters, worked examples, and concept diagrams&nbsp;— built in minutes, not weeks.
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

        <ul className="mt-8 grid w-full gap-3 text-left sm:grid-cols-3">
          {[
            ["AI-generated", "Courses created from a single topic prompt."],
            ["Progressive", "Content streams in as each section is ready."],
            ["Resumable", "Work survives crashes and reloads."],
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
      </main>
    </div>
  );
}