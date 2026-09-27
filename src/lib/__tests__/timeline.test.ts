import { latLngToCell } from "h3-js";
import { describe, expect, it } from "vitest";
import {
  calendarLabel,
  compareWindows,
  compass,
  distanceMiles,
  dominantPeriod,
  overlaps,
  periodAt,
  previousWindow,
  windowAround,
  type CommunityCell,
} from "../timeline";

const cell = (lat: number, lon: number, finds: number, types: Record<string, number>, len: number | null): CommunityCell => ({
  cell: latLngToCell(lat, lon, 4),
  finds,
  contributors: 2,
  by_period: {},
  by_type: types,
  avg_length_mm: len,
});

describe("time windows", () => {
  it("centers a window and never goes below the present", () => {
    expect(windowAround(12000, 1000)).toEqual({ youngerBp: 11500, olderBp: 12500 });
    expect(windowAround(200, 1000)).toEqual({ youngerBp: 0, olderBp: 700 });
  });

  it("finds the older window of the same width", () => {
    expect(previousWindow({ youngerBp: 2000, olderBp: 3000 })).toEqual({ youngerBp: 3000, olderBp: 4000 });
  });

  it("counts a type in every window its range overlaps", () => {
    const w = { youngerBp: 2000, olderBp: 3000 };
    expect(overlaps(2800, 2100, w)).toBe(true); // Adena
    expect(overlaps(3500, 1300, w)).toBe(true); // Elko spans the window
    expect(overlaps(1150, 350, w)).toBe(false); // Madison
  });

  it("maps years to periods and calendar dates", () => {
    expect(periodAt(12500).id).toBe("paleo");
    expect(periodAt(2000).id).toBe("wood");
    expect(periodAt(100).id).toBe("lp");
    expect(calendarLabel(1950)).toBe("1 BC");
    expect(calendarLabel(1000)).toBe("AD 950");
    expect(calendarLabel(12900)).toBe("10,950 BC");
  });
});

describe("compareWindows", () => {
  it("reports an empty window", () => {
    expect(compareWindows([], [])).toEqual({ kind: "empty" });
  });

  it("reports the first appearance when the previous window is empty", () => {
    expect(compareWindows([], [cell(36, -87, 4, { Clovis: 4 }, 90)])).toEqual({ kind: "first", finds: 4 });
  });

  it("measures drift, new and vanished types, and size change", () => {
    const before = [cell(39.3, -83, 10, { "Adena Stemmed": 10 }, 80)];
    const after = [cell(38.6, -90.1, 10, { Madison: 6, Cahokia: 4 }, 24)];
    const c = compareWindows(before, after);
    if (c.kind !== "compared") throw new Error("expected comparison");
    expect(c.direction).toBe("west");
    expect(c.driftMiles).toBeGreaterThan(330);
    expect(c.driftMiles).toBeLessThan(420);
    expect(c.newTypes).toEqual(["Cahokia", "Madison"]);
    expect(c.goneTypes).toEqual(["Adena Stemmed"]);
    expect(Math.round(c.lengthChangePct!)).toBe(-70);
  });
});

describe("helpers", () => {
  it("computes great-circle distance", () => {
    expect(Math.round(distanceMiles({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }))).toBe(69);
  });

  it("names compass directions", () => {
    expect(compass(0)).toBe("north");
    expect(compass(92)).toBe("east");
    expect(compass(359)).toBe("north");
  });

  it("picks the most common period", () => {
    expect(dominantPeriod({ wood: 2, lp: 5 })).toBe("lp");
    expect(dominantPeriod({})).toBeNull();
  });
});
