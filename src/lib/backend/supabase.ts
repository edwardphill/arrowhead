import { FIND_COLUMNS, type Find } from "../finds";
import { publicCellFor } from "../privacy";
import { createClient } from "../supabase/client";
import type { CommunityCell } from "../timeline";
import type { Backend } from "./types";

export function supabaseBackend(): Backend {
  const supabase = createClient();
  return {
    mode: "supabase",

    async currentUserEmail() {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.email ?? null;
    },

    onAuthChange(cb) {
      const { data } = supabase.auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },

    async sendSignInLink(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/auth/callback/?next=/my/` },
      });
      return { error: error?.message ?? null };
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    async listMyFinds() {
      const { data, error } = await supabase.from("finds").select(FIND_COLUMNS).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Find[];
    },

    async addFind(f) {
      const { error } = await supabase.from("finds").insert({ ...f, public_cell: publicCellFor(f.lat, f.lon) });
      return { error: error ? "Couldn't save the find. Try again." : null };
    },

    async deleteFind(id) {
      // Row-level security limits this to the signed-in owner's rows.
      const { error } = await supabase.from("finds").delete().eq("id", id);
      return { error: error ? "Couldn't delete the find." : null };
    },

    async communityCells(w) {
      const { data, error } = await supabase.rpc("community_cells", {
        younger_bp: Math.floor(w.youngerBp),
        older_bp: Math.ceil(w.olderBp),
      });
      if (error) throw error;
      return (data ?? []) as CommunityCell[];
    },
  };
}
