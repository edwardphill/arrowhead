import { describe, expect, it } from "vitest";
import { aggregateCells, SHARE_DELAY_MS, type SharedFind } from "../communityCells";
import { sampleCommunityFinds } from "../demo/sampleFinds";
import { publicCellFor } from "../privacy";

const NOW = Date.parse("2026-06-01T00:00:00Z");
const OLD = new Date(NOW - SHARE_DELAY_MS - 1).toISOString();
const CELL = publicCellFor(38.6, -90.2);
const ALL = { youngerBp: 0, olderBp: 15000 };

const find = (owner: string, overrides: Partial<SharedFind> = {}): SharedFind => ({
  owner,
  type_id: "madison",
  public_cell: CELL,
  length_mm: 20,
  visibility: "community",
  created_at: OLD,
  ...overrides,
});

describe("aggregateCells (demo mode's community_cells)", () => {
  it("shows a cell with 3 finds from 2 contributors", () => {
    const [cell] = aggregateCells([find("a"), find("a"), find("b", { type_id: "cahokia", length_mm: 30 })], ALL, NOW);
    expect(cell).toEqual({
      cell: CELL,
      finds: 3,
      contributors: 2,
      by_period: { lp: 3 },
      by_type: { Madison: 2, Cahokia: 1 },
      avg_length_mm: 23.3,
    });
  });

  it("hides cells below the thresholds", () => {
    expect(aggregateCells([find("a"), find("b")], ALL, NOW)).toEqual([]);
    expect(aggregateCells([find("a"), find("a"), find("a")], ALL, NOW)).toEqual([]);
  });

  it("leaves out private, recent and out-of-window finds", () => {
    const recent = new Date(NOW - 1000).toISOString();
    const finds = [find("a"), find("b"), find("c", { visibility: "private" }), find("c", { created_at: recent }), find("c", { type_id: "clovis" })];
    expect(aggregateCells(finds, { youngerBp: 0, olderBp: 2000 }, NOW)).toEqual([]);
  });
});

describe("demo sample data", () => {
  it("fills every period with visible cells", () => {
    const cells = aggregateCells(sampleCommunityFinds(), ALL, NOW);
    const periods = new Set(cells.flatMap((c) => Object.keys(c.by_period)));
    expect(periods).toEqual(new Set(["paleo", "early", "middle", "late", "wood", "lp"]));
    expect(cells.length).toBeGreaterThan(100);
  });
});
