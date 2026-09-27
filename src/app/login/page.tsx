"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/my` },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
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
