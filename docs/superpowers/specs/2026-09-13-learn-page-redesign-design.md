# Learn page redesign

Date: 2026-09-13

## Problem

`src/app/(app)/learn/page.tsx` is a near-empty, vertically-centered card with a topic
input, a raw job-status row, and a list of other jobs. It reads as a prototype: no visual
hierarchy, no discovery affordance, no explanation of what happens after you submit, and
an in-flight experience that is a single line of text. It is the primary entry point for
the product's core action (generating a course), so it should feel finished.

## Goal

Turn `/learn` into a real landing surface while preserving every existing behavior:

- Clear hero + prominent topic input.
- Curated example-topic chips that fill the input.
- A production-grade generation-status card (indeterminate progress, elapsed time when
  known, leave-safe copy, retry on failure).
- An "Explore public courses" grid for users who don't have a topic in mind.
- A short "How it works" explainer.
- Retain existing similar-course dedup prompt and other-in-progress jobs list, restyled.

## Non-goals

- No backend changes, no new API endpoints.
- No server-component rewrite (the `(app)` layout gates children behind a client mount
  check, so all of this stays client-side).
- No new dependencies.
- No change to auth, job tracking semantics, or the course-generation flow.

## Approach

Split the page into small presentational units, keeping query/mutation orchestration and
all existing state logic in `page.tsx`. Repo convention is flat files under
`src/components/`, so new components live there (not a subdirectory).

New/changed files:

- `src/app/(app)/learn/page.tsx` — orchestration only (queries, mutations, tracked-job
  state, redirects). Passes data/handlers down.
- `src/components/learn-hero.tsx` — headline, subhead, topic form, error text, example
  chips. Owns the controlled input value + chips data. Props: `topic`, `onTopicChange`,
  `onSubmit`, `busy`, `isError`, `isPending`.
- `src/components/learn-generation-status.tsx` — status card for the tracked job.
  Props: `status`, `error`, `isLoading`, `startedAt` (`created_at` ISO string or null),
  `onRetry`.
- `src/components/learn-how-it-works.tsx` — static 3-step explainer, no props.
- `src/components/learn-explore-courses.tsx` — public-course grid. Owns its own
  `useQuery(["learnPublicCourses"])`; renders skeleton/empty/error itself. No props.
- `src/app/(app)/learn/loading.tsx` — update skeleton to the new layout.

`SimilarCourseRow` and `OtherJobRow` stay in `page.tsx` (small, tightly bound to page
state) and are restyled with the new spacing.

## Page layout

Top-to-bottom, container `mx-auto w-full max-w-3xl flex-1 px-6 py-10 space-y-10`
(replacing the old `max-w-2xl ... justify-center py-16`). The page scrolls; nothing is
vertically centered.

1. **Hero + input** (`learn-hero.tsx`)
   - `text-3xl font-semibold tracking-tight` headline, `text-muted-foreground` subhead.
   - Form: `Input` + primary `Start` button (brand-gradient default variant already in
     `ui/button.tsx`). `autoFocus` retained. Enter submits; submit blocked while `busy`
     or empty.
   - `createCourse.isError` shows `text-destructive` message under the form.
   - Below the form: label "Try one of these" and 6 static chips (buttons, `variant="outline"`,
     `size="sm"`). Clicking a chip **fills the input and focuses it** (does not submit), so
     the user can edit before generating. `disabled` while `busy`.
   - Curated chips: "Linear algebra for ML", "React hooks in depth", "SQL joins",
     "Bayesian statistics", "Rust ownership", "System design basics".
   - The `similar` prompt renders inline directly under the form (inside the hero card),
     restyled; behavior unchanged.

2. **Generation status** (`learn-generation-status.tsx`), only when `jobId !== null`.
   - Card with `JobBadge` (moved here from page) and contextual copy:
     - loading/no data → "Starting…"
     - `failed` → `error ?? "Generation failed"` + `Try again` button (`onRetry`).
     - ready → "Ready" (redirect fires from page effect first; transient).
     - pending/running → "Building your course…" + "usually takes 10–15 minutes — you can
       leave this page and come back."
   - For pending/running, render an **indeterminate** progress bar: a `h-1.5 rounded-full
     bg-muted` track with a colored segment using `bg-brand-gradient` animated via
     `animate-pulse` (no fake percentage — the API returns no progress fraction).
   - Elapsed time (e.g. "3m 12s") shown when known: `startedAt` is derived by the page
     from `myJobs` (the tracked job's `created_at`) and passed down; the component owns a
     1s interval tick and formats the delta. Hidden when `startedAt` is null.
   - On `jobStatus.isError` (non-404) show the existing destructive status-check error.

3. **Other in-progress jobs** (`page.tsx`), only when non-empty. Unchanged filtering
   (excludes tracked job; pending/running only). Restyled rows.

4. **Explore public courses** (`learn-explore-courses.tsx`).
   - `useQuery(["learnPublicCourses"], () => api.getPublicCourses({ page: 1, limit: 6,
     sort: "date", order: "desc" }))`, key distinct from `/courses` page queries.
   - Section heading + responsive grid `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` of
     `Card`s linking to `/courses/{topic_slug}`; show topic + "N modules · M chapters".
   - Loading → 3 skeleton cards. Error → destructive text. Empty → `EmptyState`.
   - This section sits below the generation surface so it never competes with the primary
     action.

5. **How it works** (`learn-how-it-works.tsx`)
   - 3 columns (`grid gap-4 sm:grid-cols-3`), each with a lucide icon, step number/heading,
     one-line description: Pick a topic → We build the course → Learn & practice.

## Data & state

- Reuse existing `createCourse` mutation, `jobStatus` query (2s poll), `myJobs` query
  (4s poll), tracked-job localStorage helpers, 404 self-heal, and success redirect
  verbatim from current `page.tsx`.
- New query: `learn-explore-courses.tsx` public courses (limit 6).
- New local state: a 1s interval tick owned by `learn-generation-status.tsx`, enabled
  only while the tracked job is pending/running, used to compute elapsed from `startedAt`.
- No changes to `src/lib/tracked-job.ts` or `src/lib/api.ts`.

## Error / empty / loading states

- `learn/loading.tsx` updated to skeleton the hero, status card, and course grid.
- `learn/error.tsx` unchanged.
- Each new section owns its loading/error/empty rendering; no page-level blank states.

## Accessibility

- Chips are real `<button type="button">`; the form remains a `<form>`. Input keeps its
  visible label association via `aria-label` / surrounding heading context.
- Progress bar is `role="progressbar"` `aria-valuetext="In progress"` (indeterminate, no
  `aria-valuenow`).
- Decorative icons get `aria-hidden`.

## Verification

- `pnpm lint`
- `pnpm test` (vitest; existing tests must still pass)
- `pnpm build`
- Manual: submit a topic, confirm status card + redirect; confirm chips fill the input;
  confirm explore grid and how-it-works render at `sm`/`lg` breakpoints; toggle dark mode.

## Risks

- Page currently has uncommitted theme-migration edits (semantic tokens). Build on top;
  do not revert them, and stage only files this task touches.
- Elapsed timer must not cause re-render churn across the whole page; the 1s tick lives
  inside `learn-generation-status.tsx` so only that subtree updates.
