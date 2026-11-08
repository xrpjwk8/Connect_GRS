-- Same reservation/seat allocation; one completed transfer per reservation.
alter table public.reservations add column chat_epoch integer not null default 0 check(chat_epoch in (0,1));
alter table public.chat_messages add column chat_epoch integer not null default 0 check(chat_epoch in (0,1));
alter table public.notifications add column chat_epoch integer not null default 0;
alter table public.notifications add column transfer_id uuid;
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check(kind in
 ('reservation_requested','reservation_confirmed','reservation_rejected','reservation_cancelled','chat_message','reservation_transferred'));

create table public.reservation_transfers (
 id uuid primary key default gen_random_uuid(),
 reservation_id uuid not null references public.reservations(id),
 from_user_id uuid not null references public.profiles(id),
 to_user_id uuid references public.profiles(id),
 owner_id uuid not null references public.profiles(id),
 store_id uuid not null references public.stores(id),
 store_name text not null, region text not null,
 service_date date not null, start_minute integer not null, slot_count integer not null,
 starts_at timestamptz not null, ends_at timestamptz not null, people integer not null,
 terms text not null check(length(btrim(terms)) between 1 and 1000),
 no_deposit_confirmed boolean not null check(no_deposit_confirmed),
 from_name text not null, from_affiliation text not null,
 to_name text, to_affiliation text,
 status text not null default 'active' check(status in ('active','completed','withdrawn','cancelled')),
 created_at timestamptz not null default clock_timestamp(), completed_at timestamptz,
 claim_request_id uuid,
 check((status='completed') = (to_user_id is not null and completed_at is not null and claim_request_id is not null)),
 check(from_user_id is distinct from to_user_id)
);
create unique index transfer_one_active on public.reservation_transfers(reservation_id) where status='active';
create unique index transfer_one_completed on public.reservation_transfers(reservation_id) where status='completed';
create unique index transfer_claim_retry on public.reservation_transfers(to_user_id,claim_request_id) where claim_request_id is not null;
create index transfer_board on public.reservation_transfers(created_at desc,id desc) where status='active';
create index transfer_from on public.reservation_transfers(from_user_id,created_at desc);
create index transfer_to on public.reservation_transfers(to_user_id);
create index transfer_owner on public.reservation_transfers(owner_id);
create index transfer_store on public.reservation_transfers(store_id);
alter table public.notifications add constraint notifications_transfer_id_fkey foreign key(transfer_id) references public.reservation_transfers(id);
create index notifications_transfer_idx on public.notifications(transfer_id) where transfer_id is not null;
create index chat_epoch_history on public.chat_messages(reservation_id,chat_epoch,created_at desc,id desc);
alter table public.reservation_transfers enable row level security;
revoke all on public.reservation_transfers from public,anon,authenticated;
grant select on public.reservation_transfers to authenticated;
create policy transfer_participant_read on public.reservation_transfers for select to authenticated
 using(auth.uid() in (from_user_id,to_user_id,owner_id));

-- Deliberately select public fields; never serialize the reservation or its private notes.
create function private.transfer_payload(t public.reservation_transfers) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',t.id,'store_id',t.store_id,'store_name',t.store_name,'region',t.region,
 'service_date',t.service_date,'start_minute',t.start_minute,'slot_count',t.slot_count,
 'starts_at',t.starts_at,'ends_at',t.ends_at,'people',t.people,'terms',t.terms,'created_at',t.created_at,
 'status',case when t.status='active' and t.starts_at<=statement_timestamp() then 'expired' else t.status end,
 'completed_at',t.completed_at,'is_mine',t.from_user_id=auth.uid(),
 'is_recipient',coalesce(t.to_user_id=auth.uid(),false),'is_owner',t.owner_id=auth.uid()) ||
 case when auth.uid() in(t.from_user_id,t.to_user_id,t.owner_id) then
 jsonb_build_object('reservation_id',t.reservation_id,'from_name',t.from_name,'from_affiliation',t.from_affiliation,
 'to_name',t.to_name,'to_affiliation',t.to_affiliation) else '{}'::jsonb end
$$;
revoke all on function private.transfer_payload(public.reservation_transfers) from public,anon,authenticated;

