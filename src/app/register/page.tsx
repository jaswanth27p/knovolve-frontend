"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center space-y-6 px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Generate and revisit your courses.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" className="w-full">Register</Button>
      </form>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
