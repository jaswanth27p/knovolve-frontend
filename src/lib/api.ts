const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (resp.status === 401 && !["/auth/refresh", "/auth/login", "/auth/register"].includes(path)) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshResp.ok) {
        const tokens = await refreshResp.json();
        setAccessToken(tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        return request(path, options); // retry original request once
      }
    }
  }
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export const api = {
  register: (email: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  createCourse: (topic: string) =>
    request("/courses", { method: "POST", body: JSON.stringify({ topic }) }),
  getJob: (jobId: number) => request(`/courses/jobs/${jobId}`),
};
