import { cellToLatLng } from "h3-js";
import { PERIODS, type PeriodId } from "./pointTypes";

export const OLDEST_BP = 13700;

/** One aggregated public cell, as returned by the community_cells database function. */
export type CommunityCell = {
  cell: string;
  finds: number;
  contributors: number;
  by_period: Partial<Record<PeriodId, number>>;
  by_type: Record<string, number>;
  avg_length_mm: number | null;
};

export type TimeWindow = { youngerBp: number; olderBp: number };

export function windowAround(centerBp: number, widthYears: number): TimeWindow {
  return { youngerBp: Math.max(0, centerBp - widthYears / 2), olderBp: centerBp + widthYears / 2 };
}

/** The window of the same width immediately before (older than) `w`. */
export function previousWindow(w: TimeWindow): TimeWindow {
  const width = w.olderBp - w.youngerBp;
  return { youngerBp: w.olderBp, olderBp: w.olderBp + width };
}

/** A type dated startBp..endBp counts in every window its range overlaps. */
export function overlaps(startBp: number, endBp: number, w: TimeWindow): boolean {
  return endBp <= w.olderBp && startBp >= w.youngerBp;
}

export function periodAt(bp: number) {
  return PERIODS.find((p) => bp <= p.startBp && bp > p.endBp) ?? (bp > PERIODS[0].startBp ? PERIODS[0] : PERIODS[PERIODS.length - 1]);
}

export function dominantPeriod(byPeriod: Partial<Record<PeriodId, number>>): PeriodId | null {
  let best: PeriodId | null = null;
  let max = 0;
  for (const [id, n] of Object.entries(byPeriod) as [PeriodId, number][]) {
    if (n > max) {
      max = n;
      best = id;
    }
  }
  return best;
}

type Summary = { lat: number; lon: number; finds: number; types: Set<string>; avgLengthMm: number | null };

export function summarize(cells: CommunityCell[]): Summary | null {
  let n = 0, lat = 0, lon = 0, lenSum = 0, lenN = 0;
  const types = new Set<string>();
  for (const c of cells) {
    const [clat, clon] = cellToLatLng(c.cell);
    n += c.finds;
    lat += clat * c.finds;
    lon += clon * c.finds;
    if (c.avg_length_mm != null) {
      lenSum += c.avg_length_mm * c.finds;
      lenN += c.finds;
    }
    for (const t of Object.keys(c.by_type)) types.add(t);
  }
  if (!n) return null;
  return { lat: lat / n, lon: lon / n, finds: n, types, avgLengthMm: lenN ? lenSum / lenN : null };
}

const EARTH_RADIUS_MI = 3959;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

export function bearingDegrees(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
export function compass(bearing: number): string {
  return COMPASS[Math.round(bearing / 45) % 8];
}

export type WindowChange =
  | { kind: "empty" }
  | { kind: "first"; finds: number }
  | {
      kind: "compared";
      finds: number;
      from: { lat: number; lon: number };
      to: { lat: number; lon: number };
      driftMiles: number;
      direction: string;
      newTypes: string[];
      goneTypes: string[];
      avgLengthMm: number | null;
      lengthChangePct: number | null;
    };

/** What changed between the previous window and the current one. */
export function compareWindows(previous: CommunityCell[], current: CommunityCell[]): WindowChange {
  const b = summarize(current);
  if (!b) return { kind: "empty" };
  const a = summarize(previous);
  if (!a) return { kind: "first", finds: b.finds };
  return {
    kind: "compared",
    finds: b.finds,
    from: { lat: a.lat, lon: a.lon },
    to: { lat: b.lat, lon: b.lon },
    driftMiles: distanceMiles(a, b),
    direction: compass(bearingDegrees(a, b)),
    newTypes: [...b.types].filter((t) => !a.types.has(t)).sort(),
    goneTypes: [...a.types].filter((t) => !b.types.has(t)).sort(),
    avgLengthMm: b.avgLengthMm,
    lengthChangePct:
      a.avgLengthMm && b.avgLengthMm != null ? ((b.avgLengthMm - a.avgLengthMm) / a.avgLengthMm) * 100 : null,
  };
}

export function formatBp(bp: number): string {
  return Math.round(bp).toLocaleString("en-US");
}

export function calendarLabel(bp: number): string {
  const year = Math.round(1950 - bp);
  // Archaeological convention: BC = 1950 - BP, with no year zero.
  return year < 1 ? `${Math.max(1, -year).toLocaleString("en-US")} BC` : `AD ${year}`;
}
