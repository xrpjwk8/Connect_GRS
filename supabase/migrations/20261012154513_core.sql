-- Public tables are read through RLS. Sensitive writes use authenticated RPCs.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on private.admin_users from public, anon, authenticated;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from private.admin_users where user_id = auth.uid()) $$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('booker', 'owner')),
  real_name text not null check (length(btrim(real_name)) between 1 and 80),
  school_name text not null default '',
  department_name text not null default '',
  position text not null default '',
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (length(btrim(name)) between 1 and 80),
  region text not null check (length(btrim(region)) between 1 and 40),
  category text not null check (length(btrim(category)) between 1 and 40),
  description text not null default '' check (length(description) <= 2000),
  capacity integer not null check (capacity between 1 and 10000),
  allow_shared boolean not null default true,
  opening_minute integer not null default 1020,
  closing_minute integer not null default 1470,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  check (opening_minute between 0 and 1410 and opening_minute % 30 = 0),
  check (closing_minute > opening_minute and closing_minute <= 1800 and closing_minute % 30 = 0)
);
create index stores_owner_idx on public.stores(owner_id);
create index stores_search_idx on public.stores(region, category) where approved;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  booker_id uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  request_id uuid not null,
  is_manual boolean not null default false,
  booker_name text not null check (length(btrim(booker_name)) between 1 and 80),
  booker_affiliation text not null default '',
  service_date date not null,
  start_minute integer not null check (start_minute between 0 and 1770 and start_minute % 30 = 0),
  slot_count integer not null check (slot_count between 1 and 6),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  people integer not null check (people between 1 and 10000),
  budget_per_person integer check (budget_per_person >= 0),
  event_purpose text not null default '' check (length(event_purpose) <= 100),
  request_message text not null default '' check (length(request_message) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, request_id),
  check ((is_manual and booker_id is null) or (not is_manual and booker_id is not null)),
  check (starts_at = (service_date::timestamp + make_interval(mins => start_minute)) at time zone 'Asia/Seoul'),
  check (ends_at = starts_at + make_interval(mins => slot_count * 30))
);
create index reservations_booker_idx on public.reservations(booker_id, starts_at);
create index reservations_store_idx on public.reservations(store_id, starts_at);
create index reservations_capacity_idx on public.reservations(store_id, starts_at, ends_at)
  where status = 'confirmed';

create table public.time_blocks (
  store_id uuid not null references public.stores(id),
  service_date date not null,
  start_minute integer not null check (start_minute between 0 and 1770 and start_minute % 30 = 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  primary key (store_id, service_date, start_minute),
  check (starts_at = (service_date::timestamp + make_interval(mins => start_minute)) at time zone 'Asia/Seoul'),
  check (ends_at = starts_at + interval '30 minutes')
);
create index time_blocks_overlap_idx on public.time_blocks(store_id, starts_at, ends_at);

create table public.favorites (
  user_id uuid not null references public.profiles(id),
  store_id uuid not null references public.stores(id),
  primary key (user_id, store_id)
);

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.reservations enable row level security;
alter table public.time_blocks enable row level security;
alter table public.favorites enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy stores_public_read on public.stores for select to anon, authenticated using (approved);
create policy stores_owner_read on public.stores for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));
create policy reservations_participant_read on public.reservations for select to authenticated
  using (booker_id = (select auth.uid()) or (select private.is_admin()) or exists (
    select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())
  ));
create policy time_blocks_owner_read on public.time_blocks for select to authenticated
  using ((select private.is_admin()) or exists (
    select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())
  ));
create policy favorites_read on public.favorites for select to authenticated using (user_id = (select auth.uid()));
create policy favorites_insert on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.stores s where s.id = store_id and s.approved
  ));
create policy favorites_delete on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.profiles, public.stores, public.reservations, public.time_blocks, public.favorites
  from public, anon, authenticated;
grant select on public.stores to anon;
grant select on public.profiles, public.stores, public.reservations, public.time_blocks, public.favorites to authenticated;
grant insert, delete on public.favorites to authenticated;

create function private.require_profile(p_role text default null) returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null or (p_role is not null and v_profile.role <> p_role) then
    raise exception '인증된 사용자와 올바른 역할이 필요합니다.' using errcode = '42501';
  end if;
  return v_profile;
end $$;
revoke all on function private.require_profile(text) from public, anon, authenticated;

create function public.complete_profile(
  p_role text, p_real_name text, p_school_name text default '',
  p_department_name text default '', p_position text default ''
) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare v_user auth.users; v_profile public.profiles;
begin
  select * into v_user from auth.users where id = auth.uid();
  if v_user.id is null or (v_user.email_confirmed_at is null and v_user.phone_confirmed_at is null) then
    raise exception '이메일 또는 전화번호 인증이 필요합니다.' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('booker', 'owner') then
    raise exception '사용자 역할이 올바르지 않습니다.' using errcode = '22023';
  end if;
  if p_role = 'booker' and (v_user.email_confirmed_at is null or
      v_user.email is null or v_user.email !~* '^[^@]+@[^@]+\.ac\.kr$' or
      p_school_name is null or btrim(p_school_name) = '') then
    raise exception '인증된 학교 이메일과 학교명이 필요합니다.' using errcode = '42501';
  end if;
  -- Auth user row serializes two concurrent onboarding requests with different roles.
  perform 1 from auth.users where id = v_user.id for update;
  select * into v_profile from public.profiles where id = v_user.id;
  if v_profile.id is not null and v_profile.role <> p_role then
    raise exception '가입 후 역할을 변경할 수 없습니다.' using errcode = '42501';
  end if;
  insert into public.profiles(id, role, real_name, school_name, department_name, position)
    values(v_user.id, p_role, btrim(p_real_name), coalesce(p_school_name, ''),
      coalesce(p_department_name, ''), coalesce(p_position, ''))
  on conflict(id) do update set real_name = excluded.real_name, school_name = excluded.school_name,
    department_name = excluded.department_name, position = excluded.position
  returning * into v_profile;
  return v_profile;
end $$;

create function public.register_store(p_name text, p_region text, p_category text, p_capacity integer)
returns public.stores language plpgsql security definer set search_path = '' as $$
declare v_store public.stores;
begin
  perform private.require_profile('owner');
  insert into public.stores(owner_id, name, region, category, capacity)
    values(auth.uid(), btrim(p_name), btrim(p_region), btrim(p_category), p_capacity)
    returning * into v_store;
  return v_store;
end $$;

create function public.approve_store(p_store_id uuid, p_approved boolean)
returns public.stores language plpgsql security definer set search_path = '' as $$
declare v_store public.stores;
begin
  if not private.is_admin() then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;
  update public.stores set approved = p_approved where id = p_store_id returning * into v_store;
  if not found then raise exception '매장을 찾을 수 없습니다.' using errcode = 'P0002'; end if;
  return v_store;
end $$;

revoke all on function public.complete_profile(text,text,text,text,text),
  public.register_store(text,text,text,integer), public.approve_store(uuid,boolean) from public, anon;
grant execute on function public.complete_profile(text,text,text,text,text),
  public.register_store(text,text,text,integer), public.approve_store(uuid,boolean) to authenticated;
