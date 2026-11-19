"use client";

import { useEffect, useState } from "react";
import { getBackend } from "@/lib/backend";

/** The signed-in user's email: undefined while loading, null when signed out. */
export function useUserEmail() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const backend = getBackend();
    let live = true;
    const refresh = () => backend.currentUserEmail().then((e) => live && setEmail(e));
    refresh();
    const unsubscribe = backend.onAuthChange(refresh);
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  return email;
}
