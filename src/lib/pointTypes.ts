// Reference data for cultural periods and projectile point types.
// Years are "years before present" (BP, present = 1950).
// Keep in sync with the point_types seed in supabase/migrations/0001_init.sql
// (pointTypes.test.ts checks this).

export type PeriodId = "paleo" | "early" | "middle" | "late" | "wood" | "lp";

export type Period = {
  id: PeriodId;
  name: string;
  startBp: number;
  endBp: number;
  color: string;
};

export const PERIODS: Period[] = [
  { id: "paleo", name: "Paleoindian", startBp: 13500, endBp: 10000, color: "#7B5CC4" },
  { id: "early", name: "Early Archaic", startBp: 10000, endBp: 8000, color: "#3A78C2" },
  { id: "middle", name: "Middle Archaic", startBp: 8000, endBp: 5000, color: "#1E9C8C" },
  { id: "late", name: "Late Archaic", startBp: 5000, endBp: 3000, color: "#7FA330" },
  { id: "wood", name: "Woodland", startBp: 3000, endBp: 1000, color: "#D99520" },
  { id: "lp", name: "Late Prehistoric", startBp: 1000, endBp: 150, color: "#D1503A" },
];

export const PERIOD_BY_ID = Object.fromEntries(PERIODS.map((p) => [p.id, p])) as Record<PeriodId, Period>;

export type Shape = "fluted" | "lance" | "side" | "corner" | "stem" | "bifurc" | "tri";

export type PointType = {
  id: string;
  name: string;
  period: PeriodId;
  startBp: number;
  endBp: number;
  shape: Shape;
  lengthMm: [number, number];
};

const t = (
  id: string,
  name: string,
  period: PeriodId,
  startBp: number,
  endBp: number,
  shape: Shape,
  lengthMm: [number, number],
): PointType => ({ id, name, period, startBp, endBp, shape, lengthMm });

export const POINT_TYPES: PointType[] = [
  t("clovis", "Clovis", "paleo", 13050, 12750, "fluted", [50, 120]),
  t("folsom", "Folsom", "paleo", 12800, 12200, "fluted", [35, 70]),
  t("cumberland", "Cumberland", "paleo", 12800, 12000, "fluted", [50, 100]),
  t("dalton", "Dalton", "paleo", 12500, 11000, "lance", [40, 90]),
  t("agate-basin", "Agate Basin", "paleo", 12300, 11500, "lance", [60, 140]),
  t("big-sandy", "Big Sandy", "early", 10500, 9500, "side", [30, 65]),
  t("kirk-corner-notched", "Kirk Corner-Notched", "early", 10000, 8900, "corner", [35, 90]),
  t("lecroy", "LeCroy", "early", 9000, 8500, "bifurc", [25, 50]),
  t("stanly", "Stanly", "middle", 8000, 7500, "stem", [40, 80]),
  t("morrow-mountain", "Morrow Mountain", "middle", 7500, 6500, "stem", [35, 75]),
  t("pinto", "Pinto", "middle", 8000, 5000, "bifurc", [30, 60]),
  t("northern-side-notched", "Northern Side-Notched", "middle", 7500, 5000, "side", [25, 55]),
  t("brewerton", "Brewerton", "late", 5000, 4000, "corner", [25, 55]),
  t("lamoka", "Lamoka", "late", 4500, 4000, "stem", [30, 55]),
  t("savannah-river", "Savannah River", "late", 5000, 3500, "stem", [50, 120]),
  t("mckean", "McKean", "late", 5000, 3500, "bifurc", [30, 60]),
  t("elko", "Elko", "late", 3500, 1300, "corner", [30, 55]),
  t("adena-stemmed", "Adena Stemmed", "wood", 2800, 2100, "stem", [50, 110]),
  t("snyders", "Snyders", "wood", 2200, 1800, "corner", [50, 100]),
  t("rose-spring", "Rose Spring", "wood", 1500, 800, "corner", [18, 35]),
  t("madison", "Madison", "lp", 1150, 350, "tri", [15, 35]),
  t("cahokia", "Cahokia", "lp", 1000, 700, "side", [20, 40]),
  t("washita", "Washita", "lp", 800, 400, "side", [15, 30]),
  t("desert-side-notched", "Desert Side-Notched", "lp", 800, 150, "side", [15, 30]),
  t("gunther-barbed", "Gunther Barbed", "lp", 1000, 150, "stem", [15, 35]),
];

export const POINT_TYPE_BY_ID = Object.fromEntries(POINT_TYPES.map((p) => [p.id, p])) as Record<string, PointType>;

export const MATERIALS = [
  "Chert",
  "Flint",
  "Obsidian",
  "Quartzite",
  "Rhyolite",
  "Jasper",
  "Basalt",
  "Chalcedony",
  "Other",
];
