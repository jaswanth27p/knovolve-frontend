import Link from "next/link";
import { BrandLogo } from "@/components/sidebar-nav";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      <div className="bg-grain relative hidden w-[40%] max-w-md shrink-0 flex-col justify-between overflow-hidden bg-card p-12 pb-16 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(34rem 26rem at 18% 8%, color-mix(in oklch, var(--brand) 24%, transparent), transparent 65%), radial-gradient(28rem 24rem at 100% 100%, color-mix(in oklch, var(--brand-accent) 18%, transparent), transparent 60%)",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <BrandLogo className="size-7" />
          <span className="font-display text-lg font-medium tracking-tight">Knovolve</span>
        </Link>
        <blockquote className="relative">
          <p className="font-display text-2xl leading-snug font-medium tracking-tight">
            “Structured like a course, not a wall of chat.”
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Modules, chapters, quizzes — built around whatever you want to learn next.
          </p>
        </blockquote>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandLogo className="size-7" />
            <span className="font-display text-lg font-medium tracking-tight">Knovolve</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
