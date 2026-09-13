"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// localStorage doesn't change between renders here, so the store never emits.
const subscribe = () => () => {};

/**
 * Auth pages (/login, /register) call this to bounce an already-signed-in
 * visitor to the dashboard. Returns the auth state so the page can render
 * nothing while the redirect is in flight (avoiding a flash of the form).
 *
 * Reads the non-sensitive `logged_in` flag rather than making a request; the
 * flag is only trusted for this UI redirect, never for authorization. If it is
 * stale, the first real API call on the dashboard clears it and sends the user
 * back to /login.
 */
export function useRedirectIfLoggedIn(): boolean {
  const router = useRouter();
  const isAuthed = useSyncExternalStore(subscribe, () => api.isLoggedIn(), () => false);

  useEffect(() => {
    if (isAuthed) router.replace("/dashboard");
  }, [isAuthed, router]);

  return isAuthed;
}
