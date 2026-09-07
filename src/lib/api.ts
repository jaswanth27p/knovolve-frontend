const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
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

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!isRetry && resp.status === 401 && !["/auth/refresh", "/auth/login", "/auth/register"].includes(path)) {
    if (await refreshAccessToken()) {
      return request<T>(path, options, true); // retry original request once, no further refresh
    }
  }
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  if (resp.status === 204) return undefined as unknown as T;
  return resp.json();
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;
  const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!refreshResp.ok) return false;
  const tokens: TokenResponse = await refreshResp.json();
  setAccessToken(tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  return true;
}

export const api = {
  register: (email: string, password: string): Promise<TokenResponse> =>
    request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string): Promise<TokenResponse> =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  createCourse: (topic: string): Promise<CourseJobResponse> =>
    request<CourseJobResponse>("/courses", { method: "POST", body: JSON.stringify({ topic }) }),
  getJob: (jobId: number): Promise<CourseJobResponse> => request<CourseJobResponse>(`/courses/jobs/${jobId}`),
  getDashboard: (): Promise<DashboardResponse> => request<DashboardResponse>("/me/dashboard"),
  getMyCourses: (): Promise<TrackedCourse[]> => request<TrackedCourse[]>("/me/courses"),
  getPublicCourses: (): Promise<PublicCourse[]> => request<PublicCourse[]>("/courses"),
  deleteMyCourse: (courseId: number): Promise<void> =>
    request<void>(`/me/courses/${courseId}`, { method: "DELETE" }),
  getCourse: (slug: string): Promise<CourseDetail> => request<CourseDetail>(`/courses/${slug}`),
  streamChapterContent,
  logout,
};

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => undefined);
  }
  setAccessToken(null);
  localStorage.removeItem("refresh_token");
}

export async function streamChapterContent(
  courseSlug: string,
  chapterId: number,
  onEvent: (event: ChapterContentEvent) => void,
): Promise<void> {
  async function attempt(): Promise<Response> {
    const headers = new Headers();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${API_BASE}/courses/${courseSlug}/chapters/${chapterId}/content`, { headers });
  }

  let resp = await attempt();
  if (resp.status === 401) {
    // accessToken is module-scoped — lost on hard page reload — but refresh_token
    // survives in localStorage. Refresh once and retry, mirroring `request`.
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
