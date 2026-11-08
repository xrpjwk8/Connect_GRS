-- Show a bounded preview for new chat notifications, as requested.
create or replace function private.send_chat_message(p_reservation_id uuid,p_body text,p_request_id uuid) returns public.chat_messages
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
 values(recipient,p_reservation_id,'chat_message','새 메시지가 도착했습니다',left(m.body,120) || case when length(m.body)>120 then '…' else '' end);
 return m;
end $$;
