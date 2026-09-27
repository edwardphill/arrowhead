-- Arrowhead Atlas: initial schema.
-- Exact find locations are readable only by their owner (row-level security).
-- The public map reads nothing but community_cells(), which returns coarse H3 cells
-- that clear a minimum-finds and minimum-contributors threshold.

create extension if not exists postgis with schema extensions;

create type public.land_status as enum ('own', 'permission', 'state', 'federal', 'tribal', 'unknown');
create type public.find_visibility as enum ('private', 'community');

-- Curated reference table. Years are "before present" (present = 1950).
-- Mirrors src/lib/pointTypes.ts.
create table public.point_types (
  id text primary key,
  name text not null unique,
  period text not null check (period in ('paleo', 'early', 'middle', 'late', 'wood', 'lp')),
  start_bp integer not null,
  end_bp integer not null,
  shape text not null,
  min_length_mm integer not null,
  max_length_mm integer not null,
  check (end_bp < start_bp)
);

alter table public.point_types enable row level security;
create policy "Point types are readable by everyone" on public.point_types for select using (true);

insert into public.point_types (id, name, period, start_bp, end_bp, shape, min_length_mm, max_length_mm) values
  ('clovis', 'Clovis', 'paleo', 13050, 12750, 'fluted', 50, 120),
  ('folsom', 'Folsom', 'paleo', 12800, 12200, 'fluted', 35, 70),
  ('cumberland', 'Cumberland', 'paleo', 12800, 12000, 'fluted', 50, 100),
  ('dalton', 'Dalton', 'paleo', 12500, 11000, 'lance', 40, 90),
  ('agate-basin', 'Agate Basin', 'paleo', 12300, 11500, 'lance', 60, 140),
  ('big-sandy', 'Big Sandy', 'early', 10500, 9500, 'side', 30, 65),
  ('kirk-corner-notched', 'Kirk Corner-Notched', 'early', 10000, 8900, 'corner', 35, 90),
  ('lecroy', 'LeCroy', 'early', 9000, 8500, 'bifurc', 25, 50),
  ('stanly', 'Stanly', 'middle', 8000, 7500, 'stem', 40, 80),
  ('morrow-mountain', 'Morrow Mountain', 'middle', 7500, 6500, 'stem', 35, 75),
  ('pinto', 'Pinto', 'middle', 8000, 5000, 'bifurc', 30, 60),
  ('northern-side-notched', 'Northern Side-Notched', 'middle', 7500, 5000, 'side', 25, 55),
  ('brewerton', 'Brewerton', 'late', 5000, 4000, 'corner', 25, 55),
  ('lamoka', 'Lamoka', 'late', 4500, 4000, 'stem', 30, 55),
  ('savannah-river', 'Savannah River', 'late', 5000, 3500, 'stem', 50, 120),
  ('mckean', 'McKean', 'late', 5000, 3500, 'bifurc', 30, 60),
  ('elko', 'Elko', 'late', 3500, 1300, 'corner', 30, 55),
  ('adena-stemmed', 'Adena Stemmed', 'wood', 2800, 2100, 'stem', 50, 110),
  ('snyders', 'Snyders', 'wood', 2200, 1800, 'corner', 50, 100),
  ('rose-spring', 'Rose Spring', 'wood', 1500, 800, 'corner', 18, 35),
  ('madison', 'Madison', 'lp', 1150, 350, 'tri', 15, 35),
  ('cahokia', 'Cahokia', 'lp', 1000, 700, 'side', 20, 40),
  ('washita', 'Washita', 'lp', 800, 400, 'side', 15, 30),
  ('desert-side-notched', 'Desert Side-Notched', 'lp', 800, 150, 'side', 15, 30),
  ('gunther-barbed', 'Gunther Barbed', 'lp', 1000, 150, 'stem', 15, 35);

create table public.finds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type_id text not null references public.point_types (id),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  location extensions.geography(Point, 4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(lon, lat), 4326)::extensions.geography) stored,
  -- H3 cell (resolution 4) computed by the app from lat/lon. The only location others ever see.
  public_cell text not null,
  material text,
  length_mm integer check (length_mm between 5 and 400),
  date_found date,
  land public.land_status not null default 'unknown',
  visibility public.find_visibility not null default 'private',
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index finds_owner_idx on public.finds (owner_id, created_at desc);
create index finds_public_cell_idx on public.finds (public_cell) where visibility = 'community';
create index finds_location_idx on public.finds using gist (location);

alter table public.finds enable row level security;
create policy "Owners read their finds" on public.finds for select using (owner_id = auth.uid());
create policy "Owners add finds" on public.finds for insert with check (owner_id = auth.uid());
create policy "Owners edit their finds" on public.finds for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners delete their finds" on public.finds for delete using (owner_id = auth.uid());

-- Public, aggregated view of shared finds whose type range overlaps [younger_bp, older_bp].
-- Cells appear only with >= 3 finds from >= 2 contributors, and shared finds join the
-- public map 48 hours after they are added. Thresholds mirror src/lib/privacy.ts.
create function public.community_cells(younger_bp integer, older_bp integer)
returns table (
  cell text,
  finds integer,
  contributors integer,
  by_period jsonb,
  by_type jsonb,
  avg_length_mm numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with shared as (
    select f.public_cell, f.owner_id, f.length_mm, t.period, t.name
    from finds f
    join point_types t on t.id = f.type_id
    where f.visibility = 'community'
      and f.created_at < now() - interval '48 hours'
      and t.end_bp <= older_bp
      and t.start_bp >= younger_bp
  ),
  cells as (
    select public_cell, count(*)::integer as n, count(distinct owner_id)::integer as c, avg(length_mm) as len
    from shared
    group by public_cell
    having count(*) >= 3 and count(distinct owner_id) >= 2
  )
  select
    cells.public_cell,
    cells.n,
    cells.c,
    (select jsonb_object_agg(p.period, p.k)
       from (select period, count(*) as k from shared s where s.public_cell = cells.public_cell group by period) p),
    (select jsonb_object_agg(q.name, q.k)
       from (select name, count(*) as k from shared s where s.public_cell = cells.public_cell group by name) q),
    round(cells.len, 1)
  from cells;
$$;

revoke all on function public.community_cells(integer, integer) from public;
grant execute on function public.community_cells(integer, integer) to anon, authenticated;
