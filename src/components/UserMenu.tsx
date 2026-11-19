"use client";

import Link from "next/link";
import { getBackend } from "@/lib/backend";
import { useUserEmail } from "./useUser";

export default function UserMenu() {
  const email = useUserEmail();
  if (email === undefined) return null;
  if (getBackend().mode === "demo") return <span className="chip">Demo mode</span>;
  if (!email) {
    return (
      <Link href="/login" className="font-semibold text-accent">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span>{email}</span>
      <button className="btn btn-ghost" onClick={() => getBackend().signOut()}>
        Sign out
      </button>
    </div>
  );
}
