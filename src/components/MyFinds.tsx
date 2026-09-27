"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type * as maplibregl from "maplibre-gl";
import { deleteFind } from "@/app/my/actions";
import type { Find } from "@/lib/finds";
import { LAND_LABEL, landWarning } from "@/lib/land";
import { PERIOD_BY_ID, POINT_TYPE_BY_ID, type PeriodId } from "@/lib/pointTypes";
import { formatBp } from "@/lib/timeline";
import AddFindForm from "./AddFindForm";
import PeriodLegend, { PERIOD_COLOR_EXPRESSION } from "./PeriodLegend";
import { setGeoJson, useMap } from "./useMap";

type Draft = { lat: number; lon: number };

export default function MyFinds({ finds }: { finds: Find[] }) {
  const { containerRef, map } = useMap();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<PeriodId>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const selected = finds.find((f) => f.id === selectedId) ?? null;
  const visible = useMemo(
    () => finds.filter((f) => !hidden.has(POINT_TYPE_BY_ID[f.type_id]?.period)),
    [finds, hidden],
  );

  // Find pins
  useEffect(() => {
    if (!map) return;
    setGeoJson(map, "finds", {
      type: "FeatureCollection",
      features: visible.map((f) => ({
        type: "Feature",
        id: f.id,
        geometry: { type: "Point", coordinates: [f.lon, f.lat] },
        properties: {
          id: f.id,
          period: POINT_TYPE_BY_ID[f.type_id]?.period,
          private: f.visibility === "private",
          selected: f.id === selectedId,
        },
      })),
    });
    if (!map.getLayer("finds")) {
      map.addLayer({
        id: "finds",
        type: "circle",
        source: "finds",
        paint: {
          "circle-color": PERIOD_COLOR_EXPRESSION,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 12, 9],
          "circle-stroke-color": ["case", ["get", "selected"], "#1b2420", ["get", "private"], "#1b2420", "#ffffff"],
          "circle-stroke-width": ["case", ["get", "selected"], 3, 1.5],
          "circle-stroke-opacity": ["case", ["get", "private"], 0.8, 1],
        },
      });
      map.on("mouseenter", "finds", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "finds", () => (map.getCanvas().style.cursor = ""));
    }
  }, [map, visible, selectedId]);

  // Draft pin while adding
  useEffect(() => {
    if (!map) return;
    setGeoJson(map, "draft", {
      type: "FeatureCollection",
      features: draft ? [{ type: "Feature", geometry: { type: "Point", coordinates: [draft.lon, draft.lat] }, properties: {} }] : [],
    });
    if (!map.getLayer("draft")) {
      map.addLayer({
        id: "draft",
        type: "circle",
        source: "draft",
        paint: { "circle-color": "#1f5e57", "circle-radius": 8, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
      });
    }
  }, [map, draft]);

  // Clicks: place the draft pin while adding, otherwise select a find
  useEffect(() => {
    if (!map) return;
    const onClick = (e: maplibregl.MapMouseEvent) => {
      if (adding) {
        setDraft({ lat: e.lngLat.lat, lon: e.lngLat.lng });
        return;
      }
      const hit = map.queryRenderedFeatures(e.point, { layers: ["finds"] })[0];
      setSelectedId(hit ? String(hit.properties.id) : null);
    };
    map.on("click", onClick);
    map.getCanvas().style.cursor = adding ? "crosshair" : "";
    return () => {
      map.off("click", onClick);
    };
  }, [map, adding]);

  const stopAdding = useCallback(() => {
    setAdding(false);
    setDraft(null);
  }, []);

  function onDelete(id: string) {
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteFind(id);
      if (res.error) setDeleteError(res.error);
      else setSelectedId(null);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="map-box">
          <div ref={containerRef} className="h-full w-full" />
          {adding && (
            <div className="card absolute left-3 top-3 !py-1.5 text-sm">
              {draft ? "Fill in the details. Click again to move the pin." : "Click the map where you found it. Zoom in first for accuracy."}
            </div>
          )}
        </div>
        <FindsTable finds={finds} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        <div className="card">
          <h1 className="text-lg font-bold">My finds</h1>
          <p className="text-sm text-muted">Your finds at their exact spots. Only you can see this map.</p>
          {!adding && (
            <button
              className="btn mt-3"
              onClick={() => {
                setSelectedId(null);
                setAdding(true);
              }}
            >
              Add a find
            </button>
          )}
        </div>

        {adding && (
          <div className="card">
            <h3 className="card-title">New find</h3>
            {draft ? (
              <AddFindForm lat={draft.lat} lon={draft.lon} onDone={stopAdding} />
            ) : (
              <button className="btn btn-ghost" onClick={stopAdding}>
                Cancel
              </button>
            )}
          </div>
        )}

        {selected && !adding && (
          <FindDetail find={selected} onDelete={() => onDelete(selected.id)} deleting={deleting} error={deleteError} />
        )}

        <PeriodLegend
          hidden={hidden}
          onToggle={(id) =>
            setHidden((h) => {
              const next = new Set(h);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
        />
      </aside>
    </div>
  );
}

function FindDetail({ find, onDelete, deleting, error }: { find: Find; onDelete: () => void; deleting: boolean; error: string | null }) {
  const type = POINT_TYPE_BY_ID[find.type_id];
  const warning = landWarning(find.land);
  const rows: [string, string][] = [
    ["Period", PERIOD_BY_ID[type.period].name],
    ["Age", `${formatBp(type.startBp)}–${formatBp(type.endBp)} years ago`],
    ["Material", find.material ?? "—"],
    ["Length", find.length_mm ? `${find.length_mm} mm` : "—"],
    ["Found", find.date_found ?? "—"],
    ["Land", LAND_LABEL[find.land]],
    ["Sharing", find.visibility === "community" ? "Community map (generalized)" : "Private only"],
    ["Exact spot", `${find.lat.toFixed(5)}, ${find.lon.toFixed(5)}`],
  ];
  return (
    <div className="card">
      <h3 className="card-title">Your find</h3>
      <div className="text-xl font-bold">{type.name}</div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {find.notes && <p className="mt-2 text-sm">{find.notes}</p>}
      {warning && <p className={`note note-${warning.tone} mt-2`}>{warning.text}</p>}
      {error && <p className="note note-bad mt-2">{error}</p>}
      <button className="btn btn-ghost mt-3" onClick={onDelete} disabled={deleting}>
        {deleting ? "Deleting…" : "Delete find"}
      </button>
    </div>
  );
}

function FindsTable({ finds, selectedId, onSelect }: { finds: Find[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (!finds.length) {
    return <p className="card text-sm text-muted">No finds yet. Use Add a find to record your first one.</p>;
  }
  return (
    <div className="card overflow-x-auto !p-0">
      <table className="w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold">Period</th>
            <th className="px-3 py-2 font-semibold">Material</th>
            <th className="px-3 py-2 font-semibold">Length</th>
            <th className="px-3 py-2 font-semibold">Sharing</th>
          </tr>
        </thead>
        <tbody>
          {finds.map((f) => {
            const type = POINT_TYPE_BY_ID[f.type_id];
            return (
              <tr
                key={f.id}
                onClick={() => onSelect(f.id)}
                className={`cursor-pointer border-t border-line ${f.id === selectedId ? "bg-bg" : ""}`}
              >
                <td className="px-3 py-1.5">{type.name}</td>
                <td className="px-3 py-1.5">{PERIOD_BY_ID[type.period].name}</td>
                <td className="px-3 py-1.5">{f.material ?? "—"}</td>
                <td className="px-3 py-1.5 tabular-nums">{f.length_mm ? `${f.length_mm} mm` : "—"}</td>
                <td className="px-3 py-1.5">{f.visibility === "community" ? "Community" : "Private"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
