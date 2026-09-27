"use client";

import { useActionState, useEffect, useState } from "react";
import { addFind, type ActionState } from "@/app/my/actions";
import { LAND_STATUSES, landWarning, type LandStatus } from "@/lib/land";
import { MATERIALS, PERIODS, POINT_TYPES, POINT_TYPE_BY_ID, PERIOD_BY_ID } from "@/lib/pointTypes";
import { formatBp } from "@/lib/timeline";

const initial: ActionState = { error: null, savedAt: null };

export default function AddFindForm({
  lat,
  lon,
  onDone,
}: {
  lat: number;
  lon: number;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(addFind, initial);
  const [typeId, setTypeId] = useState("madison");
  const [land, setLand] = useState<LandStatus>("permission");
  const type = POINT_TYPE_BY_ID[typeId];
  const warning = landWarning(land);

  useEffect(() => {
    if (state.savedAt) onDone();
  }, [state.savedAt, onDone]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lon" value={lon} />
      <div className="font-mono text-xs">
        {lat.toFixed(5)}, {lon.toFixed(5)}
      </div>
      <label className="field" htmlFor="type_id">
        Point type
        <select id="type_id" name="type_id" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          {PERIODS.map((p) => (
            <optgroup key={p.id} label={p.name}>
              {POINT_TYPES.filter((t) => t.period === p.id).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p className="-mt-2 text-sm text-muted">
        {PERIOD_BY_ID[type.period].name}, about {formatBp(type.startBp)}–{formatBp(type.endBp)} years ago
      </p>
      <label className="field" htmlFor="material">
        Material
        <select id="material" name="material" defaultValue="Chert">
          {MATERIALS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <label className="field flex-1" htmlFor="length_mm">
          Length (mm)
          <input
            id="length_mm"
            name="length_mm"
            type="number"
            min={5}
            max={400}
            key={typeId}
            defaultValue={Math.round((type.lengthMm[0] + type.lengthMm[1]) / 2)}
          />
        </label>
        <label className="field flex-1" htmlFor="date_found">
          Date found
          <input id="date_found" name="date_found" type="date" />
        </label>
      </div>
      <label className="field" htmlFor="land">
        Where was it found?
        <select id="land" name="land" value={land} onChange={(e) => setLand(e.target.value as LandStatus)}>
          {LAND_STATUSES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {warning && <p className={`note note-${warning.tone}`}>{warning.text}</p>}
      <fieldset className="flex flex-col gap-2 text-sm">
        <label htmlFor="vis-private" className="flex items-start gap-2">
          <input id="vis-private" type="radio" name="visibility" value="private" />
          <span>
            Private only
            <small className="block text-muted">Only you see it, at its exact spot.</small>
          </span>
        </label>
        <label htmlFor="vis-community" className="flex items-start gap-2">
          <input id="vis-community" type="radio" name="visibility" value="community" defaultChecked />
          <span>
            Add to community map
            <small className="block text-muted">Counted in a 28-mile cell after 48 hours. The exact spot stays private.</small>
          </span>
        </label>
      </fieldset>
      <label className="field" htmlFor="notes">
        Notes
        <textarea id="notes" name="notes" rows={2} maxLength={2000} />
      </label>
      {state.error && <p className="note note-bad">{state.error}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save find"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
