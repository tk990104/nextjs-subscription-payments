drop policy if exists "Users manage their preferences"
  on public.user_preferences;
drop policy if exists "Users manage their custom ciphers"
  on public.custom_ciphers;
drop policy if exists "Users manage their research tables"
  on public.research_tables;
drop policy if exists "Users manage their research entries"
  on public.research_entries;
drop policy if exists "Users manage their calculation history"
  on public.calculation_history;

create policy "Users view their preferences"
on public.user_preferences for select to authenticated
using (auth.uid() = user_id);
create policy "Users view their custom ciphers"
on public.custom_ciphers for select to authenticated
using (auth.uid() = user_id);
create policy "Users delete their custom ciphers"
on public.custom_ciphers for delete to authenticated
using (auth.uid() = user_id);
create policy "Users view their research tables"
on public.research_tables for select to authenticated
using (auth.uid() = user_id);
create policy "Users delete their research tables"
on public.research_tables for delete to authenticated
using (auth.uid() = user_id);
create policy "Users view their research entries"
on public.research_entries for select to authenticated
using (auth.uid() = user_id);
create policy "Users delete their research entries"
on public.research_entries for delete to authenticated
using (auth.uid() = user_id);
create policy "Users view their calculation history"
on public.calculation_history for select to authenticated
using (auth.uid() = user_id);
create policy "Users delete their calculation history"
on public.calculation_history for delete to authenticated
using (auth.uid() = user_id);

create unique index research_tables_user_name_idx
  on public.research_tables(user_id, lower(name));

create or replace function public.consume_daily_usage(
  p_user_id uuid,
  p_usage_kind text,
  p_limit integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  if p_user_id is null or p_usage_kind <> 'database_match' then
    raise exception 'Invalid usage request';
  end if;

  if p_limit is not null and p_limit <= 0 then
    return -1;
  end if;

  insert into public.usage_counters (
    user_id,
    usage_date,
    usage_kind,
    usage_count
  )
  values (p_user_id, current_date, p_usage_kind, 1)
  on conflict (user_id, usage_date, usage_kind)
  do update set usage_count = public.usage_counters.usage_count + 1
  where p_limit is null
    or public.usage_counters.usage_count < p_limit
  returning usage_count into next_count;

  return coalesce(next_count, -1);
end;
$$;

create or replace function public.save_calculation_with_limit(
  p_user_id uuid,
  p_phrase text,
  p_results jsonb,
  p_limit integer
)
returns table (
  id uuid,
  created_at timestamptz,
  allowed boolean,
  entry_count integer
)
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

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':calculation_history', 0)
  );

  select count(*)::integer
    into current_count
    from public.calculation_history
   where user_id = p_user_id;

  if current_count >= p_limit then
    return query
      select null::uuid, null::timestamptz, false, current_count;
    return;
  end if;

  insert into public.calculation_history (user_id, phrase, results)
  values (p_user_id, p_phrase, p_results)
  returning calculation_history.id, calculation_history.created_at
    into inserted_id, inserted_at;

  return query select inserted_id, inserted_at, true, current_count + 1;
end;
$$;

create or replace function public.create_research_table_with_limit(
  p_user_id uuid,
  p_name text,
  p_description text,
  p_color text,
  p_limit integer
)
returns table (
  id uuid,
  created_at timestamptz,
  allowed boolean,
  table_count integer
)
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

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':research_tables', 0)
  );

  select count(*)::integer
    into current_count
    from public.research_tables
   where user_id = p_user_id;

  if current_count >= p_limit then
    return query
      select null::uuid, null::timestamptz, false, current_count;
    return;
  end if;

  insert into public.research_tables (user_id, name, description, color)
  values (p_user_id, p_name, p_description, p_color)
  returning research_tables.id, research_tables.created_at
    into inserted_id, inserted_at;

  return query select inserted_id, inserted_at, true, current_count + 1;
end;
$$;

create or replace function public.add_research_entry(
  p_user_id uuid,
  p_table_id uuid,
  p_phrase text,
  p_results jsonb,
  p_notes text,
  p_source_url text
)
returns table (id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
      from public.research_tables
     where research_tables.id = p_table_id
       and research_tables.user_id = p_user_id
  ) then
    raise exception 'Research table not found';
  end if;

  return query
  insert into public.research_entries (
    table_id,
    user_id,
    phrase,
    results,
    notes,
    source_url
  )
  values (
    p_table_id,
    p_user_id,
    p_phrase,
    p_results,
    p_notes,
    p_source_url
  )
  returning research_entries.id, research_entries.created_at;
end;
$$;

revoke all on function public.consume_daily_usage(uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.save_calculation_with_limit(uuid, text, jsonb, integer)
  from public, anon, authenticated;
revoke all on function public.create_research_table_with_limit(uuid, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.add_research_entry(uuid, uuid, text, jsonb, text, text)
  from public, anon, authenticated;

grant execute on function public.consume_daily_usage(uuid, text, integer)
  to service_role;
grant execute on function public.save_calculation_with_limit(uuid, text, jsonb, integer)
  to service_role;
grant execute on function public.create_research_table_with_limit(uuid, text, text, text, integer)
  to service_role;
grant execute on function public.add_research_entry(uuid, uuid, text, jsonb, text, text)
  to service_role;

comment on function public.consume_daily_usage(uuid, text, integer) is
  'Atomically consumes a server-authorized daily entitlement.';
comment on function public.save_calculation_with_limit(uuid, text, jsonb, integer) is
  'Saves a calculation only when the server-provided plan limit permits it.';
comment on function public.create_research_table_with_limit(uuid, text, text, text, integer) is
  'Creates a research table only when the server-provided plan limit permits it.';
