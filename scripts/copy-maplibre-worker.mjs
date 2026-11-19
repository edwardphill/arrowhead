// MapLibre finds its web worker relative to its own module URL, which bundling breaks.
// Copy the worker (and the shared chunk it imports) into public/ so useMap can point at it.
import { copyFileSync, mkdirSync } from "node:fs";

const from = "node_modules/maplibre-gl/dist";
const to = "public/maplibre";
mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(`${from}/${file}`, `${to}/${file}`);
