# Arrowhead Atlas

Record arrowhead finds on a private map, share them to a community map that can't be used to locate sites, and scrub through 13,000+ years to see how point types spread and changed.

This first slice covers the private catalog and the community map. The marketplace comes later (see the plan below).

## What's here

- **My finds** (`/my`): sign in with an email link, click the map to add a find, pick its point type (which dates it), material, size, land status and sharing. Exact locations are readable only by their owner, enforced by row-level security.
- **Community map** (`/`): everyone's shared finds as fixed H3 hexagons (resolution 4, about 28 miles across). A cell only appears with at least 3 finds from 2 contributors, and shared finds join the map 48 hours after they're added. A time slider filters by point-type age, and the "What changed" panel compares each window with the one before it: drift of the center of finds, new and vanished types, and average point length.
- Finds on federal or tribal land (ARPA) and on state land are flagged when recorded and marked as never sellable.

## Setup

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` (SQL editor, or `supabase db push`).
2. In Supabase Auth, add `http://localhost:3000/auth/callback` (and your deployed URL) to the redirect URLs.
3. `cp .env.example .env.local` and fill in the project URL and anon key.
4. `npm install && npm run dev`

The basemap is OpenFreeMap's keyless Positron style.

## Scripts

- `npm run dev`: local server
- `npm test`: unit tests (timeline and change detection, form validation, land rules, and a check that the point-type seed in the migration matches `src/lib/pointTypes.ts`)
- `npm run lint`, `npm run typecheck`, `npm run build`

## Where things live

- `supabase/migrations/0001_init.sql`: schema, point-type seed, row-level security, and `community_cells()`, the only public read path
- `src/lib/pointTypes.ts`: cultural periods and point types with date ranges
- `src/lib/privacy.ts`: public cell resolution and thresholds (mirrored in SQL)
- `src/lib/timeline.ts`: time windows and change detection
- `src/components/`: the two maps and the add-find form

## Plan

1. Private catalog: accounts, finds, personal map (done)
2. Community map: generalized cells, time slider, change panel (done)
3. Identification help: photos with EXIF location stripped, community typing votes, moderator-curated types
4. Marketplace: provenance documents, land-status gating (private land only; ARPA, NAGPRA and state-law checks), listings showing state only, Stripe Connect payouts, authentication tier
