"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicCellFor } from "@/lib/privacy";
import { parseFindForm } from "@/lib/validateFind";

export type ActionState = { error: string | null; savedAt: number | null };

export async function addFind(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = parseFindForm(form);
  if (!parsed.ok) return { error: parsed.error, savedAt: null };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Your session expired. Sign in again.", savedAt: null };

  const f = parsed.value;
  const { error } = await supabase.from("finds").insert({ ...f, public_cell: publicCellFor(f.lat, f.lon) });
  if (error) return { error: "Couldn't save the find. Try again.", savedAt: null };

  revalidatePath("/my");
  return { error: null, savedAt: Date.now() };
}

export async function deleteFind(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  // Row-level security limits this to the signed-in owner's rows.
  const { error } = await supabase.from("finds").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the find." };
  revalidatePath("/my");
  return { error: null };
}