create function private.list_transfers(p_date date default null,p_minute integer default null,p_people integer default null,
 p_region text default '',p_limit integer default 20,p_before_time timestamptz default null,p_before_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_profile('booker');
 if p_limit is null or p_limit not between 1 and 50 or (p_minute is not null and p_minute not between 0 and 1770)
 or (p_people is not null and p_people not between 1 and 10000)
 or (p_before_time is null) <> (p_before_id is null) then raise exception '검색 조건을 확인해주세요.' using errcode='22023'; end if;
 return (select coalesce(jsonb_agg(private.transfer_payload(x) order by x.created_at desc,x.id desc),'[]') from (
 select t.* from public.reservation_transfers t join public.stores s on s.id=t.store_id
 where t.status='active' and t.starts_at>statement_timestamp() and s.approved
 and (p_date is null or t.service_date=p_date) and (p_minute is null or t.start_minute=p_minute)
 and (p_people is null or t.people=p_people) and (coalesce(p_region,'')='' or position(p_region in t.region)>0)
 and (p_before_time is null or (t.created_at,t.id)<(p_before_time,p_before_id))
 order by t.created_at desc,t.id desc limit p_limit) x);
end $$;
create function private.get_transfer(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare t public.reservation_transfers; p public.profiles;
begin
 p:=private.require_profile();
 select * into t from public.reservation_transfers where id=p_id;
 if t.id is null or (p.role<>'booker' and t.owner_id<>auth.uid()) then raise exception '양도를 조회할 수 없습니다.' using errcode='P0002'; end if;
 return private.transfer_payload(t);
end $$;
create function private.my_transfers() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_profile();
 return (select coalesce(jsonb_agg(private.transfer_payload(t) order by t.created_at desc,t.id desc),'[]')
 from public.reservation_transfers t where auth.uid() in(t.from_user_id,t.to_user_id,t.owner_id));
end $$;
create function private.create_transfer(p_reservation_id uuid,p_terms text,p_no_deposit boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.reservations; t public.reservation_transfers; s public.stores;
begin
 perform private.require_profile('booker');
 r:=private.lock_reservation(p_reservation_id);
 if r.booker_id is distinct from auth.uid() or r.is_manual then raise exception '내 앱 예약만 양도할 수 있습니다.' using errcode='42501'; end if;
 if r.status<>'confirmed' or r.starts_at<=clock_timestamp() or r.chat_epoch<>0 then raise exception '시작 전 확정 예약만 1회 양도할 수 있습니다.' using errcode='22023'; end if;
 if not exists(select 1 from public.student_verifications where user_id=auth.uid() and status='approved') then raise exception '학생증 인증 승인 후 이용해주세요.' using errcode='42501'; end if;
 if p_no_deposit is distinct from true or p_terms is null or length(btrim(p_terms)) not between 1 and 1000 then
 raise exception '예약금이 없는 예약만 등록할 수 있습니다. 승계 조건도 확인해주세요.' using errcode='22023'; end if;
 select * into s from public.stores where id=r.store_id;
 if not s.approved then raise exception '승인된 매장만 양도할 수 있습니다.' using errcode='42501'; end if;
 select * into t from public.reservation_transfers where reservation_id=r.id and status='active';
 if found then
 if t.terms<>btrim(p_terms) then raise exception '이미 등록된 양도입니다. 변경하려면 먼저 철회해주세요.' using errcode='22023'; end if;
 return t.id;
 end if;
 insert into public.reservation_transfers(reservation_id,from_user_id,owner_id,store_id,store_name,region,service_date,
 start_minute,slot_count,starts_at,ends_at,people,terms,no_deposit_confirmed,from_name,from_affiliation)
 values(r.id,auth.uid(),s.owner_id,s.id,s.name,s.region,r.service_date,r.start_minute,r.slot_count,r.starts_at,r.ends_at,r.people,
 btrim(p_terms),true,r.booker_name,r.booker_affiliation) returning id into t.id;
 return t.id;
end $$;
create function private.withdraw_transfer(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare t public.reservation_transfers; r public.reservations;
begin
 perform private.require_profile('booker');
 select * into t from public.reservation_transfers where id=p_id;
 if t.id is null or t.from_user_id<>auth.uid() then raise exception '내 양도만 철회할 수 있습니다.' using errcode='42501'; end if;
 r:=private.lock_reservation(t.reservation_id);
 select * into t from public.reservation_transfers where id=p_id for update;
 if t.status='withdrawn' then return; end if;
 if t.status<>'active' then raise exception '이미 종료된 양도입니다.' using errcode='22023'; end if;
 update public.reservation_transfers set status='withdrawn' where id=p_id;
end $$;
create function private.claim_transfer(p_id uuid,p_request_id uuid,p_accept_terms boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare t public.reservation_transfers; r public.reservations; p public.profiles;
begin
 p:=private.require_profile('booker');
 -- NO KEY UPDATE serializes sender retries without blocking notification FK key-share locks.
 select * into p from public.profiles where id=auth.uid() for no key update;
 if p_request_id is null or p_accept_terms is distinct from true then raise exception '승계 조건에 동의해주세요.' using errcode='22023'; end if;
 select * into t from public.reservation_transfers where id=p_id;
 if t.id is null then raise exception '양도를 찾을 수 없습니다.' using errcode='P0002'; end if;
 r:=private.lock_reservation(t.reservation_id);
 select * into t from public.reservation_transfers where id=p_id for update;
 if t.status='completed' and t.to_user_id=auth.uid() and t.claim_request_id=p_request_id then return t.reservation_id; end if;
 if t.from_user_id=auth.uid() then raise exception '본인의 예약은 양도받을 수 없습니다.' using errcode='42501'; end if;
 if t.status<>'active' or r.status<>'confirmed' or r.starts_at<=clock_timestamp() or r.chat_epoch<>0
 or r.booker_id<>t.from_user_id then raise exception '이미 종료되었거나 양도받을 수 없는 예약입니다.' using errcode='22023'; end if;
 if not exists(select 1 from public.stores where id=r.store_id and approved) then raise exception '이 매장의 양도는 중단되었습니다.' using errcode='42501'; end if;
 perform 1 from public.student_verifications where user_id=auth.uid() and status='approved' for share;
 if not found then raise exception '학생증 인증 승인 후 양도받을 수 있습니다.' using errcode='42501'; end if;
 update public.reservation_transfers set status='completed',to_user_id=auth.uid(),to_name=p.real_name,
 to_affiliation=concat_ws(' ',nullif(p.school_name,''),nullif(p.department_name,'')),completed_at=clock_timestamp(),claim_request_id=p_request_id where id=p_id;
 -- Clear private notes belonging to the previous party. Agreed public conditions remain in the immutable transfer record.
 update public.reservations set booker_id=p.id,booker_name=p.real_name,
 booker_affiliation=concat_ws(' ',nullif(p.school_name,''),nullif(p.department_name,'')),chat_epoch=1,
 event_purpose='',request_message='',updated_at=clock_timestamp() where id=r.id;
 insert into public.notifications(user_id,reservation_id,kind,title,body,transfer_id,chat_epoch)
 select u,r.id,'reservation_transferred',case when u=t.owner_id then '예약자가 변경되었습니다' else '예약 양도가 완료되었습니다' end,
 to_char(r.starts_at at time zone 'Asia/Seoul','MM/DD HH24:MI')||' · '||r.people||'명 · 일시와 인원은 그대로 유지됩니다.',t.id,1
 from unnest(array[t.from_user_id,p.id,t.owner_id]) u;
 return r.id;
end $$;

-- Protect every existing edit/cancel entry point, including older apps and the owner web.
create function private.guard_transfer_reservation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status in('cancelled','completed','rejected') then
 update public.reservation_transfers set status='cancelled' where reservation_id=old.id and status='active';
 elsif exists(select 1 from public.reservation_transfers where reservation_id=old.id and status='active')
 and (new.service_date,new.start_minute,new.slot_count,new.people,new.budget_per_person,new.event_purpose,new.request_message,new.status,new.booker_id)
 is distinct from (old.service_date,old.start_minute,old.slot_count,old.people,old.budget_per_person,old.event_purpose,old.request_message,old.status,old.booker_id) then
 raise exception '예약을 변경하려면 먼저 양도를 철회해주세요.' using errcode='22023';
 end if;
 return new;
end $$;
revoke all on function private.guard_transfer_reservation() from public,anon,authenticated;
create trigger guard_transfer_reservation before update on public.reservations for each row execute function private.guard_transfer_reservation();

create function private.chat_epoch_participant(p_reservation_id uuid,p_epoch integer) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.reservations r join public.stores s on s.id=r.store_id
 where r.id=p_reservation_id and not r.is_manual and (
 (s.owner_id=auth.uid() and p_epoch between 0 and r.chat_epoch) or (r.booker_id=auth.uid() and r.chat_epoch=p_epoch)
 or (p_epoch=0 and exists(select 1 from public.reservation_transfers t where t.reservation_id=r.id and t.status='completed' and t.from_user_id=auth.uid()))))
$$;
revoke all on function private.chat_epoch_participant(uuid,integer) from public,anon,authenticated;
grant execute on function private.chat_epoch_participant(uuid,integer) to authenticated;
alter policy chat_participant_read on public.chat_messages using(private.chat_epoch_participant(reservation_id,chat_epoch));
create or replace function private.send_chat_message_epoch(p_reservation_id uuid,p_body text,p_request_id uuid,p_epoch integer) returns public.chat_messages
language plpgsql security definer set search_path='' as $$
declare r public.reservations; m public.chat_messages; owner_id uuid; recipient uuid; role_name text;
begin
 if auth.uid() is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 -- One sender lock serializes duplicate retries and the per-minute limit.
 perform 1 from public.profiles where id=auth.uid() for no key update;
 if not found then raise exception '프로필을 확인해주세요.' using errcode='42501'; end if;
 if p_body is null or length(btrim(p_body)) not between 1 and 2000 or p_request_id is null then raise exception '메시지는 1~2000자로 입력해주세요.' using errcode='22023'; end if;
 select * into r from public.reservations where id=p_reservation_id for update;
 select s.owner_id into owner_id from public.stores s where s.id=r.store_id;
 if r.id is null or r.is_manual or (auth.uid() is distinct from r.booker_id and auth.uid() is distinct from owner_id) then raise exception '대화 참여자만 메시지를 보낼 수 있습니다.' using errcode='42501'; end if;
 if p_epoch is distinct from r.chat_epoch then raise exception '양도로 대화 상대가 변경되었습니다. 새 대화방을 열어주세요.' using errcode='22023'; end if;
 select * into m from public.chat_messages where sender_id=auth.uid() and request_id=p_request_id;
 if found then
   if m.reservation_id<>p_reservation_id or m.body<>btrim(p_body) or m.chat_epoch<>p_epoch then raise exception '동일 요청의 내용이 다릅니다.' using errcode='22023'; end if;
   return m;
 end if;
 if r.status not in ('pending','confirmed') then raise exception '종료된 예약에는 메시지를 보낼 수 없습니다.' using errcode='22023'; end if;
 if auth.uid()=r.booker_id and not exists(select 1 from public.student_verifications where user_id=auth.uid() and status='approved') then raise exception '학생증 인증 승인 후 채팅을 이용할 수 있습니다.' using errcode='42501'; end if;
 if (select count(*) from public.chat_messages where sender_id=auth.uid() and created_at>now()-interval '1 minute')>=20 then raise exception '메시지가 많습니다. 잠시 후 다시 시도해주세요.' using errcode='54000'; end if;
 role_name:=case when auth.uid()=owner_id then 'owner' else 'booker' end;
 recipient:=case when auth.uid()=owner_id then r.booker_id else owner_id end;
 insert into public.chat_messages(reservation_id,sender_id,sender_role,body,request_id,chat_epoch)
 values(p_reservation_id,auth.uid(),role_name,btrim(p_body),p_request_id,p_epoch) returning * into m;
 insert into public.notifications(user_id,reservation_id,kind,title,body,chat_epoch)
 values(recipient,p_reservation_id,'chat_message','새 메시지가 도착했습니다',left(m.body,120) || case when length(m.body)>120 then '…' else '' end,p_epoch);
 return m;
end $$;

-- Legacy clients must not silently send to a new party after ownership changes.
create or replace function private.send_chat_message(p_reservation_id uuid,p_body text,p_request_id uuid) returns public.chat_messages
language sql security invoker set search_path='' as $$ select private.send_chat_message_epoch(p_reservation_id,p_body,p_request_id,0) $$;
-- Versioned, authenticated public wrappers; privileged bodies stay outside the API schema.
do $wrappers$
declare f record; args text;
begin
 for f in select p.*,pg_get_function_identity_arguments(p.oid) sig,pg_get_function_arguments(p.oid) full_args,
 pg_get_function_result(p.oid) result_type from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='private' and p.proname=any(array['list_transfers','get_transfer','my_transfers','create_transfer','withdraw_transfer','claim_transfer','send_chat_message_epoch']) loop
 select string_agg(format('%I',f.proargnames[i]),', ' order by i) into args from generate_series(1,f.pronargs) i;
 execute format('create function public.%I(%s) returns %s language sql %s security invoker set search_path=%L as %L',
 f.proname,f.full_args,f.result_type,case when f.provolatile='s' then 'stable' else 'volatile' end,'',format('select private.%I(%s)',f.proname,coalesce(args,'')));
 execute format('revoke all on function private.%I(%s),public.%I(%s) from public,anon,authenticated',f.proname,f.sig,f.proname,f.sig);
 execute format('grant execute on function private.%I(%s),public.%I(%s) to authenticated',f.proname,f.sig,f.proname,f.sig);
 end loop;
end $wrappers$;
