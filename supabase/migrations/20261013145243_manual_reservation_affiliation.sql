-- Append an optional affiliation argument; existing named/positional callers still work.
-- Representative name remains required; never derive it from affiliation.
drop function public.create_manual_reservation(uuid,date,integer,integer,integer,text,uuid,text);
drop function private.create_manual_reservation(uuid,date,integer,integer,integer,text,uuid,text);
create function private.create_manual_reservation(
  p_store_id uuid, p_service_date date, p_start_minute integer, p_slot_count integer,
  p_people integer, p_booker_name text, p_request_id uuid, p_event_purpose text default '', p_booker_affiliation text default ''
) returns public.reservations language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_res public.reservations;
begin
  perform private.require_profile('owner');
  if p_booker_name is null or length(btrim(p_booker_name)) not between 1 and 80 then
    raise exception '대표 예약자명을 입력해주세요.' using errcode = '22023';
  end if;
  if length(coalesce(p_booker_affiliation, '')) > 160 then
    raise exception '소속/단체명은 160자 이내로 입력해주세요.' using errcode = '22023';
  end if;
  select * into v_store from public.stores where id = p_store_id for update;
  if not found or v_store.owner_id <> auth.uid() then
    raise exception '내 매장만 관리할 수 있습니다.' using errcode = '42501';
  end if;
  select * into v_res from public.reservations where created_by = auth.uid() and request_id = p_request_id;
  if found then
    if (v_res.store_id, v_res.service_date, v_res.start_minute, v_res.slot_count, v_res.people,
        v_res.booker_name, v_res.event_purpose, v_res.is_manual, v_res.booker_affiliation)
      is distinct from (p_store_id, p_service_date, p_start_minute, p_slot_count, p_people,
        btrim(p_booker_name), coalesce(p_event_purpose, ''), true, btrim(coalesce(p_booker_affiliation, ''))) then
      raise exception '이미 사용한 요청 ID입니다.' using errcode = '22023';
    end if;
    return v_res;
  end if;
  perform private.check_reservation(v_store, p_service_date, p_start_minute, p_slot_count, p_people);
  insert into public.reservations(store_id, created_by, request_id, is_manual, booker_name, booker_affiliation,
    service_date, start_minute, slot_count, starts_at, ends_at, people, event_purpose, status)
  values(p_store_id, auth.uid(), p_request_id, true, btrim(p_booker_name), btrim(coalesce(p_booker_affiliation, '')), p_service_date,
    p_start_minute, p_slot_count, private.slot_start(p_service_date, p_start_minute),
    private.slot_start(p_service_date, p_start_minute + p_slot_count * 30), p_people,
    coalesce(p_event_purpose, ''), 'confirmed') returning * into v_res;
  return v_res;
end $$;

create function public.create_manual_reservation(
  p_store_id uuid, p_service_date date, p_start_minute integer, p_slot_count integer,
  p_people integer, p_booker_name text, p_request_id uuid, p_event_purpose text default '',
  p_booker_affiliation text default ''
) returns public.reservations language sql security invoker set search_path = '' as $$
 select private.create_manual_reservation(p_store_id,p_service_date,p_start_minute,p_slot_count,
 p_people,p_booker_name,p_request_id,p_event_purpose,p_booker_affiliation);
$$;
revoke all on function public.create_manual_reservation(uuid,date,integer,integer,integer,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_manual_reservation(uuid,date,integer,integer,integer,text,uuid,text,text) to authenticated;
revoke all on function private.create_manual_reservation(uuid,date,integer,integer,integer,text,uuid,text,text) from public,anon,authenticated;
grant execute on function private.create_manual_reservation(uuid,date,integer,integer,integer,text,uuid,text,text) to authenticated;
