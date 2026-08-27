create table public.research_shares (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (table_id, user_id),
  foreign key (table_id, user_id)
    references public.research_tables(id, user_id) on delete cascade
);

alter table public.research_shares enable row level security;

create policy "Users view their research shares"
on public.research_shares for select to authenticated
using (auth.uid() = user_id);

create or replace function public.create_research_share(
  p_user_id uuid,
  p_table_id uuid
)
returns table (token uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.research_tables
    where id = p_table_id and user_id = p_user_id
  ) then
    raise exception 'Research table not found';
  end if;

  return query
  insert into public.research_shares (table_id, user_id)
  values (p_table_id, p_user_id)
  on conflict (table_id, user_id) do update
    set table_id = excluded.table_id
  returning research_shares.token, research_shares.created_at;
end;
$$;

create or replace function public.delete_research_share(
  p_user_id uuid,
  p_table_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.research_shares
  where user_id = p_user_id and table_id = p_table_id;
  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

revoke all on function public.create_research_share(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.delete_research_share(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.create_research_share(uuid, uuid)
  to service_role;
grant execute on function public.delete_research_share(uuid, uuid)
  to service_role;
