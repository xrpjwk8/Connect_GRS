-- Participant-only chat and durable notification inbox/outbox.
create table public.chat_messages (
 id uuid primary key default gen_random_uuid(),
 reservation_id uuid not null references public.reservations(id) on delete cascade,
 sender_id uuid not null references public.profiles(id),
 sender_role text not null check(sender_role in ('owner','booker')),
 body text not null check(length(btrim(body)) between 1 and 2000),
 request_id uuid not null, created_at timestamptz not null default clock_timestamp(),
 unique(sender_id,request_id)
);
create index chat_messages_history_idx on public.chat_messages(reservation_id,created_at desc,id desc);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 reservation_id uuid not null references public.reservations(id) on delete cascade,
 kind text not null check(kind in ('reservation_requested','reservation_confirmed','reservation_rejected','reservation_cancelled','chat_message')),
 title text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz
);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index notifications_reservation_idx on public.notifications(reservation_id);
create table private.push_devices (
 id uuid primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 token text not null unique, platform text not null check(platform in ('ios','android')),
 enabled boolean not null default true, updated_at timestamptz not null default now()
);
create index push_devices_user_idx on private.push_devices(user_id);
create table private.push_deliveries (
 id bigint generated always as identity primary key,
 notification_id uuid not null references public.notifications(id) on delete cascade,
 device_id uuid not null references private.push_devices(id) on delete cascade,
 token text not null,
 state text not null default 'queued' check(state in ('queued','sending','ticket','checking','delivered','failed','cancelled')),
 attempts integer not null default 0, receipt_checks integer not null default 0,
 available_at timestamptz not null default now(), request_id bigint, ticket_id text,
 last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(notification_id,device_id)
);
create index push_deliveries_due_idx on private.push_deliveries(state,available_at);
create index push_deliveries_device_idx on private.push_deliveries(device_id);
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table private.push_devices enable row level security;
alter table private.push_deliveries enable row level security;
revoke all on public.chat_messages,public.notifications,private.push_devices,private.push_deliveries from public,anon,authenticated;
grant select on public.chat_messages,public.notifications to authenticated;

create function private.chat_participant(p_reservation_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.reservations r join public.stores s on s.id=r.store_id
 where r.id=p_reservation_id and not r.is_manual and (r.booker_id=auth.uid() or s.owner_id=auth.uid()))
$$;
revoke all on function private.chat_participant(uuid) from public,anon,authenticated;
grant execute on function private.chat_participant(uuid) to authenticated;
create policy chat_participant_read on public.chat_messages for select to authenticated using(private.chat_participant(reservation_id));
create policy notifications_self_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));

create function private.register_push_device(p_device_id uuid,p_token text,p_platform text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid()) then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 if p_device_id is null or p_platform not in ('ios','android') or p_token is null or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$' then raise exception '잘못된 기기 정보입니다.' using errcode='22023'; end if;
 -- The token belongs to an app installation, and can change account after logout.
 delete from private.push_devices where token=p_token and id<>p_device_id;
 insert into private.push_devices(id,user_id,token,platform) values(p_device_id,auth.uid(),p_token,p_platform)
 on conflict(id) do update set user_id=excluded.user_id,token=excluded.token,platform=excluded.platform,enabled=true,updated_at=now();
