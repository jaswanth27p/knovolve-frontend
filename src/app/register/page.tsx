"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.register(email, password);
      router.push("/login");
    } catch {
      setError("Registration failed — email may already be taken");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 space-y-4">
      <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" className="w-full">Register</Button>
    </form>
  );
}
