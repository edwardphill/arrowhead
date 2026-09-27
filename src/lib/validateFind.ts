import { isLandStatus, type LandStatus } from "./land";
import { POINT_TYPE_BY_ID } from "./pointTypes";
import { isValidLatLon } from "./privacy";
import type { Visibility } from "./finds";

export type FindInput = {
  type_id: string;
  lat: number;
  lon: number;
  material: string | null;
  length_mm: number | null;
  date_found: string | null;
  land: LandStatus;
  visibility: Visibility;
  notes: string | null;
};

const text = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

export function parseFindForm(form: FormData): { ok: true; value: FindInput } | { ok: false; error: string } {
  const latRaw = text(form.get("lat"));
  const lonRaw = text(form.get("lon"));
  const lat = latRaw == null ? NaN : Number(latRaw);
  const lon = lonRaw == null ? NaN : Number(lonRaw);
  if (!isValidLatLon(lat, lon)) return { ok: false, error: "Place the find on the map first." };

  const type_id = String(form.get("type_id") ?? "");
  if (!POINT_TYPE_BY_ID[type_id]) return { ok: false, error: "Choose a point type." };

  const land = form.get("land");
  if (!isLandStatus(land)) return { ok: false, error: "Choose where it was found." };

  const visibility = form.get("visibility") === "community" ? "community" : "private";

  const lengthRaw = text(form.get("length_mm"));
  const length_mm = lengthRaw == null ? null : Math.round(Number(lengthRaw));
  if (length_mm != null && !(length_mm >= 5 && length_mm <= 400)) {
    return { ok: false, error: "Length should be between 5 and 400 mm." };
  }

  const date_found = text(form.get("date_found"));
  if (date_found && !/^\d{4}-\d{2}-\d{2}$/.test(date_found)) return { ok: false, error: "Enter a valid date." };

  const notes = text(form.get("notes"));
  if (notes && notes.length > 2000) return { ok: false, error: "Notes are limited to 2,000 characters." };

  return {
    ok: true,
    value: { type_id, lat, lon, material: text(form.get("material")), length_mm, date_found, land, visibility, notes },
  };
}
