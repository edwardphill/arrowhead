import { isSupabaseConfigured } from "../supabase/env";
import { demoBackend } from "./demo";
import { supabaseBackend } from "./supabase";
import type { Backend } from "./types";

export type { Backend } from "./types";

let instance: Backend | null = null;

/** The Supabase project when one is configured, otherwise demo mode on sample data in this browser. */
export function getBackend(): Backend {
  instance ??= isSupabaseConfigured ? supabaseBackend() : demoBackend();
  return instance;
}
