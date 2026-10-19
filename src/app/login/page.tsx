"use client";

import Link from "next/link";
import { useState } from "react";
import { getBackend } from "@/lib/backend";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await getBackend().sendSignInLink(email);
    if (error) {
      setError(error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (getBackend().mode === "demo") {
    return (
      <div className="card mx-auto mt-10 max-w-sm">
        <h1 className="mb-2 text-xl font-bold">Sign in</h1>
        <p>
          The demo doesn&apos;t need an account. <Link href="/my" className="font-semibold text-accent">Go to My finds</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="card mx-auto mt-10 max-w-sm">
      <h1 className="mb-2 text-xl font-bold">Sign in</h1>
      {status === "sent" ? (
        <p>Check {email} for a sign-in link.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="field" htmlFor="email">
            Email
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn" disabled={status === "sending"}>
            {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
          </button>
          {status === "error" && <p className="note note-bad">{error}</p>}
        </form>
      )}
    </div>
  );
}
