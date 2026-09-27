"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cellToBoundary } from "h3-js";
import type { MapMouseEvent } from "maplibre-gl";
import { createClient } from "@/lib/supabase/client";
import type { PeriodId } from "@/lib/pointTypes";
import { MIN_CONTRIBUTORS_PER_CELL, MIN_FINDS_PER_CELL } from "@/lib/privacy";
import {
  OLDEST_BP,
  calendarLabel,
  compareWindows,
  dominantPeriod,
  formatBp,
  periodAt,
  previousWindow,
  windowAround,
  type CommunityCell,
  type TimeWindow,
} from "@/lib/timeline";
import PeriodLegend, { PERIOD_COLOR_EXPRESSION } from "./PeriodLegend";
import { setGeoJson, useMap } from "./useMap";

const WIDTHS = [500, 1000, 2000, 4000];
const ALL_TIME = OLDEST_BP + 1000;

async function fetchCells(w: TimeWindow): Promise<CommunityCell[]> {
  const { data, error } = await createClient().rpc("community_cells", {
    younger_bp: Math.floor(w.youngerBp),
    older_bp: Math.ceil(w.olderBp),
  });
  if (error) throw error;
  return (data ?? []) as CommunityCell[];
}

/** Drops finds from hidden periods and removes cells left empty. */
function withoutPeriods(cells: CommunityCell[], hidden: Set<PeriodId>): CommunityCell[] {
  if (!hidden.size) return cells;
  return cells.flatMap((c) => {
    const byPeriod = Object.fromEntries(Object.entries(c.by_period).filter(([p]) => !hidden.has(p as PeriodId)));
    const finds = Object.values(byPeriod).reduce((a, b) => a + (b ?? 0), 0);
    return finds ? [{ ...c, by_period: byPeriod, finds }] : [];
  });
}

export default function CommunityMap() {
  const { containerRef, map } = useMap({ maxZoom: 9 });
  const [centerBp, setCenterBp] = useState(12400);
  const [width, setWidth] = useState(1000);
  const [hidden, setHidden] = useState<Set<PeriodId>>(new Set());
  const [cells, setCells] = useState<{ current: CommunityCell[]; previous: CommunityCell[] }>({ current: [], previous: [] });
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const allTime = width >= ALL_TIME;
  const win = useMemo(() => (allTime ? { youngerBp: 0, olderBp: ALL_TIME } : windowAround(centerBp, width)), [allTime, centerBp, width]);

  // Load the current and previous windows, debounced while scrubbing
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current;
    const timer = setTimeout(async () => {
      try {
        const [current, previous] = await Promise.all([fetchCells(win), allTime ? Promise.resolve([]) : fetchCells(previousWindow(win))]);
        if (id === request.current) {
          setCells({ current, previous });
          setLoadError(false);
        }
      } catch {
        if (id === request.current) setLoadError(true);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [win, allTime]);

  const current = useMemo(() => withoutPeriods(cells.current, hidden), [cells, hidden]);
  const previous = useMemo(() => withoutPeriods(cells.previous, hidden), [cells, hidden]);
  const change = useMemo(() => (allTime ? null : compareWindows(previous, current)), [allTime, previous, current]);
  const selectedCell = current.find((c) => c.cell === selected) ?? null;

  // Hex layer
  useEffect(() => {
    if (!map) return;
    setGeoJson(map, "cells", {
      type: "FeatureCollection",
      features: current.map((c) => ({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [cellToBoundary(c.cell, true)] },
        properties: { cell: c.cell, finds: c.finds, period: dominantPeriod(c.by_period), selected: c.cell === selected },
      })),
    });
    if (!map.getLayer("cells")) {
      map.addLayer({
        id: "cells",
        type: "fill",
        source: "cells",
        paint: {
          "fill-color": PERIOD_COLOR_EXPRESSION,
          "fill-opacity": ["interpolate", ["linear"], ["get", "finds"], 3, 0.45, 12, 0.9],
        },
      });
      map.addLayer({
        id: "cells-outline",
        type: "line",
        source: "cells",
        paint: { "line-color": ["case", ["get", "selected"], "#1b2420", "#ffffff"], "line-width": ["case", ["get", "selected"], 2.5, 0.8] },
      });
      map.on("click", (e: MapMouseEvent) => {
        const hit = map.queryRenderedFeatures(e.point, { layers: ["cells"] })[0];
        setSelected(hit ? String(hit.properties.cell) : null);
      });
      map.on("mouseenter", "cells", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "cells", () => (map.getCanvas().style.cursor = ""));
    }
  }, [map, current, selected]);

  // Drift arrow from the previous window's center to this one's
  useEffect(() => {
    if (!map) return;
    const compared = change?.kind === "compared" && change.driftMiles > 15;
    setGeoJson(map, "drift", {
      type: "FeatureCollection",
      features: compared
        ? [
            { type: "Feature", geometry: { type: "LineString", coordinates: [[change.from.lon, change.from.lat], [change.to.lon, change.to.lat]] }, properties: {} },
            { type: "Feature", geometry: { type: "Point", coordinates: [change.to.lon, change.to.lat] }, properties: {} },
          ]
        : [],
    });
    if (!map.getLayer("drift")) {
      map.addLayer({ id: "drift", type: "line", source: "drift", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#1b2420", "line-width": 2.5, "line-dasharray": [2, 1] } });
      map.addLayer({ id: "drift-end", type: "circle", source: "drift", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 5, "circle-color": "#1b2420", "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.5 } });
    }
  }, [map, change]);

  // Play steps toward the present
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setCenterBp((c) => {
        if (c <= 400) {
          setPlaying(false);
          return 300;
        }
        return c - 200;
      });
    }, 600);
    return () => clearInterval(t);
  }, [playing]);

  const period = periodAt(centerBp);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="map-box">
          <div ref={containerRef} className="h-full w-full" />
        </div>
        <div className="card flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="btn btn-ghost !px-3"
              aria-label={playing ? "Pause" : "Play through time"}
              onClick={() => {
                if (!playing && (allTime || centerBp <= 400)) {
                  if (allTime) setWidth(1000);
                  setCenterBp(13200);
                }
                setPlaying(!playing);
              }}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <div className="text-lg font-bold tabular-nums">
              {allTime ? (
                "All time"
              ) : (
                <>
                  {formatBp(win.olderBp)}–{formatBp(win.youngerBp)} years ago
                  <span className="ml-2 text-sm font-normal text-muted">
                    {calendarLabel(win.olderBp)} to {calendarLabel(win.youngerBp)} · {period.name}
                  </span>
                </>
              )}
            </div>
            <label htmlFor="width" className="ml-auto flex items-center gap-2 text-sm text-muted">
              Window
              <select id="width" className="input" value={width} onChange={(e) => setWidth(Number(e.target.value))}>
                {WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w.toLocaleString("en-US")} yrs
                  </option>
                ))}
                <option value={ALL_TIME}>All time</option>
              </select>
            </label>
          </div>
          <input
            type="range"
            aria-label="Years ago"
            className="w-full accent-[var(--accent)]"
            min={0}
            max={OLDEST_BP}
            step={100}
            value={OLDEST_BP - centerBp}
            disabled={allTime}
            onChange={(e) => setCenterBp(OLDEST_BP - Number(e.target.value))}
          />
          <div className="flex justify-between font-mono text-xs text-muted">
            <span>{formatBp(OLDEST_BP)} years ago</span>
            <span>today</span>
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        <div className="card">
          <h1 className="text-lg font-bold">Community map</h1>
          <p className="text-sm text-muted">
            Everyone&apos;s shared finds, grouped into fixed hexagons about 28 miles across so no site can be pinpointed. A cell appears once it
            holds {MIN_FINDS_PER_CELL} finds from {MIN_CONTRIBUTORS_PER_CELL} different people.
          </p>
          {loadError && <p className="note note-bad mt-2">Couldn&apos;t load the community map. Check your connection and try again.</p>}
        </div>

        {selectedCell && <CellDetail cell={selectedCell} />}

        <div className="card">
          <h3 className="card-title">What changed</h3>
          {loadError ? <p className="text-sm text-muted">Waiting for the map to load.</p> : <ChangePanel change={change} width={width} win={win} />}
        </div>

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

