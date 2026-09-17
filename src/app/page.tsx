import Link from "next/link";
import { BrandLogo } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  CircleCheck,
  MessageCircleQuestion,
  Repeat,
  Flame,
  FileDown,
  Compass,
} from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Name a topic",
    body: "“Italian cooking”, “Python for beginners”, “Marketing basics” — anything you’re curious about.",
  },
  {
    n: "02",
    title: "Knovolve builds the course",
    body: "Modules, chapters, examples and quizzes assembled into a real syllabus in 10–15 minutes.",
  },
  {
    n: "03",
    title: "Learn, get quizzed, adjust",
    body: "Read at your pace. Quizzes flag the concepts you haven’t got yet, and the course adapts.",
  },
];

const FEATURES = [
  {
    icon: Compass,
    title: "A syllabus, not a wall of text",
    body: "Every course is broken into modules and chapters with worked examples and figures, the way a textbook would structure it — not one long AI ramble.",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    icon: MessageCircleQuestion,
    title: "A tutor who’s read your course",
    body: "Ask questions from inside any chapter and get answers grounded in what you’re actually learning.",
    span: "",
  },
  {
    icon: CircleCheck,
    title: "Quizzes that find the gaps",
    body: "Instant feedback, plus a running map of which concepts are solid and which need another pass.",
    span: "",
  },
  {
    icon: Flame,
    title: "Streaks that hold you to it",
    body: "Your progress and daily streak carry over every time you come back.",
    span: "",
  },
  {
    icon: Repeat,
    title: "Courses that keep growing",
    body: "Curious about more? Extend any course with new modules whenever you want.",
    span: "",
  },
  {
    icon: FileDown,
    title: "Take it with you",
    body: "Export a finished course to PDF and read it without a connection.",
    span: "sm:col-span-2",
  },
];

export default function Home() {
  return (
    <div className="bg-grain relative flex flex-1 flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo className="size-7" />
          <span className="font-display text-lg font-medium tracking-tight">Knovolve</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Log in
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>
            Get started
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6">
        {/* Hero — asymmetric: copy left, a live-feeling product mockup right. */}
        <section className="grid gap-14 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
          <div className="max-w-xl">
            <h1 className="font-display text-[2.75rem] leading-[1.05] font-medium tracking-tight sm:text-6xl">
              Turn curiosity into a course you’ll actually finish
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
              Tell Knovolve what you want to learn. It writes a structured
              course around it — lessons, examples, quizzes — and adjusts as
              you go.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-7 text-base" nativeButton={false} render={<Link href="/register" />}>
                Get started free
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7 text-base" nativeButton={false} render={<Link href="/login" />}>
                Log in
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No teaching experience needed. Just bring a topic.
            </p>
          </div>

          <HeroMockup />
        </section>

        {/* How it works — a genuine 3-step sequence, so numbering is earned. */}
        <section className="border-t border-border py-16 lg:py-20">
          <h2 className="font-display max-w-sm text-3xl font-medium tracking-tight">
            From topic to finished course
          </h2>
          <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.n} className="relative">
                <span className="font-display text-brand-gradient text-3xl font-medium">
                  {step.n}
                </span>
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-3 -right-4 hidden h-px w-8 bg-border sm:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Features — bento, not a row of identical cards. */}
        <section className="border-t border-border py-16 lg:py-20">
          <h2 className="font-display max-w-sm text-3xl font-medium tracking-tight">
            Built like a course, not a chatbot transcript
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`spotlight-border group flex flex-col justify-between gap-6 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 ${f.span}`}
              >
                <f.icon className="text-brand size-5" strokeWidth={1.75} />
                <div>
                  <h3 className="font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border py-16 lg:py-24">
          <div className="bg-grain relative overflow-hidden rounded-3xl px-8 py-14 text-center ring-1 ring-foreground/10 sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(38rem 22rem at 50% 120%, color-mix(in oklch, var(--brand) 22%, transparent), transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display mx-auto max-w-md text-3xl font-medium tracking-tight sm:text-4xl">
                Pick something you’ve been meaning to learn
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
                Free to start. Your first course is ready in about 10–15 minutes.
              </p>
              <Button size="lg" className="mt-8 h-12 px-8 text-base" nativeButton={false} render={<Link href="/register" />}>
                Get started free
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground">
            <BrandLogo className="size-5" />
            Knovolve
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Knovolve. Built for people who like finishing what they start.
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(26rem 20rem at 70% 20%, color-mix(in oklch, var(--brand-accent) 20%, transparent), transparent 70%)",
        }}
      />
      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 shadow-brand">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive/60" />
            <span className="size-2 rounded-full bg-[oklch(0.75_0.15_85)]" />
            <span className="size-2 rounded-full bg-brand-accent" />
          </div>
          <span className="text-xs text-muted-foreground">Generating “Marine biology”</span>
        </div>
        <ul className="mt-4 space-y-3">
          {[
            { m: "Module 1 · Ocean ecosystems", pct: 100 },
            { m: "Module 2 · Marine life adaptation", pct: 100 },
            { m: "Module 3 · Coral reef biology", pct: 62 },
            { m: "Module 4 · Human impact & conservation", pct: 8 },
          ].map((row) => (
            <li key={row.m}>
              <div className="flex items-center justify-between text-sm">
                <span className={row.pct < 100 ? "text-muted-foreground" : ""}>{row.m}</span>
                <span className="font-mono text-xs text-muted-foreground">{row.pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-[width]"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-paper-foreground">
          <MessageCircleQuestion className="size-4 shrink-0" strokeWidth={1.75} />
          <p className="text-xs leading-5">
            “Why do reef fish school in some regions but not others?” — asked from Chapter 3
          </p>
        </div>
      </div>
    </div>
  );
}
