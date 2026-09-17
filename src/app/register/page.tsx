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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
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
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      await api.register(email, password);
      queryClient.clear();
      setCurrentAccount(email);
      router.push("/dashboard");
    } catch (err) {
      const { status } = parseExportApiError(err);
      if (status === 409) {
        setError("That email is already registered. Try logging in instead.");
      } else if (status === 422) {
        setError("Enter a valid email address and a password of at least 8 characters.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  }

  if (alreadyAuthed) return null;

  return (
    <AuthShell>
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-medium tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Generate and revisit your courses.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
