import type { LandStatus } from "./land";

export type Visibility = "private" | "community";

/** A find as its owner sees it, including the exact location. */
export type Find = {
  id: string;
  type_id: string;
  lat: number;
  lon: number;
  material: string | null;
  length_mm: number | null;
  date_found: string | null;
  land: LandStatus;
  visibility: Visibility;
  notes: string | null;
  created_at: string;
};

export const FIND_COLUMNS = "id, type_id, lat, lon, material, length_mm, date_found, land, visibility, notes, created_at";
