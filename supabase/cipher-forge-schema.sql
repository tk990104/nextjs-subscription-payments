-- Source: supabase/migrations/20230530034630_init.sql
/** 
* USERS
* Note: This table contains user data. Users should only be able to view and update their own data.
*/
create table users (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  -- The customer's billing address, stored in JSON format.
  billing_address jsonb,
  -- Stores your customer's payment instruments.
  payment_method jsonb
);
alter table users enable row level security;
create policy "Can view own user data." on users for select using (auth.uid() = id);
create policy "Can update own user data." on users for update using (auth.uid() = id);

/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/ 
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
* CUSTOMERS
* Note: this is a private table that contains a mapping of user IDs to Stripe customer IDs.
*/
create table customers (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  -- The user's customer ID in Stripe. User must not be able to update this.
  stripe_customer_id text
);
alter table customers enable row level security;
-- No policies as this is a private table that the user must not have access to.

/** 
* PRODUCTS
* Note: products are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create table products (
  -- Product ID from Stripe, e.g. prod_1234.
  id text primary key,
  -- Whether the product is currently available for purchase.
  active boolean,
  -- The product's name, meant to be displayable to the customer. Whenever this product is sold via a subscription, name will show up on associated invoice line item descriptions.
  name text,
  -- The product's description, meant to be displayable to the customer. Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.
  description text,
  -- A URL of the product image in Stripe, meant to be displayable to the customer.
  image text,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table products enable row level security;
create policy "Allow public read-only access." on products for select using (true);

/**
* PRICES
* Note: prices are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create table prices (
  -- Price ID from Stripe, e.g. price_1234.
  id text primary key,
  -- The ID of the prduct that this price belongs to.
  product_id text references products, 
  -- Whether the price can be used for new purchases.
  active boolean,
  -- A brief description of the price.
  description text,
  -- The unit amount as a positive integer in the smallest currency unit (e.g., 100 cents for US$1.00 or 100 for ¥100, a zero-decimal currency).
  unit_amount bigint,
  -- Three-letter ISO currency code, in lowercase.
  currency text check (char_length(currency) = 3),
  -- One of `one_time` or `recurring` depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.
  type pricing_type,
  -- The frequency at which a subscription is billed. One of `day`, `week`, `month` or `year`.
  interval pricing_plan_interval,
  -- The number of intervals (specified in the `interval` attribute) between subscription billings. For example, `interval=month` and `interval_count=3` bills every 3 months.
  interval_count integer,
  -- Default number of trial days when subscribing a customer to this price using [`trial_from_plan=true`](https://stripe.com/docs/api#create_subscription-trial_from_plan).
  trial_period_days integer,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table prices enable row level security;
create policy "Allow public read-only access." on prices for select using (true);

/**
* SUBSCRIPTIONS
* Note: subscriptions are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
create table subscriptions (
  -- Subscription ID from Stripe, e.g. sub_1234.
  id text primary key,
  user_id uuid references auth.users not null,
  -- The status of the subscription object, one of subscription_status type above.
  status subscription_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- ID of the price that created this subscription.
  price_id text references prices,
  -- Quantity multiplied by the unit amount of the price creates the amount of the subscription. Can be used to charge multiple seats.
  quantity integer,
  -- If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
  cancel_at_period_end boolean,
  -- Time at which the subscription was created.
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Start of the current period that the subscription has been invoiced for.
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  -- End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  -- If the subscription has ended, the timestamp of the date the subscription ended.
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  -- A date in the future at which the subscription will automatically get canceled.
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state.
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the beginning of that trial.
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the end of that trial.
  trial_end timestamp with time zone default timezone('utc'::text, now())
);
alter table subscriptions enable row level security;
create policy "Can only view own subs data." on subscriptions for select using (auth.uid() = user_id);

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table products, prices;

-- Source: supabase/migrations/20260826000000_gematria_foundation.sql
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_cipher_ids text[] not null default array['english-ordinal', 'full-reduction', 'reverse-ordinal', 'reverse-reduction'],
  display_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(display_settings) = 'object'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table public.custom_ciphers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, name)
);

create table public.research_tables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text,
  color text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (id, user_id)
);

create table public.research_entries (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase text not null check (char_length(phrase) between 1 and 500),
  results jsonb not null default '{}'::jsonb,
  notes text,
  source_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  foreign key (table_id, user_id)
    references public.research_tables(id, user_id) on delete cascade
);

create table public.calculation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase text not null check (char_length(phrase) between 1 and 500),
  results jsonb not null check (jsonb_typeof(results) = 'object'),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.phrase_corpus (
  id bigint generated by default as identity primary key,
  phrase text not null unique check (char_length(phrase) between 1 and 500),
  category text,
  source text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table public.phrase_cipher_values (
  phrase_id bigint not null references public.phrase_corpus(id) on delete cascade,
  cipher_id text not null,
  value bigint not null,
  primary key (phrase_id, cipher_id)
);

create index phrase_cipher_values_lookup_idx
  on public.phrase_cipher_values(cipher_id, value);
create index research_entries_table_created_idx
  on public.research_entries(table_id, created_at desc);
create index calculation_history_user_created_idx
  on public.calculation_history(user_id, created_at desc);

create table public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  usage_kind text not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  primary key (user_id, usage_date, usage_kind)
);

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute procedure public.set_updated_at();
create trigger custom_ciphers_set_updated_at
before update on public.custom_ciphers
for each row execute procedure public.set_updated_at();
create trigger research_tables_set_updated_at
before update on public.research_tables
for each row execute procedure public.set_updated_at();
create trigger research_entries_set_updated_at
before update on public.research_entries
for each row execute procedure public.set_updated_at();
create trigger phrase_corpus_set_updated_at
before update on public.phrase_corpus
for each row execute procedure public.set_updated_at();

alter table public.user_preferences enable row level security;
alter table public.custom_ciphers enable row level security;
alter table public.research_tables enable row level security;
alter table public.research_entries enable row level security;
alter table public.calculation_history enable row level security;
alter table public.phrase_corpus enable row level security;
alter table public.phrase_cipher_values enable row level security;
alter table public.usage_counters enable row level security;

create policy "Users manage their preferences"
on public.user_preferences for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their custom ciphers"
on public.custom_ciphers for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their research tables"
on public.research_tables for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their research entries"
on public.research_entries for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their calculation history"
on public.calculation_history for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users view their usage counters"
on public.usage_counters for select to authenticated
using (auth.uid() = user_id);
create policy "Active corpus phrases are readable"
on public.phrase_corpus for select to anon, authenticated
using (is_active);
create policy "Active corpus values are readable"
on public.phrase_cipher_values for select to anon, authenticated
using (
  exists (
    select 1 from public.phrase_corpus
    where phrase_corpus.id = phrase_cipher_values.phrase_id
      and phrase_corpus.is_active
  )
);

comment on table public.usage_counters is
  'Updated only by trusted server code; clients may read their own counters.';

-- Source: supabase/migrations/20260827000000_server_enforced_entitlements.sql
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

-- Source: supabase/migrations/20260828000000_custom_cipher_entitlements.sql
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

-- Source: supabase/migrations/20260829000000_saved_cipher_preferences.sql
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

-- Source: supabase/migrations/20260830000000_research_shares.sql
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

-- Source: supabase/migrations/20260831000000_astro_events.sql
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
