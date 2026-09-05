create table public.astro_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 1 and 120),
  event_time timestamptz not null,
  location_name text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  chart jsonb not null check (jsonb_typeof(chart) = 'object'),
  gematria_results jsonb not null check (jsonb_typeof(gematria_results) = 'array'),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index astro_events_user_time_idx
  on public.astro_events(user_id, event_time desc);

alter table public.astro_events enable row level security;

create policy "Users view their astro events"
on public.astro_events for select to authenticated
using (auth.uid() = user_id);

create policy "Users delete their astro events"
on public.astro_events for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.save_astro_event_with_limit(
  p_user_id uuid,
  p_event_name text,
  p_event_time timestamptz,
  p_location_name text,
  p_latitude double precision,
  p_longitude double precision,
  p_chart jsonb,
  p_gematria_results jsonb,
  p_limit integer
)
returns table (id uuid, created_at timestamptz, allowed boolean, event_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  inserted_id uuid;
  inserted_at timestamptz;
begin
  if p_user_id is null or p_limit <= 0 then
    return query select null::uuid, null::timestamptz, false, 0;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':astro_events', 0));
  select count(*)::integer into current_count
  from public.astro_events where user_id = p_user_id;

  if current_count >= p_limit then
    return query select null::uuid, null::timestamptz, false, current_count;
    return;
  end if;

  insert into public.astro_events (
    user_id, event_name, event_time, location_name, latitude, longitude,
    chart, gematria_results
  ) values (
    p_user_id, p_event_name, p_event_time, p_location_name, p_latitude,
    p_longitude, p_chart, p_gematria_results
  ) returning astro_events.id, astro_events.created_at
    into inserted_id, inserted_at;

  return query select inserted_id, inserted_at, true, current_count + 1;
end;
$$;

revoke all on function public.save_astro_event_with_limit(
  uuid, text, timestamptz, text, double precision, double precision,
  jsonb, jsonb, integer
) from public, anon, authenticated;
grant execute on function public.save_astro_event_with_limit(
  uuid, text, timestamptz, text, double precision, double precision,
  jsonb, jsonb, integer
) to service_role;
