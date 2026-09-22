"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Shield } from "lucide-react";

export function Adm1nLoginForm() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/adm1n/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) {
        // Generic message only — never leak closeness / config state
        setError(
          res.status === 429
            ? "Too many attempts. Try again later."
            : "Authentication failed.",
        );
        setPassphrase("");
        return;
      }
      router.replace("/adm1n");
      router.refresh();
    } catch {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 mx-auto h-48 max-w-sm bg-[radial-gradient(ellipse,_rgba(29,185,84,0.12),_transparent_70%)]"
      />
      <div className="relative">
        <Logo />
        <div className="mt-8 flex items-center gap-2 text-accent">
          <Shield className="size-4" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
            Privileged access
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          ADM1N
        </h1>
        <p className="mt-2 text-sm text-[#8a8a8a]">
          Server-side session authentication. Passphrase verified against an
          environment hash — never shipped to the client.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4" autoComplete="off">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#6b6b6b]">
              Passphrase
            </span>
            <input
              type="password"
              name="passphrase"
              autoComplete="current-password"
              required
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#222] bg-[#0c0c0c] px-3 text-sm text-white focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/40"
            />
          </label>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="accent"
            className="h-11 w-full rounded-xl"
            disabled={loading || !passphrase}
          >
            {loading ? "Verifying…" : "Authenticate"}
          </Button>
        </form>
      </div>
    </div>
  );
}
