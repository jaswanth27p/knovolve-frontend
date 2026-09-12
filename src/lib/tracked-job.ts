// Per-account tracking for the in-flight course-generation job on /learn.
//
// The old code kept a bare job id under one global localStorage key, so
// switching accounts (or wiping the dev DB and re-registering) resurrected
// someone else's job id as a phantom "Queued" box. The stored entry now
// carries the account email it was created under, and readers ignore entries
// that don't match the currently logged-in account.
const JOB_KEY = "knovolve:learn:tracked_job_id";
const ACCOUNT_KEY = "knovolve:learn:account";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable — tracking just won't survive navigation.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function currentAccount(): string | null {
  return safeGet(ACCOUNT_KEY);
}

/** Call after login/register: binds tracking to this account, drops the previous account's job. */
export function setCurrentAccount(email: string): void {
  safeSet(ACCOUNT_KEY, email.trim().toLowerCase());
  safeRemove(JOB_KEY);
}

/** Call on logout: neither the account nor its job may leak into the next session. */
export function clearAuthTracking(): void {
  safeRemove(ACCOUNT_KEY);
  safeRemove(JOB_KEY);
}

export function readTrackedJobId(): number | null {
  const raw = safeGet(JOB_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    // Legacy plain-number entries predate account scoping — honor them only
    // when no account marker exists yet (pre-upgrade single-user browsers).
    if (typeof parsed === "number") return currentAccount() ? null : parsed;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as { jobId?: unknown }).jobId === "number" &&
      typeof (parsed as { account?: unknown }).account === "string"
    ) {
      const entry = parsed as { jobId: number; account: string };
      return entry.account === currentAccount() ? entry.jobId : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeTrackedJobId(jobId: number | null): void {
  if (jobId === null) {
    safeRemove(JOB_KEY);
    return;
  }
  try {
    localStorage.setItem(JOB_KEY, JSON.stringify({ jobId, account: currentAccount() }));
  } catch {
    // ignore — the box just won't survive a navigation away and back.
  }
}
