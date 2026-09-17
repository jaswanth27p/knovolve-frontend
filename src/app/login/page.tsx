"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth-shell";
import { api, parseExportApiError } from "@/lib/api";
import { setCurrentAccount } from "@/lib/tracked-job";
import { useRedirectIfLoggedIn } from "@/lib/use-auth-redirect";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  // Already signed in? Skip the form and go to the dashboard.
  const alreadyAuthed = useRedirectIfLoggedIn();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    try {
      await api.login(email, password);
      // Guards against a stale cache from a previous session (e.g. a
      // silent token expiry that skipped the logout button) leaking into
      // this one.
      queryClient.clear();
      setCurrentAccount(email);
      router.push("/dashboard");
    } catch (err) {
      const { status } = parseExportApiError(err);
      if (status === 401 || status === 422) {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  if (alreadyAuthed) return null;

  return (
    <AuthShell>
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-medium tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to continue your courses.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">Log in</Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        New to Knovolve?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