end $$;
create function private.unregister_push_device(p_device_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 update private.push_devices set enabled=false,updated_at=now() where id=p_device_id and user_id=auth.uid();
end $$;
create function private.mark_notification_read(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 update public.notifications set read_at=coalesce(read_at,now()) where id=p_id and user_id=auth.uid();
end $$;
create function public.register_push_device(p_device_id uuid,p_token text,p_platform text) returns void
language sql security invoker set search_path='' as $$ select private.register_push_device(p_device_id,p_token,p_platform) $$;
create function public.unregister_push_device(p_device_id uuid) returns void
language sql security invoker set search_path='' as $$ select private.unregister_push_device(p_device_id) $$;
create function public.mark_notification_read(p_id uuid) returns void
language sql security invoker set search_path='' as $$ select private.mark_notification_read(p_id) $$;
revoke all on function private.register_push_device(uuid,text,text),public.register_push_device(uuid,text,text),private.unregister_push_device(uuid),public.unregister_push_device(uuid),private.mark_notification_read(uuid),public.mark_notification_read(uuid) from public,anon,authenticated;
grant execute on function private.register_push_device(uuid,text,text),public.register_push_device(uuid,text,text),private.unregister_push_device(uuid),public.unregister_push_device(uuid),private.mark_notification_read(uuid),public.mark_notification_read(uuid) to authenticated;

create function private.enqueue_push() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into private.push_deliveries(notification_id,device_id,token)
 select new.id,d.id,d.token from private.push_devices d where d.user_id=new.user_id and d.enabled;
 return new;
end $$;
revoke all on function private.enqueue_push() from public,anon,authenticated;
create trigger notification_push after insert on public.notifications for each row execute function private.enqueue_push();

create function private.notify_reservation() returns trigger
language plpgsql security definer set search_path='' as $$
declare owner_id uuid; recipient uuid; k text; t text;
begin
 if new.is_manual then return new; end if;
 select s.owner_id into owner_id from public.stores s where s.id=new.store_id;
 if TG_OP='INSERT' then
   if new.status<>'pending' then return new; end if;
 elsif new.status=old.status and (new.status<>'pending' or (new.service_date,new.start_minute,new.slot_count,new.people,new.budget_per_person,new.event_purpose,new.request_message) is not distinct from (old.service_date,old.start_minute,old.slot_count,old.people,old.budget_per_person,old.event_purpose,old.request_message)) then return new;
 end if;
 case new.status
 when 'pending' then recipient:=owner_id; k:='reservation_requested'; t:='예약 신청이 도착했습니다';
 when 'confirmed' then recipient:=new.booker_id; k:='reservation_confirmed'; t:='예약이 수락되었습니다';
 when 'rejected' then recipient:=new.booker_id; k:='reservation_rejected'; t:='예약이 거절되었습니다';
 when 'cancelled' then
   k:='reservation_cancelled'; t:='예약이 취소되었습니다';
   -- Notify both participants except the actor (including administrative cancellations).
   insert into public.notifications(user_id,reservation_id,kind,title,body)
   select u,new.id,k,t,'앱에서 예약 내용을 확인해주세요.' from unnest(array[owner_id,new.booker_id]) u
   where u is not null and u is distinct from auth.uid();
   return new;
 else return new;
 end case;
 if recipient is not null and recipient is distinct from auth.uid() then
 insert into public.notifications(user_id,reservation_id,kind,title,body) values(recipient,new.id,k,t,'앱에서 예약 내용을 확인해주세요.');
 end if;
 return new;
end $$;
revoke all on function private.notify_reservation() from public,anon,authenticated;
create trigger reservation_notification after insert or update on public.reservations for each row execute function private.notify_reservation();

create function private.send_chat_message(p_reservation_id uuid,p_body text,p_request_id uuid) returns public.chat_messages
language plpgsql security definer set search_path='' as $$
declare r public.reservations; m public.chat_messages; owner_id uuid; recipient uuid; role_name text;
begin
 if auth.uid() is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 -- One sender lock serializes duplicate retries and the per-minute limit.
 perform 1 from public.profiles where id=auth.uid() for update;
 if not found then raise exception '프로필을 확인해주세요.' using errcode='42501'; end if;
 if p_body is null or length(btrim(p_body)) not between 1 and 2000 or p_request_id is null then raise exception '메시지는 1~2000자로 입력해주세요.' using errcode='22023'; end if;
 select * into r from public.reservations where id=p_reservation_id for update;
 select s.owner_id into owner_id from public.stores s where s.id=r.store_id;
 if r.id is null or r.is_manual or (auth.uid() is distinct from r.booker_id and auth.uid() is distinct from owner_id) then raise exception '대화 참여자만 메시지를 보낼 수 있습니다.' using errcode='42501'; end if;
 select * into m from public.chat_messages where sender_id=auth.uid() and request_id=p_request_id;
 if found then
   if m.reservation_id<>p_reservation_id or m.body<>btrim(p_body) then raise exception '동일 요청의 내용이 다릅니다.' using errcode='22023'; end if;
   return m;
 end if;
 if r.status not in ('pending','confirmed') then raise exception '종료된 예약에는 메시지를 보낼 수 없습니다.' using errcode='22023'; end if;
 if auth.uid()=r.booker_id and not exists(select 1 from public.student_verifications where user_id=auth.uid() and status='approved') then raise exception '학생증 인증 승인 후 채팅을 이용할 수 있습니다.' using errcode='42501'; end if;
 if (select count(*) from public.chat_messages where sender_id=auth.uid() and created_at>now()-interval '1 minute')>=20 then raise exception '메시지가 많습니다. 잠시 후 다시 시도해주세요.' using errcode='54000'; end if;
 role_name:=case when auth.uid()=owner_id then 'owner' else 'booker' end;
 recipient:=case when auth.uid()=owner_id then r.booker_id else owner_id end;
 insert into public.chat_messages(reservation_id,sender_id,sender_role,body,request_id)
 values(p_reservation_id,auth.uid(),role_name,btrim(p_body),p_request_id) returning * into m;
 insert into public.notifications(user_id,reservation_id,kind,title,body)
 values(recipient,p_reservation_id,'chat_message','새 메시지가 도착했습니다','앱에서 메시지를 확인해주세요.');
 return m;
end $$;
create function public.send_chat_message(p_reservation_id uuid,p_body text,p_request_id uuid) returns public.chat_messages
language sql security invoker set search_path='' as $$ select private.send_chat_message(p_reservation_id,p_body,p_request_id) $$;
revoke all on function private.send_chat_message(uuid,text,uuid),public.send_chat_message(uuid,text,uuid) from public,anon,authenticated;
grant execute on function private.send_chat_message(uuid,text,uuid),public.send_chat_message(uuid,text,uuid) to authenticated;
-- Local PostgreSQL tests have no realtime publication.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
   alter publication supabase_realtime add table public.chat_messages,public.notifications;
 end if;
end $$;
