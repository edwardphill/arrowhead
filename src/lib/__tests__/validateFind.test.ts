import { describe, expect, it } from "vitest";
import { canBeSold, landWarning } from "../land";
import { publicCellFor, PUBLIC_CELL_RESOLUTION } from "../privacy";
import { getResolution } from "h3-js";
import { parseFindForm } from "../validateFind";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

const valid = { lat: "39.3", lon: "-83", type_id: "adena-stemmed", land: "own", visibility: "community", length_mm: "80" };

describe("parseFindForm", () => {
  it("accepts a complete find", () => {
    const r = parseFindForm(form(valid));
    expect(r).toMatchObject({ ok: true, value: { type_id: "adena-stemmed", lat: 39.3, lon: -83, visibility: "community", length_mm: 80 } });
  });

  it("defaults to private unless community is chosen", () => {
    const r = parseFindForm(form({ ...valid, visibility: "anything" }));
    expect(r.ok && r.value.visibility).toBe("private");
  });

  it("rejects missing location, unknown types, bad land and odd lengths", () => {
    expect(parseFindForm(form({ ...valid, lat: "" })).ok).toBe(false);
    expect(parseFindForm(form({ ...valid, lat: "91" })).ok).toBe(false);
    expect(parseFindForm(form({ ...valid, type_id: "nope" })).ok).toBe(false);
    expect(parseFindForm(form({ ...valid, land: "moon" })).ok).toBe(false);
    expect(parseFindForm(form({ ...valid, length_mm: "2" })).ok).toBe(false);
  });
});

describe("land rules", () => {
  it("only allows private land finds to be sold", () => {
    expect(canBeSold("own")).toBe(true);
    expect(canBeSold("permission")).toBe(true);
    expect(canBeSold("federal")).toBe(false);
    expect(canBeSold("tribal")).toBe(false);
    expect(canBeSold("state")).toBe(false);
  });

  it("flags ARPA land", () => {
    expect(landWarning("federal")?.tone).toBe("bad");
    expect(landWarning("own")).toBeNull();
  });
});

describe("public cells", () => {
  it("uses the coarse privacy resolution", () => {
    expect(getResolution(publicCellFor(39.3, -83))).toBe(PUBLIC_CELL_RESOLUTION);
  });
});
