"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MyFinds from "@/components/MyFinds";
import { useUserEmail } from "@/components/useUser";
import { getBackend } from "@/lib/backend";
import type { Find } from "@/lib/finds";

export default function MyFindsPage() {
  const router = useRouter();
  const email = useUserEmail();
  const [finds, setFinds] = useState<Find[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    getBackend()
      .listMyFinds()
      .then((f) => {
        setFinds(f);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (email === null) router.replace("/login");
    else if (email) load();
  }, [email, load, router]);

  if (error) return <p className="note note-bad">Couldn&apos;t load your finds. Refresh to try again.</p>;
  if (!finds) return null;
  return <MyFinds finds={finds} onChanged={load} />;
}