function CellDetail({ cell }: { cell: CommunityCell }) {
  const types = Object.entries(cell.by_type).sort((a, b) => b[1] - a[1]);
  return (
    <div className="card">
      <h3 className="card-title">Community cell</h3>
      <p className="text-sm">
        {cell.finds} finds from {cell.contributors} contributors
        {cell.avg_length_mm != null && `, averaging ${Math.round(cell.avg_length_mm)} mm`}
      </p>
      <ul className="mt-2 text-sm">
        {types.map(([name, n]) => (
          <li key={name} className="flex justify-between border-b border-dashed border-line py-0.5">
            <span>{name}</span>
            <span className="font-mono">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChangePanel({ change, width, win }: { change: ReturnType<typeof compareWindows> | null; width: number; win: TimeWindow }) {
  if (!change) return <p className="text-sm">Pick a time window to compare it with the one before it.</p>;
  if (change.kind === "empty") return <p className="text-sm">No shared finds in this window yet.</p>;
  if (change.kind === "first")
    return (
      <p className="text-sm">
        {change.finds} finds, with nothing shared from the {width.toLocaleString("en-US")} years before. This is where the record starts.
      </p>
    );
  const prev = previousWindow(win);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-base font-bold">
        Center of finds moved {Math.round(change.driftMiles).toLocaleString("en-US")} mi{change.driftMiles > 15 ? ` ${change.direction}` : ""}
      </div>
      <p className="text-muted">
        Compared with {formatBp(prev.olderBp)}–{formatBp(prev.youngerBp)} years ago. The dashed line on the map shows the shift.
      </p>
      {change.newTypes.length > 0 && (
        <div>
          New types:{" "}
          {change.newTypes.map((t) => (
            <span key={t} className="chip" style={{ borderColor: "var(--ok-ink)", color: "var(--ok-ink)" }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {change.goneTypes.length > 0 && (
        <div>
          No longer seen:{" "}
          {change.goneTypes.map((t) => (
            <span key={t} className="chip" style={{ borderColor: "var(--bad-ink)", color: "var(--bad-ink)" }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {change.avgLengthMm != null && (
        <div>
          Average point length {Math.round(change.avgLengthMm)} mm
          {change.lengthChangePct != null && ` (${change.lengthChangePct >= 0 ? "+" : ""}${Math.round(change.lengthChangePct)}%)`}
        </div>
      )}
      {change.lengthChangePct != null && change.lengthChangePct < -30 && win.olderBp <= 2500 && (
        <p className="note note-ok">Points shrink sharply here. Small arrow points replacing large dart points marks the spread of the bow and arrow.</p>
      )}
    </div>
  );
}

