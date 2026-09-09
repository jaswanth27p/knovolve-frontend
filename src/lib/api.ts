const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// Access/refresh tokens live only in httpOnly cookies the backend sets on
// /auth/register, /auth/login and /auth/refresh — never in JS-readable
// storage, so an XSS payload can't read them. The browser attaches them
// automatically on every request below via `credentials: "include"`.
//
// This custom header is required by the backend on every cookie-authenticated
// request (see app/auth/dependencies.py's require_csrf_header): SameSite=Strict
// already blocks the cookie from riding along on a cross-site request, but a
// plain cross-site form POST also can't attach a custom header, and a
// cross-site fetch that tries to would trigger a CORS preflight the backend's
// origin allowlist rejects. Defense in depth against CSRF.
const CSRF_HEADERS = { "X-Requested-With": "knovolve" } as const;

export interface AuthResponse {
  token_type: string;
}

export interface ChapterSummary {
  id: number;
  title: string;
  objective: string;
}

export interface ModuleSummary {
  id: number;
  title: string;
  objective: string;
  chapters: ChapterSummary[];
}

export interface ChapterContentExample {
  prompt: string;
  walkthrough: string;
}

export interface ChapterContentSectionEvent {
  type: "section_ready";
  order: number;
  heading: string;
  kind: "intro" | "teaching";
  body_markdown: string;
  examples: ChapterContentExample[];
  diagram_status: "pending" | "ready" | "failed" | null;
  diagram_image_url: string | null;
}

export type ChapterContentEvent =
  | ChapterContentSectionEvent
  | { type: "diagram_ready"; order: number; diagram_image_url: string }
  | { type: "diagram_failed"; order: number }
  | { type: "done" }
  | { type: "error"; message: string };

export interface CourseSummary {
  id: number;
  topic_slug: string;
  topic_raw: string;
  modules: ModuleSummary[];
}

export interface CourseJobResponse {
  status: "exists" | "pending" | "running" | "succeeded" | "failed";
  job_id: number | null;
  course: CourseSummary | null;
  error: string | null;
}

export interface TrackedCourse {
  id: number;
  topic_slug: string;
  topic_raw: string;
  status: "in_progress" | "completed";
  progress: number;
  last_opened_at: string;
  module_count: number;
  chapter_count: number;
  content_ready: boolean;
}

export interface DashboardResponse {
  in_progress: TrackedCourse[];
  completed: TrackedCourse[];
  in_progress_count: number;
  completed_count: number;
  total_count: number;
}

export interface PublicCourse {
  id: number;
  topic_slug: string;
  topic_raw: string;
  module_count: number;
  chapter_count: number;
}

export interface CourseDetailModule {
  id: number;
  title: string;
  objective: string;
  chapters: { id: number; title: string; objective: string }[];
}

export interface CourseDetail {
  id: number;
  topic_slug: string;
  topic_raw: string;
  modules: CourseDetailModule[];
}

// Non-sensitive UI flag only — never trusted for actual authorization.
// Guards read it to decide whether to render the optimistic "logged in"
// shell before the first request round-trips; the real verdict is always
// enforced by the backend via the httpOnly cookies on each API call.
function setLoggedInFlag(value: boolean) {
  try {
    if (value) localStorage.setItem("logged_in", "1");
    else localStorage.removeItem("logged_in");
  } catch {
    // localStorage unavailable (SSR, privacy mode) - guards fall back to
    // the request-level 401 check instead.
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Requested-With", CSRF_HEADERS["X-Requested-With"]);

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  if (!isRetry && resp.status === 401 && !["/auth/refresh", "/auth/login", "/auth/register"].includes(path)) {
    if (await refreshAccessToken()) {
      return request<T>(path, options, true); // retry original request once, no further refresh
    }
  }
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  if (resp.status === 204) return undefined as unknown as T;
  return resp.json();
}

// The access-token cookie is short-lived and the refresh-token cookie
// rotates on every use — the backend treats a second presentation of an
// already-rotated token as reuse and revokes the whole family. Multiple
// requests can independently 401 at once (e.g. the courses page's two
// parallel queries, or a dev-mode double-invoke) and each would otherwise
// race to redeem the same refresh cookie. Share one in-flight refresh across
// all concurrent callers instead.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
      credentials: "include",
    });
    if (!refreshResp.ok) {
      // Refresh cookie is invalid/expired/revoked (e.g. rotation-reuse
      // detection) — the session is unrecoverable. Send the user back to
      // login; the backend already cleared the cookies on this response.
      setLoggedInFlag(false);
      if (typeof window !== "undefined") window.location.href = "/login";
      return false;
    }
    return true;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export interface AssignmentQuestion {
  id: number;
  order: number;
  type: "mcq" | "true_false" | "free_text";
  text: string;
  options: string[] | null;
  concept_tag: string;
  difficulty: string;
}

