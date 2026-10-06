-- The House of Vale — schema inicial
-- Princípios: RLS deny-by-default; user_id SEMPRE derivado de auth.uid() (nunca do cliente).
-- game_state / discovered_documents do plano original foram consolidados em game_saves.data (jsonb versionado);
-- ver docs/ARCHITECTURE.md §6.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 64),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Cria o profile automaticamente no signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), 64));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- game_saves
create table public.game_saves (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slot           smallint not null check (slot between 1 and 3),
  schema_version integer not null check (schema_version >= 1),
  data           jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 524288),
  area_label     text check (char_length(area_label) <= 64),
  progress_pct   numeric(5, 2) not null default 0 check (progress_pct between 0 and 100),
  playtime_sec   integer not null default 0 check (playtime_sec >= 0),
  rev            integer not null default 1 check (rev >= 1),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, slot)
);

alter table public.game_saves enable row level security;

create policy "saves: read own" on public.game_saves
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: insert own" on public.game_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: update own" on public.game_saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: delete own" on public.game_saves
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Escrita com controle otimista de concorrência (compare-and-swap em rev).
-- security invoker: RLS continua valendo; user_id vem de auth.uid().
-- p_base_rev = rev que o cliente viu por último (0 = "nunca sincronizado").
-- Retorna conflict = true sem escrever quando a nuvem tem uma revisão diferente da esperada.
create function public.save_game(
  p_slot smallint,
  p_schema_version integer,
  p_data jsonb,
  p_area_label text,
  p_progress_pct numeric,
  p_playtime_sec integer,
  p_base_rev integer
)
returns table (rev integer, updated_at timestamptz, conflict boolean)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_current integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select s.rev into v_current
  from public.game_saves s
  where s.user_id = v_uid and s.slot = p_slot
  for update;

  if v_current is null then
    if p_base_rev <> 0 then
      -- Cliente acha que existia um save remoto, mas ele foi apagado: conflito.
      return query select 0, now(), true;
      return;
    end if;
    return query
      with ins as (
        insert into public.game_saves as s (user_id, slot, schema_version, data, area_label, progress_pct, playtime_sec, rev)
        values (v_uid, p_slot, p_schema_version, p_data, p_area_label, p_progress_pct, p_playtime_sec, 1)
        returning s.rev, s.updated_at
      )
      select ins.rev, ins.updated_at, false from ins;
    return;
  end if;

  if v_current <> p_base_rev then
    return query select s.rev, s.updated_at, true from public.game_saves s where s.user_id = v_uid and s.slot = p_slot;
    return;
  end if;

  return query
    with upd as (
      update public.game_saves as s
      set schema_version = p_schema_version,
          data = p_data,
          area_label = p_area_label,
          progress_pct = p_progress_pct,
          playtime_sec = p_playtime_sec,
          rev = s.rev + 1,
          updated_at = now()
      where s.user_id = v_uid and s.slot = p_slot
      returning s.rev, s.updated_at
    )
    select upd.rev, upd.updated_at, false from upd;
end;
$$;

revoke execute on function public.save_game(smallint, integer, jsonb, text, numeric, integer, integer) from public, anon;
grant execute on function public.save_game(smallint, integer, jsonb, text, numeric, integer, integer) to authenticated;

-- ---------------------------------------------------------------- achievements (por conta, entre saves)
create table public.achievements (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement text not null check (char_length(achievement) <= 64),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement)
);

alter table public.achievements enable row level security;

create policy "achievements: read own" on public.achievements
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "achievements: insert own" on public.achievements
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- game_events (analytics, insert-only)
create table public.game_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event      text not null check (char_length(event) <= 64),
  payload    jsonb not null default '{}'::jsonb check (octet_length(payload::text) <= 4096),
  created_at timestamptz not null default now()
);

create index game_events_user_created_idx on public.game_events (user_id, created_at desc);

alter table public.game_events enable row level security;

create policy "events: insert own" on public.game_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
