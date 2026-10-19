import { publicCellFor } from "../privacy";
import { POINT_TYPE_BY_ID } from "../pointTypes";
import type { SharedFind } from "../communityCells";

// Made-up community finds for demo mode, generated the same way on every load.
// Each type is placed around places where it is typically found, in small clusters
// from several collectors so that cells clear the community-map thresholds.

type Region = [lat: number, lon: number];

const REGIONS: Record<string, Region[]> = {
  clovis: [[34.2, -103.3], [36.1, -86.7], [33.6, -97.1], [40.2, -82.9], [37.4, -79.6]],
  folsom: [[36.9, -103.9], [40.6, -105.1], [44.2, -103.4], [35.2, -101.8]],
  cumberland: [[36.4, -87.9], [37.1, -85.5], [34.7, -86.6], [35.9, -84.2]],
  dalton: [[36.2, -90.6], [37.7, -91.8], [35.3, -92.4], [33.9, -88.7], [38.6, -90.3]],
  "agate-basin": [[42.8, -104.6], [44.9, -101.2], [46.8, -100.8], [41.1, -102.0]],
  "big-sandy": [[35.4, -88.1], [33.7, -85.9], [34.9, -84.0], [32.4, -86.7]],
  "kirk-corner-notched": [[35.6, -80.4], [37.2, -81.4], [36.0, -78.7], [38.9, -77.4], [34.6, -82.6]],
  lecroy: [[35.1, -85.3], [38.4, -82.4], [39.5, -78.0], [40.3, -76.9]],
  stanly: [[35.4, -80.1], [34.9, -81.2], [36.6, -79.4]],
  "morrow-mountain": [[35.4, -80.1], [34.3, -83.4], [36.1, -82.0], [33.2, -86.2]],
  pinto: [[35.0, -116.4], [38.9, -117.6], [39.6, -114.2], [36.2, -115.3]],
  "northern-side-notched": [[42.6, -113.9], [43.7, -107.2], [45.3, -110.1], [40.5, -116.1]],
  brewerton: [[42.9, -76.1], [43.2, -78.6], [41.6, -83.5], [44.1, -73.8]],
  lamoka: [[42.4, -77.0], [42.0, -75.1], [41.1, -78.9]],
  "savannah-river": [[33.3, -81.9], [32.1, -81.3], [34.4, -79.9], [31.7, -84.2], [35.6, -78.1]],
  mckean: [[44.3, -104.9], [46.0, -108.4], [43.0, -107.3], [45.7, -102.1]],
  elko: [[40.8, -115.8], [39.4, -118.8], [41.3, -112.6], [38.5, -114.5]],
  "adena-stemmed": [[39.3, -82.9], [38.4, -84.5], [39.9, -81.0], [38.9, -86.1]],
  snyders: [[39.4, -90.6], [40.6, -89.6], [38.7, -91.7], [41.5, -87.6]],
  "rose-spring": [[36.6, -117.9], [38.5, -119.4], [40.0, -117.2], [37.6, -113.1]],
  madison: [[38.7, -90.1], [41.9, -88.4], [40.1, -84.5], [43.1, -89.4], [36.2, -86.8], [42.3, -79.6]],
  cahokia: [[38.66, -90.06], [38.2, -89.6], [39.1, -90.9]],
  washita: [[35.4, -98.4], [36.7, -100.9], [34.2, -97.3], [37.7, -98.9]],
  "desert-side-notched": [[37.2, -112.0], [39.8, -119.7], [35.6, -114.3], [41.9, -117.0], [34.1, -117.3]],
  "gunther-barbed": [[40.6, -122.4], [41.8, -123.1], [42.3, -121.0], [39.7, -121.8]],
};

/** Mulberry32: a small seeded PRNG so the sample data is identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLLECTORS = 14;
const CREATED_AT = "2026-01-01T00:00:00.000Z";

function generate(): SharedFind[] {
  const rand = rng(1950);
  const finds: SharedFind[] = [];
  for (const [typeId, regions] of Object.entries(REGIONS)) {
    const [minLen, maxLen] = POINT_TYPE_BY_ID[typeId].lengthMm;
    for (const [lat, lon] of regions) {
      // A few clusters around each region, each with finds from 2-4 collectors.
      const clusters = 2 + Math.floor(rand() * 3);
      for (let c = 0; c < clusters; c++) {
        const cLat = lat + (rand() - 0.5) * 2.4;
        const cLon = lon + (rand() - 0.5) * 3;
        const n = 3 + Math.floor(rand() * 6);
        const first = Math.floor(rand() * COLLECTORS);
        for (let i = 0; i < n; i++) {
          const fLat = cLat + (rand() - 0.5) * 0.12;
          const fLon = cLon + (rand() - 0.5) * 0.12;
          finds.push({
            owner: `collector-${(first + (i % (2 + Math.floor(rand() * 3)))) % COLLECTORS}`,
            type_id: typeId,
            public_cell: publicCellFor(fLat, fLon),
            length_mm: Math.round(minLen + rand() * (maxLen - minLen)),
            visibility: "community",
            created_at: CREATED_AT,
          });
        }
      }
    }
  }
  return finds;
}

let cache: SharedFind[] | null = null;

export function sampleCommunityFinds(): SharedFind[] {
  cache ??= generate();
  return cache;
}
