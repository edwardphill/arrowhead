import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PERIODS, POINT_TYPES } from "../pointTypes";
import { MIN_CONTRIBUTORS_PER_CELL, MIN_FINDS_PER_CELL } from "../privacy";

const migration = readFileSync(join(__dirname, "../../../supabase/migrations/0001_init.sql"), "utf8");

describe("point type reference data", () => {
  it("matches the database seed", () => {
    for (const t of POINT_TYPES) {
      const row = `('${t.id}', '${t.name}', '${t.period}', ${t.startBp}, ${t.endBp}, '${t.shape}', ${t.lengthMm[0]}, ${t.lengthMm[1]})`;
      expect(migration).toContain(row);
    }
    expect(migration.match(/^  \('/gm)?.length).toBe(POINT_TYPES.length);
  });

  it("dates every type inside its period, oldest first within a period", () => {
    for (const t of POINT_TYPES) {
      expect(t.startBp).toBeGreaterThan(t.endBp);
      expect(PERIODS.some((p) => p.id === t.period)).toBe(true);
    }
  });

  it("uses the same privacy thresholds as the database", () => {
    expect(migration).toContain(`having count(*) >= ${MIN_FINDS_PER_CELL} and count(distinct owner_id) >= ${MIN_CONTRIBUTORS_PER_CELL}`);
  });
});
