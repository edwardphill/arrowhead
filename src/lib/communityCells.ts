import { MIN_CONTRIBUTORS_PER_CELL, MIN_FINDS_PER_CELL } from "./privacy";
import { POINT_TYPE_BY_ID, type PeriodId } from "./pointTypes";
import { overlaps, type CommunityCell, type TimeWindow } from "./timeline";
import type { Visibility } from "./finds";

/** The fields of a find that the community map aggregates. */
export type SharedFind = {
  owner: string;
  type_id: string;
  public_cell: string;
  length_mm: number | null;
  visibility: Visibility;
  created_at: string;
};

export const SHARE_DELAY_MS = 48 * 60 * 60 * 1000;

/**
 * In-browser equivalent of the community_cells() database function, used in demo mode.
 * Keep the rules in sync with supabase/migrations/0001_init.sql.
 */
export function aggregateCells(finds: SharedFind[], w: TimeWindow, now = Date.now()): CommunityCell[] {
  const byCell = new Map<string, SharedFind[]>();
  for (const f of finds) {
    const type = POINT_TYPE_BY_ID[f.type_id];
    if (!type || f.visibility !== "community") continue;
    if (Date.parse(f.created_at) >= now - SHARE_DELAY_MS) continue;
    if (!overlaps(type.startBp, type.endBp, w)) continue;
    const list = byCell.get(f.public_cell);
    if (list) list.push(f);
    else byCell.set(f.public_cell, [f]);
  }

  const cells: CommunityCell[] = [];
  for (const [cell, list] of byCell) {
    const contributors = new Set(list.map((f) => f.owner)).size;
    if (list.length < MIN_FINDS_PER_CELL || contributors < MIN_CONTRIBUTORS_PER_CELL) continue;
    const by_period: Partial<Record<PeriodId, number>> = {};
    const by_type: Record<string, number> = {};
    let lenSum = 0, lenN = 0;
    for (const f of list) {
      const type = POINT_TYPE_BY_ID[f.type_id];
      by_period[type.period] = (by_period[type.period] ?? 0) + 1;
      by_type[type.name] = (by_type[type.name] ?? 0) + 1;
      if (f.length_mm != null) {
        lenSum += f.length_mm;
        lenN++;
      }
    }
    cells.push({
      cell,
      finds: list.length,
      contributors,
      by_period,
      by_type,
      avg_length_mm: lenN ? Math.round((lenSum / lenN) * 10) / 10 : null,
    });
  }
  return cells;
}
