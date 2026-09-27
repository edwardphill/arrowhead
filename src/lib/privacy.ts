import { latLngToCell } from "h3-js";

// Public map cells are fixed H3 hexagons. Resolution 4 is about 1,770 km² (roughly 28 mi across),
// coarse enough that a cell can't be used to find a site. Zooming the map never reveals anything finer.
// These values are mirrored in supabase/migrations/0001_init.sql (community_cells).
export const PUBLIC_CELL_RESOLUTION = 4;
export const MIN_FINDS_PER_CELL = 3;
export const MIN_CONTRIBUTORS_PER_CELL = 2;

export function publicCellFor(lat: number, lon: number): string {
  return latLngToCell(lat, lon, PUBLIC_CELL_RESOLUTION);
}

export function isValidLatLon(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
