-- Optional private handover note. Existing callers omit p_memo; existing listings have an empty note.
create function private.valid_transfer_memo(p_memo text) returns boolean
language sql immutable set search_path='' as $$
 select p_memo is not null and char_length(p_memo)<=50
 and p_memo !~ U&'[\00a9\00ae\200d\203c\2049\20e3\2122\2139\2194-\2199\21a9-\21aa\231a-\231b\2328\23cf\23e9-\23f3\23f8-\23fa\24c2\25aa-\25ab\25b6\25c0\25fb-\25fe\2600-\2604\260e\2611\2614-\2615\2618\261d\2620\2622-\2623\2626\262a\262e-\262f\2638-\263a\2640\2642\2648-\2653\265f-\2660\2663\2665-\2666\2668\267b\267e-\267f\2692-\2697\2699\269b-\269c\26a0-\26a1\26a7\26aa-\26ab\26b0-\26b1\26bd-\26be\26c4-\26c5\26c8\26ce-\26cf\26d1\26d3-\26d4\26e9-\26ea\26f0-\26f5\26f7-\26fa\26fd\2702\2705\2708-\270d\270f\2712\2714\2716\271d\2721\2728\2733-\2734\2744\2747\274c\274e\2753-\2755\2757\2763-\2764\2795-\2797\27a1\27b0\27bf\2934-\2935\2b05-\2b07\2b1b-\2b1c\2b50\2b55\3030\303d\3297\3299\fe0e-\fe0f\+01f004\+01f02c-\+01f02f\+01f094-\+01f09f\+01f0af-\+01f0b0\+01f0c0\+01f0cf-\+01f0d0\+01f0f6-\+01f0ff\+01f170-\+01f171\+01f17e-\+01f17f\+01f18e\+01f191-\+01f19a\+01f1ae-\+01f1ff\+01f201-\+01f20f\+01f21a\+01f22f\+01f232-\+01f23a\+01f23c-\+01f23f\+01f249-\+01f25f\+01f266-\+01f321\+01f324-\+01f393\+01f396-\+01f397\+01f399-\+01f39b\+01f39e-\+01f3f0\+01f3f3-\+01f3f5\+01f3f7-\+01f4fd\+01f4ff-\+01f53d\+01f549-\+01f54e\+01f550-\+01f567\+01f56f-\+01f570\+01f573-\+01f57a\+01f587\+01f58a-\+01f58d\+01f590\+01f595-\+01f596\+01f5a4-\+01f5a5\+01f5a8\+01f5b1-\+01f5b2\+01f5bc\+01f5c2-\+01f5c4\+01f5d1-\+01f5d3\+01f5dc-\+01f5de\+01f5e1\+01f5e3\+01f5e8\+01f5ef\+01f5f3\+01f5fa-\+01f64f\+01f680-\+01f6c5\+01f6cb-\+01f6d2\+01f6d5-\+01f6e5\+01f6e9\+01f6eb-\+01f6f0\+01f6f3-\+01f6ff\+01f7da-\+01f7ff\+01f80c-\+01f80f\+01f848-\+01f84f\+01f85a-\+01f85f\+01f888-\+01f88f\+01f8ae-\+01f8af\+01f8bc-\+01f8bf\+01f8c2-\+01f8cf\+01f8d9-\+01f8ff\+01f90c-\+01f93a\+01f93c-\+01f945\+01f947-\+01f9ff\+01fa58-\+01fa5f\+01fa6e-\+01faff\+01fc00-\+01fffd\+0e0020-\+0e007f]'
 and p_memo !~ U&'[\0001-\001F\007F-\009F]'
$$;
revoke all on function private.valid_transfer_memo(text) from public,anon,authenticated;
create table private.transfer_memos (
 transfer_id uuid primary key references public.reservation_transfers(id) on delete cascade,
 memo text not null default '' check(private.valid_transfer_memo(memo))
);
alter table private.transfer_memos enable row level security;
revoke all on private.transfer_memos from public,anon,authenticated;

create or replace function private.transfer_payload(t public.reservation_transfers) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',t.id,'store_id',t.store_id,'store_name',t.store_name,'region',t.region,
 'service_date',t.service_date,'start_minute',t.start_minute,'slot_count',t.slot_count,
 'starts_at',t.starts_at,'ends_at',t.ends_at,'people',t.people,'terms',t.terms,'created_at',t.created_at,
 'status',case when t.status='active' and t.starts_at<=statement_timestamp() then 'expired' else t.status end,
 'completed_at',t.completed_at,'is_mine',t.from_user_id=auth.uid(),
 'is_recipient',coalesce(t.to_user_id=auth.uid(),false),'is_owner',t.owner_id=auth.uid()) ||
 case when auth.uid() in(t.from_user_id,t.to_user_id,t.owner_id) then
 jsonb_build_object('reservation_id',t.reservation_id,'from_name',t.from_name,'from_affiliation',t.from_affiliation,
 'to_name',t.to_name,'to_affiliation',t.to_affiliation) else '{}'::jsonb end ||
 case when auth.uid() in(t.from_user_id,t.to_user_id) then jsonb_build_object('memo',
 coalesce((select m.memo from private.transfer_memos m where m.transfer_id=t.id),'')) else '{}'::jsonb end
$$;
revoke all on function private.transfer_payload(public.reservation_transfers) from public,anon,authenticated;


-- Replace the old signature rather than create an ambiguous default-argument overload.
drop function public.create_transfer(uuid,text,boolean);
drop function private.create_transfer(uuid,text,boolean);
create function private.create_transfer(p_reservation_id uuid,p_terms text,p_no_deposit boolean,p_memo text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.reservations; t public.reservation_transfers; s public.stores;
begin
 perform private.require_profile('booker');
 if not private.valid_transfer_memo(coalesce(p_memo,'')) then raise exception '메모는 이모지와 줄바꿈 없이 50자 이내로 입력해주세요.' using errcode='22023'; end if;
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
 if t.terms<>btrim(p_terms) or coalesce((select memo from private.transfer_memos where transfer_id=t.id),'')<>btrim(coalesce(p_memo,'')) then raise exception '이미 등록된 양도입니다. 변경하려면 먼저 철회해주세요.' using errcode='22023'; end if;
 return t.id;
 end if;
 insert into public.reservation_transfers(reservation_id,from_user_id,owner_id,store_id,store_name,region,service_date,
 start_minute,slot_count,starts_at,ends_at,people,terms,no_deposit_confirmed,from_name,from_affiliation)
 values(r.id,auth.uid(),s.owner_id,s.id,s.name,s.region,r.service_date,r.start_minute,r.slot_count,r.starts_at,r.ends_at,r.people,
 btrim(p_terms),true,r.booker_name,r.booker_affiliation) returning id into t.id;
 insert into private.transfer_memos(transfer_id,memo) values(t.id,btrim(coalesce(p_memo,'')));
 return t.id;
end $$;

create function public.create_transfer(p_reservation_id uuid,p_terms text,p_no_deposit boolean,p_memo text default '') returns uuid
language sql security invoker set search_path='' as $$ select private.create_transfer(p_reservation_id,p_terms,p_no_deposit,p_memo) $$;
revoke all on function public.create_transfer(uuid,text,boolean,text),private.create_transfer(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.create_transfer(uuid,text,boolean,text),private.create_transfer(uuid,text,boolean,text) to authenticated;
