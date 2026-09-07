"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, setAccessToken } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api.login(email, password);
      setAccessToken(tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      router.push("/learn");
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 space-y-4">
      <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" className="w-full">Log in</Button>
    </form>
  );
}
