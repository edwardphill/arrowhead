"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

// Free, keyless vector basemap.
const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Creates a MapLibre map centered on the continental US and returns it once its style has loaded. */
export function useMap(options: Partial<maplibregl.MapOptions> = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!containerRef.current) return;
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [-96, 38.5],
      zoom: 3.4,
      attributionControl: { compact: true },
      ...optionsRef.current,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("load", () => setMap(m));
    return () => {
      setMap(null);
      m.remove();
    };
  }, []);

  return { containerRef, map };
}

/** Adds or replaces the data of a GeoJSON source. */
export function setGeoJson(map: maplibregl.Map, id: string, data: GeoJSON.FeatureCollection) {
  const src = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (src) src.setData(data);
  else map.addSource(id, { type: "geojson", data });
}
