import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { FIND_COLUMNS, type Find } from "@/lib/finds";
import MyFinds from "@/components/MyFinds";

export const metadata = { title: "My finds · Arrowhead Atlas" };

export default async function MyFindsPage() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data, error } = await supabase.from("finds").select(FIND_COLUMNS).order("created_at", { ascending: false });
  if (error) return <p className="note note-bad">Couldn&apos;t load your finds. Refresh to try again.</p>;

  return <MyFinds finds={(data ?? []) as Find[]} />;
}
