"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBackend } from "@/lib/backend";

// The sign-in link lands here. The Supabase client exchanges the code in the URL for a
// session as it starts up, so this page only waits for that and moves on.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/my/";
    getBackend()
      .currentUserEmail()
      .then((email) => (email ? router.replace(safeNext) : setFailed(true)));
  }, [router]);

  return (
    <div className="card mx-auto mt-10 max-w-sm text-sm">
      {failed ? "That sign-in link has expired or was already used. Sign in again to get a new one." : "Signing you in…"}
    </div>
  );
}