export interface AssignmentStatus {
  status: "generating" | "ready" | "failed";
  id: number | null;
  questions: AssignmentQuestion[] | null;
  error: string | null;
}

export interface SubmitAnswer {
  question_id: number;
  answer: string;
}

export interface AttemptSubmitResult {
  attempt_id: number;
  status: string;
}

export interface AttemptAnswerResult {
  question_id: number;
  is_correct: boolean;
  feedback: string;
}

export interface ConceptScoreResult {
  concept_tag: string;
  correct: number;
  total: number;
}

export interface AttemptStatus {
  status: "grading" | "graded" | "failed";
  overall_score: number | null;
  answers: AttemptAnswerResult[] | null;
  concept_scores: ConceptScoreResult[] | null;
  error: string | null;
}

export const api = {
  register: (email: string, password: string): Promise<AuthResponse> =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setLoggedInFlag(true);
    return result;
  },
  createCourse: (topic: string): Promise<CourseJobResponse> =>
    request<CourseJobResponse>("/courses", { method: "POST", body: JSON.stringify({ topic }) }),
  getJob: (jobId: number): Promise<CourseJobResponse> => request<CourseJobResponse>(`/courses/jobs/${jobId}`),
  getDashboard: (): Promise<DashboardResponse> => request<DashboardResponse>("/me/dashboard"),
  getMyCourses: (): Promise<TrackedCourse[]> => request<TrackedCourse[]>("/me/courses"),
  getPublicCourses: (): Promise<PublicCourse[]> => request<PublicCourse[]>("/courses"),
  deleteMyCourse: (courseId: number): Promise<void> =>
    request<void>(`/me/courses/${courseId}`, { method: "DELETE" }),
  getCourse: (slug: string): Promise<CourseDetail> => request<CourseDetail>(`/courses/${slug}`),
  getChapterAssignment: (slug: string, chapterId: number): Promise<AssignmentStatus> =>
    request<AssignmentStatus>(`/courses/${slug}/chapters/${chapterId}/assignment`),
  getModuleAssignment: (slug: string, moduleId: number): Promise<AssignmentStatus> =>
    request<AssignmentStatus>(`/courses/${slug}/modules/${moduleId}/assignment`),
  createModuleAssignment: (slug: string, moduleId: number): Promise<AssignmentStatus> =>
    request<AssignmentStatus>(`/courses/${slug}/modules/${moduleId}/assignment`, { method: "POST" }),
  submitAttempt: (slug: string, assignmentId: number, answers: SubmitAnswer[]): Promise<AttemptSubmitResult> =>
    request<AttemptSubmitResult>(`/courses/${slug}/assignments/${assignmentId}/attempts`, {
      method: "POST", body: JSON.stringify({ answers }),
    }),
  getAttempt: (slug: string, assignmentId: number, attemptId: number): Promise<AttemptStatus> =>
    request<AttemptStatus>(`/courses/${slug}/assignments/${assignmentId}/attempts/${attemptId}`),
  streamChapterContent,
  logout,
  isLoggedIn,
};

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem("logged_in") === "1";
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
    credentials: "include",
  }).catch(() => undefined);
  setLoggedInFlag(false);
}

export async function streamChapterContent(
  courseSlug: string,
  chapterId: number,
  onEvent: (event: ChapterContentEvent) => void,
): Promise<void> {
  async function attempt(): Promise<Response> {
    return fetch(`${API_BASE}/courses/${courseSlug}/chapters/${chapterId}/content`, {
      headers: CSRF_HEADERS,
      credentials: "include",
    });
  }

  let resp = await attempt();
  if (resp.status === 401) {
    // The access-token cookie expired — refresh once and retry, mirroring
    // `request`.
    if (await refreshAccessToken()) {
      resp = await attempt();
    }
  }
  if (!resp.ok || !resp.body) throw new Error(`${resp.status}: ${await resp.text()}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line) as ChapterContentEvent);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as ChapterContentEvent);
}
