import { aggregateCells } from "../communityCells";
import { sampleCommunityFinds } from "../demo/sampleFinds";
import type { Find } from "../finds";
import { publicCellFor } from "../privacy";
import type { Backend } from "./types";

// Demo mode: no accounts and no server. The visitor is a demo collector whose finds
// are kept in this browser's localStorage; the community map is bundled sample data
// plus the visitor's own shared finds once they are 48 hours old.

const STORAGE_KEY = "arrowhead-demo-finds";
const DEMO_EMAIL = "Demo collector";
const DEMO_OWNER = "demo-visitor";

const STARTER_FINDS: Omit<Find, "id" | "created_at">[] = [
  { type_id: "madison", lat: 38.6247, lon: -90.1846, material: "Chert", length_mm: 24, date_found: "2025-04-12", land: "own", visibility: "community", notes: "Plowed field after rain." },
  { type_id: "kirk-corner-notched", lat: 35.7721, lon: -80.4113, material: "Rhyolite", length_mm: 58, date_found: "2025-06-03", land: "permission", visibility: "community", notes: null },
  { type_id: "dalton", lat: 36.2512, lon: -90.5871, material: "Chert", length_mm: 62, date_found: "2024-11-20", land: "permission", visibility: "private", notes: "Creek bank, owner's permission on file." },
  { type_id: "elko", lat: 40.8326, lon: -115.7631, material: "Obsidian", length_mm: 41, date_found: "2023-09-08", land: "federal", visibility: "community", notes: "Photographed and left in place." },
];

function load(): Find[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Find[];
  } catch {
    // Storage blocked or corrupt: fall back to the starter finds.
  }
  return STARTER_FINDS.map((f, i) => ({ ...f, id: `starter-${i}`, created_at: "2026-01-02T00:00:00.000Z" }));
}

function save(finds: Find[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finds));
  } catch {
    // Storage blocked: changes last until the page is reloaded.
  }
}

export function demoBackend(): Backend {
  let finds: Find[] | null = null;
  const mine = () => (finds ??= load());

  return {
    mode: "demo",
    async currentUserEmail() {
      return DEMO_EMAIL;
    },
    onAuthChange() {
      return () => {};
    },
    async sendSignInLink() {
      return { error: "Sign-in isn't available in the demo." };
    },
    async signOut() {},

    async listMyFinds() {
      return [...mine()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async addFind(f) {
      finds = [{ ...f, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...mine()];
      save(finds);
      return { error: null };
    },

    async deleteFind(id) {
      finds = mine().filter((f) => f.id !== id);
      save(finds);
      return { error: null };
    },

    async communityCells(w) {
      const own = mine().map((f) => ({ ...f, owner: DEMO_OWNER, public_cell: publicCellFor(f.lat, f.lon) }));
      return aggregateCells([...sampleCommunityFinds(), ...own], w);
    },
  };
}
