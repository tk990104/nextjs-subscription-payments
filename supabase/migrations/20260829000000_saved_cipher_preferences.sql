create or replace function public.save_cipher_preferences(
  p_user_id uuid,
  p_cipher_ids text[]
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null
    or p_cipher_ids is null
    or cardinality(p_cipher_ids) < 1
    or cardinality(p_cipher_ids) > 64
    or exists (
      select 1 from unnest(p_cipher_ids) as cipher_id
      where cipher_id is null
        or char_length(cipher_id) < 1
        or char_length(cipher_id) > 80
    )
  then
    raise exception 'Invalid cipher preferences';
  end if;

  insert into public.user_preferences (user_id, default_cipher_ids)
  values (p_user_id, p_cipher_ids)
  on conflict (user_id) do update
    set default_cipher_ids = excluded.default_cipher_ids;

  return p_cipher_ids;
end;
$$;

revoke all on function public.save_cipher_preferences(uuid, text[])
  from public, anon, authenticated;
grant execute on function public.save_cipher_preferences(uuid, text[])
  to service_role;

alter table public.calculation_history
  drop constraint if exists calculation_history_results_check;
alter table public.calculation_history
  add constraint calculation_history_results_check
  check (jsonb_typeof(results) in ('array', 'object'));
