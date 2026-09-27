export type LandStatus = "own" | "permission" | "state" | "federal" | "tribal" | "unknown";

export const LAND_STATUSES: { id: LandStatus; label: string }[] = [
  { id: "own", label: "My own land" },
  { id: "permission", label: "Private land, with owner's permission" },
  { id: "state", label: "State land" },
  { id: "federal", label: "Federal land (BLM, Forest Service, park)" },
  { id: "tribal", label: "Tribal land" },
  { id: "unknown", label: "Not sure" },
];

export const LAND_LABEL = Object.fromEntries(LAND_STATUSES.map((l) => [l.id, l.label])) as Record<LandStatus, string>;

export function isLandStatus(v: unknown): v is LandStatus {
  return typeof v === "string" && v in LAND_LABEL;
}

/** Whether a find from this land could ever be listed for sale. */
export function canBeSold(land: LandStatus): boolean {
  return land === "own" || land === "permission";
}

/** Warning shown to the finder, or null when there is nothing to flag. */
export function landWarning(land: LandStatus): { tone: "bad" | "warn"; text: string } | null {
  switch (land) {
    case "federal":
    case "tribal":
      return {
        tone: "bad",
        text: `Removing artifacts from ${land} land is prohibited under ARPA. You can record this find for the map, but it can never be listed for sale.`,
      };
    case "state":
      return { tone: "warn", text: "Most states prohibit collecting on state land. This find can't be listed for sale." };
    case "unknown":
      return { tone: "warn", text: "Confirm land status and permission before this find could be listed." };
    default:
      return null;
  }
}
