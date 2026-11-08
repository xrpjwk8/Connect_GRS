-- Every operation that changes occupancy locks the SAME store row first.
-- Cross-midnight overlap is checked with absolute timestamps, not date labels.
create function private.slot_start(p_date date, p_minute integer) returns timestamptz
language sql immutable set search_path = '' as $$
  select (p_date::timestamp + make_interval(mins => p_minute)) at time zone 'Asia/Seoul'
$$;

create function private.check_reservation(
  p_store public.stores, p_date date, p_minute integer, p_count integer,
  p_people integer, p_ignore uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_start timestamptz; v_end timestamptz;
begin
  if p_date is null or p_minute is null or p_count is null or p_people is null or
      p_minute % 30 <> 0 or p_count not between 1 and 6 or
      p_minute < p_store.opening_minute or p_minute + p_count * 30 > p_store.closing_minute or
      p_people < 1 or p_people > p_store.capacity then
    raise exception '영업시간, 연속 1~6칸, 예약 인원을 확인해주세요.' using errcode = '22023';
  end if;
  v_start := private.slot_start(p_date, p_minute);
  v_end := v_start + make_interval(mins => p_count * 30);
  if v_start <= now() then
    raise exception '과거 시간에는 예약할 수 없습니다.' using errcode = '22023';
  end if;
  if exists(select 1 from public.time_blocks b where b.store_id = p_store.id
      and b.starts_at < v_end and b.ends_at > v_start) then
    raise exception '점주가 차단한 시간입니다.' using errcode = '23514';
  end if;
  if not p_store.allow_shared and exists(select 1 from public.reservations r
      where r.store_id = p_store.id and r.status = 'confirmed'
      and (p_ignore is null or r.id <> p_ignore)
      and r.starts_at < v_end and r.ends_at > v_start) then
    raise exception '이미 확정된 예약이 있습니다.' using errcode = '23514';
  end if;
  if exists (
    select 1 from generate_series(v_start, v_end - interval '30 minutes', interval '30 minutes') t(slot)
    where p_people + coalesce((select sum(r.people) from public.reservations r
      where r.store_id = p_store.id and r.status = 'confirmed'
        and (p_ignore is null or r.id <> p_ignore)
        and r.starts_at < t.slot + interval '30 minutes' and r.ends_at > t.slot), 0) > p_store.capacity
  ) then raise exception '선택 시간의 잔여 좌석이 부족합니다.' using errcode = '23514'; end if;
end $$;

create function private.lock_reservation(p_id uuid) returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare v_store_id uuid; v_res public.reservations;
begin
  select store_id into v_store_id from public.reservations where id = p_id;
  if not found then raise exception '예약을 찾을 수 없습니다.' using errcode = 'P0002'; end if;
  perform 1 from public.stores where id = v_store_id for update;
  select * into v_res from public.reservations where id = p_id for update;
  return v_res;
end $$;

create function public.request_reservation(
  p_store_id uuid, p_service_date date, p_start_minute integer, p_slot_count integer,
  p_people integer, p_request_id uuid, p_budget_per_person integer default null,
  p_event_purpose text default '', p_request_message text default ''
) returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_profile public.profiles; v_store public.stores; v_res public.reservations;
begin
  v_profile := private.require_profile('booker');
  select * into v_store from public.stores where id = p_store_id for update;
  if not found or not v_store.approved then
    raise exception '예약 가능한 매장을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  select * into v_res from public.reservations where created_by = auth.uid() and request_id = p_request_id;
  if found then
    if (v_res.store_id, v_res.service_date, v_res.start_minute, v_res.slot_count, v_res.people,
        v_res.budget_per_person, v_res.event_purpose, v_res.request_message, v_res.is_manual)
      is distinct from (p_store_id, p_service_date, p_start_minute, p_slot_count, p_people,
        p_budget_per_person, coalesce(p_event_purpose, ''), coalesce(p_request_message, ''), false) then
      raise exception '이미 사용한 요청 ID입니다.' using errcode = '22023';
    end if;
    return v_res;
  end if;
  perform private.check_reservation(v_store, p_service_date, p_start_minute, p_slot_count, p_people);
  insert into public.reservations(store_id, booker_id, created_by, request_id, booker_name,
    booker_affiliation, service_date, start_minute, slot_count, starts_at, ends_at, people,
    budget_per_person, event_purpose, request_message)
  values(p_store_id, auth.uid(), auth.uid(), p_request_id, v_profile.real_name,
    concat_ws(' ', v_profile.school_name, v_profile.department_name), p_service_date, p_start_minute,
    p_slot_count, private.slot_start(p_service_date, p_start_minute),
    private.slot_start(p_service_date, p_start_minute + p_slot_count * 30), p_people,
    p_budget_per_person, coalesce(p_event_purpose, ''), coalesce(p_request_message, ''))
  returning * into v_res;
  return v_res;
end $$;

create function public.create_manual_reservation(
  p_store_id uuid, p_service_date date, p_start_minute integer, p_slot_count integer,
  p_people integer, p_booker_name text, p_request_id uuid, p_event_purpose text default ''
) returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_res public.reservations;
begin
  perform private.require_profile('owner');
  select * into v_store from public.stores where id = p_store_id for update;
  if not found or v_store.owner_id <> auth.uid() then
    raise exception '내 매장만 관리할 수 있습니다.' using errcode = '42501';
  end if;
  select * into v_res from public.reservations where created_by = auth.uid() and request_id = p_request_id;
  if found then
    if (v_res.store_id, v_res.service_date, v_res.start_minute, v_res.slot_count, v_res.people,
        v_res.booker_name, v_res.event_purpose, v_res.is_manual)
      is distinct from (p_store_id, p_service_date, p_start_minute, p_slot_count, p_people,
        btrim(p_booker_name), coalesce(p_event_purpose, ''), true) then
      raise exception '이미 사용한 요청 ID입니다.' using errcode = '22023';
    end if;
    return v_res;
  end if;
  perform private.check_reservation(v_store, p_service_date, p_start_minute, p_slot_count, p_people);
  insert into public.reservations(store_id, created_by, request_id, is_manual, booker_name,
    service_date, start_minute, slot_count, starts_at, ends_at, people, event_purpose, status)
  values(p_store_id, auth.uid(), p_request_id, true, btrim(p_booker_name), p_service_date,
    p_start_minute, p_slot_count, private.slot_start(p_service_date, p_start_minute),
    private.slot_start(p_service_date, p_start_minute + p_slot_count * 30), p_people,
    coalesce(p_event_purpose, ''), 'confirmed') returning * into v_res;
  return v_res;
end $$;

create function public.decide_reservation(p_reservation_id uuid, p_accept boolean)
returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations; v_store public.stores; v_target text;
begin
  perform private.require_profile('owner');
  v_res := private.lock_reservation(p_reservation_id);
  select * into v_store from public.stores where id = v_res.store_id;
  if v_store.owner_id <> auth.uid() then
    raise exception '내 매장의 예약만 처리할 수 있습니다.' using errcode = '42501';
  end if;
  if p_accept is null then raise exception '수락 여부를 입력해주세요.' using errcode = '22023'; end if;
  v_target := case when p_accept then 'confirmed' else 'rejected' end;
  if v_res.status = v_target then return v_res; end if;
  if v_res.status <> 'pending' then raise exception '대기 예약만 처리할 수 있습니다.' using errcode = '22023'; end if;
  if p_accept then
    if not v_store.approved then raise exception '승인되지 않은 매장입니다.' using errcode = '42501'; end if;
    perform private.check_reservation(v_store, v_res.service_date, v_res.start_minute,
      v_res.slot_count, v_res.people, v_res.id);
  end if;
  update public.reservations set status = v_target, updated_at = now()
    where id = v_res.id returning * into v_res;
  return v_res;
end $$;

create function public.edit_reservation(
  p_reservation_id uuid, p_service_date date, p_start_minute integer, p_slot_count integer,
  p_people integer, p_budget_per_person integer default null,
  p_event_purpose text default '', p_request_message text default ''
) returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations; v_store public.stores;
begin
  perform private.require_profile('booker');
  v_res := private.lock_reservation(p_reservation_id);
  if v_res.booker_id is distinct from auth.uid() then
    raise exception '내 예약만 수정할 수 있습니다.' using errcode = '42501';
  end if;
  if v_res.status not in ('pending', 'confirmed') or v_res.starts_at <= now() then
    raise exception '시작 전 진행 중인 예약만 수정할 수 있습니다.' using errcode = '22023';
  end if;
  select * into v_store from public.stores where id = v_res.store_id;
  if not v_store.approved then raise exception '승인되지 않은 매장입니다.' using errcode = '42501'; end if;
  perform private.check_reservation(v_store, p_service_date, p_start_minute, p_slot_count, p_people, v_res.id);
  update public.reservations set service_date = p_service_date, start_minute = p_start_minute,
    slot_count = p_slot_count, starts_at = private.slot_start(p_service_date, p_start_minute),
    ends_at = private.slot_start(p_service_date, p_start_minute + p_slot_count * 30), people = p_people,
    budget_per_person = p_budget_per_person, event_purpose = coalesce(p_event_purpose, ''),
    request_message = coalesce(p_request_message, ''), status = 'pending', updated_at = now()
    where id = v_res.id returning * into v_res;
  return v_res;
end $$;

create function public.cancel_reservation(p_reservation_id uuid)
returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations; v_owner uuid;
begin
  perform private.require_profile();
  v_res := private.lock_reservation(p_reservation_id);
  select owner_id into v_owner from public.stores where id = v_res.store_id;
  if v_res.booker_id is distinct from auth.uid() and v_owner <> auth.uid() then
    raise exception '이 예약을 취소할 권한이 없습니다.' using errcode = '42501';
  end if;
  if v_res.status = 'cancelled' then return v_res; end if;
  if v_res.status not in ('pending', 'confirmed') or v_res.starts_at <= now() then
    raise exception '시작 전 진행 중인 예약만 취소할 수 있습니다.' using errcode = '22023';
  end if;
  update public.reservations set status = 'cancelled', updated_at = now()
    where id = v_res.id returning * into v_res;
  return v_res;
end $$;

create function public.complete_reservation(p_reservation_id uuid)
returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations; v_owner uuid;
begin
  perform private.require_profile('owner');
  v_res := private.lock_reservation(p_reservation_id);
  select owner_id into v_owner from public.stores where id = v_res.store_id;
  if v_owner <> auth.uid() then raise exception '내 매장의 예약만 처리할 수 있습니다.' using errcode = '42501'; end if;
  if v_res.status = 'completed' then return v_res; end if;
  if v_res.status <> 'confirmed' or v_res.ends_at > now() then
    raise exception '종료된 확정 예약만 완료할 수 있습니다.' using errcode = '22023';
  end if;
  update public.reservations set status = 'completed', updated_at = now()
    where id = v_res.id returning * into v_res;
  return v_res;
end $$;

create function public.replace_time_blocks(p_store_id uuid, p_service_date date, p_start_minutes integer[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_min integer; v_start timestamptz;
begin
  perform private.require_profile('owner');
  select * into v_store from public.stores where id = p_store_id for update;
  if not found or v_store.owner_id <> auth.uid() then
    raise exception '내 매장만 관리할 수 있습니다.' using errcode = '42501';
  end if;
  if p_service_date is null or p_service_date < (now() at time zone 'Asia/Seoul')::date
      or p_start_minutes is null then raise exception '차단 날짜와 시간을 확인해주세요.' using errcode = '22023'; end if;
  foreach v_min in array p_start_minutes loop
    if v_min is null or v_min % 30 <> 0 or v_min < v_store.opening_minute or v_min >= v_store.closing_minute then
      raise exception '영업시간 안의 30분 단위 시간을 선택해주세요.' using errcode = '22023';
    end if;
    v_start := private.slot_start(p_service_date, v_min);
    if exists(select 1 from public.reservations r where r.store_id = p_store_id and r.status = 'confirmed'
        and r.starts_at < v_start + interval '30 minutes' and r.ends_at > v_start) then
      raise exception '확정 예약과 겹치는 시간은 차단할 수 없습니다.' using errcode = '23514';
    end if;
  end loop;
  delete from public.time_blocks where store_id = p_store_id and service_date = p_service_date;
  insert into public.time_blocks(store_id, service_date, start_minute, starts_at, ends_at)
    select p_store_id, p_service_date, m, private.slot_start(p_service_date, m),
      private.slot_start(p_service_date, m + 30) from (select distinct unnest(p_start_minutes) m) slots;
end $$;

create function public.update_store_capacity(
  p_store_id uuid, p_capacity integer, p_allow_shared boolean,
  p_opening_minute integer, p_closing_minute integer
) returns public.stores language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_res public.reservations;
begin
  perform private.require_profile('owner');
  select * into v_store from public.stores where id = p_store_id for update;
  if not found or v_store.owner_id <> auth.uid() then
    raise exception '내 매장만 관리할 수 있습니다.' using errcode = '42501';
  end if;
  update public.stores set capacity = p_capacity, allow_shared = p_allow_shared,
    opening_minute = p_opening_minute, closing_minute = p_closing_minute
    where id = p_store_id returning * into v_store;
  -- Existing in-progress and future reservations must remain valid.
  for v_res in select * from public.reservations where store_id = p_store_id
      and status = 'confirmed' and ends_at > now() loop
    if v_res.people > p_capacity or v_res.start_minute < p_opening_minute or
        v_res.start_minute + v_res.slot_count * 30 > p_closing_minute then
      raise exception '기존 확정 예약을 수용할 수 없는 설정입니다.' using errcode = '23514';
    end if;
    if exists(select 1 from generate_series(v_res.starts_at, v_res.ends_at - interval '30 minutes', interval '30 minutes') t(slot)
      where (select sum(r.people) from public.reservations r where r.store_id = p_store_id and r.status = 'confirmed'
        and r.starts_at < t.slot + interval '30 minutes' and r.ends_at > t.slot) > p_capacity
      or (not p_allow_shared and (select count(*) from public.reservations r where r.store_id = p_store_id
        and r.status = 'confirmed' and r.starts_at < t.slot + interval '30 minutes' and r.ends_at > t.slot) > 1)) then
      raise exception '기존 확정 예약과 충돌하는 정원 설정입니다.' using errcode = '23514';
    end if;
  end loop;
  return v_store;
end $$;

create function public.get_availability(p_store_id uuid, p_service_date date)
returns table(start_minute integer, remaining_seats integer, blocked boolean)
language plpgsql stable security definer set search_path = '' as $$
declare v_store public.stores;
begin
  select * into v_store from public.stores where id = p_store_id;
  if not found or (not v_store.approved and v_store.owner_id is distinct from auth.uid() and not private.is_admin()) then
    raise exception '매장을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if p_service_date is null then raise exception '날짜가 필요합니다.' using errcode = '22023'; end if;
  return query
    select m.minute,
      case when a.is_blocked or (not v_store.allow_shared and a.used > 0) then 0
        else greatest(v_store.capacity - a.used, 0)::integer end,
      a.is_blocked
    from generate_series(v_store.opening_minute, v_store.closing_minute - 30, 30) m(minute)
    cross join lateral (select private.slot_start(p_service_date, m.minute) t) ts
    cross join lateral (select
      ts.t <= now() or exists(select 1 from public.time_blocks b where b.store_id = p_store_id
        and b.starts_at < ts.t + interval '30 minutes' and b.ends_at > ts.t) is_blocked,
      coalesce((select sum(r.people) from public.reservations r where r.store_id = p_store_id
        and r.status = 'confirmed' and r.starts_at < ts.t + interval '30 minutes' and r.ends_at > ts.t), 0) used
    ) a;
end $$;

create function public.search_stores(
  p_region text default null, p_category text default null, p_service_date date default null,
  p_start_minute integer default null, p_slot_count integer default 1, p_people integer default 1
) returns setof public.stores language plpgsql stable security definer set search_path = '' as $$
begin
  if p_slot_count is null or p_slot_count not between 1 and 6 or p_people is null or p_people < 1 or
    (p_start_minute is not null and (p_service_date is null or p_start_minute % 30 <> 0)) then
    raise exception '검색 날짜, 시간, 인원을 확인해주세요.' using errcode = '22023';
  end if;
  return query select s.* from public.stores s where s.approved and s.capacity >= p_people
    and (p_region is null or s.region = p_region)
    and (p_category is null or s.category = p_category)
    and (p_service_date is null or exists (
      with slots as materialized (select * from public.get_availability(s.id, p_service_date))
      select 1 from slots first_slot
      where (p_start_minute is null or first_slot.start_minute = p_start_minute)
        and (select count(*) from slots a where a.start_minute >= first_slot.start_minute
          and a.start_minute < first_slot.start_minute + p_slot_count * 30
          and not a.blocked and a.remaining_seats >= p_people) = p_slot_count
    )) order by s.name, s.id;
end $$;

revoke all on function private.slot_start(date,integer),
  private.check_reservation(public.stores,date,integer,integer,integer,uuid),
  private.lock_reservation(uuid) from public, anon, authenticated;

-- Explicitly grant only public entry points; PostgreSQL defaults EXECUTE to PUBLIC.
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(array[
      'request_reservation','create_manual_reservation','decide_reservation','edit_reservation',
      'cancel_reservation','complete_reservation','replace_time_blocks','update_store_capacity',
      'get_availability','search_stores'
    ]) loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to authenticated', f.signature);
  end loop;
end $$;
grant execute on function public.get_availability(uuid,date),
  public.search_stores(text,text,date,integer,integer,integer) to anon;
