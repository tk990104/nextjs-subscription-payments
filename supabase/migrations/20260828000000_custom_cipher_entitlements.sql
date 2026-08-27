create unique index custom_ciphers_user_name_lower_idx
  on public.custom_ciphers(user_id, lower(name));

create or replace function public.create_custom_cipher_with_limit(
  p_user_id uuid,
  p_name text,
  p_description text,
  p_definition jsonb,
  p_limit integer
)
returns table (
  id uuid,
  created_at timestamptz,
  allowed boolean,
  cipher_count integer
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

  if coalesce(jsonb_typeof(p_definition), '') <> 'object'
    or coalesce(jsonb_typeof(p_definition -> 'values'), '') <> 'array'
    or coalesce(p_definition ->> 'numberMode', '') not in ('full', 'digits', 'ignore') then
    raise exception 'Invalid custom cipher definition';
  end if;

  if jsonb_array_length(p_definition -> 'values') <> 26
    or exists (
      select 1
      from jsonb_array_elements(p_definition -> 'values') as item(value)
      where jsonb_typeof(item.value) <> 'number'
        or (item.value #>> '{}')::numeric <> trunc((item.value #>> '{}')::numeric)
        or (item.value #>> '{}')::numeric not between -9999 and 9999
    ) then
    raise exception 'Invalid custom cipher definition';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':custom_ciphers', 0)
  );

  select count(*)::integer
    into current_count
    from public.custom_ciphers
   where user_id = p_user_id;

  if current_count >= p_limit then
    return query
      select null::uuid, null::timestamptz, false, current_count;
    return;
  end if;

  insert into public.custom_ciphers (
    user_id,
    name,
    description,
    definition
  )
  values (p_user_id, p_name, p_description, p_definition)
  returning custom_ciphers.id, custom_ciphers.created_at
    into inserted_id, inserted_at;

  return query select inserted_id, inserted_at, true, current_count + 1;
end;
$$;

revoke all on function public.create_custom_cipher_with_limit(uuid, text, text, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.create_custom_cipher_with_limit(uuid, text, text, jsonb, integer)
  to service_role;

comment on function public.create_custom_cipher_with_limit(uuid, text, text, jsonb, integer) is
  'Creates a validated custom cipher only when the server-provided plan limit permits it.';
