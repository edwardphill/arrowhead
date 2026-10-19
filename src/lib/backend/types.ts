import type { Find } from "../finds";
import type { CommunityCell, TimeWindow } from "../timeline";
import type { FindInput } from "../validateFind";

export type Result = { error: string | null };

/** Where finds are stored: a Supabase project, or this browser in demo mode. */
export type Backend = {
  mode: "supabase" | "demo";
  /** The signed-in user's email, or null when signed out. */
  currentUserEmail(): Promise<string | null>;
  /** Calls `cb` whenever the user signs in or out. Returns an unsubscribe function. */
  onAuthChange(cb: () => void): () => void;
  sendSignInLink(email: string): Promise<Result>;
  signOut(): Promise<void>;
  /** The signed-in user's finds, newest first. */
  listMyFinds(): Promise<Find[]>;
  addFind(find: FindInput): Promise<Result>;
  deleteFind(id: string): Promise<Result>;
  communityCells(w: TimeWindow): Promise<CommunityCell[]>;
};
