-- Private student-card review. No client can approve itself or write review state.
create table private.admin_invitations (
  email text primary key check(email=lower(btrim(email))),
  created_at timestamptz not null default now()
);
alter table private.admin_invitations enable row level security;
revoke all on private.admin_invitations from public,anon,authenticated;
create function private.accept_admin_invitation() returns boolean
language plpgsql security definer set search_path='' as $$
declare u auth.users;
begin
  select * into u from auth.users where id=auth.uid() for update;
  if u.id is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
  if u.email_confirmed_at is not null then
    delete from private.admin_invitations where email=lower(u.email);
    if found then insert into private.admin_users(user_id) values(u.id) on conflict do nothing; end if;
  end if;
  return private.is_admin();
end $$;
create function public.accept_admin_invitation() returns boolean
language sql security invoker set search_path='' as $$ select private.accept_admin_invitation() $$;
revoke all on function private.accept_admin_invitation(),public.accept_admin_invitation() from public,anon,authenticated;
grant execute on function private.accept_admin_invitation(),public.accept_admin_invitation() to authenticated;

create table public.student_verifications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  request_id uuid not null unique default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected')),
  document_path text not null unique,
  real_name text not null,
  school_name text not null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  rejection_reason text not null default '' check (length(rejection_reason) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'approved' or (reviewed_at is not null and reviewed_by is not null)),
  check (status <> 'rejected' or length(btrim(rejection_reason)) > 0)
);
create index student_verifications_queue_idx on public.student_verifications(status, submitted_at);
create index student_verifications_reviewer_idx on public.student_verifications(reviewed_by);
create table public.student_verification_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  status text not null,
  actor_id uuid references auth.users(id),
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index student_verification_events_user_idx on public.student_verification_events(user_id, created_at);
create index student_verification_events_actor_idx on public.student_verification_events(actor_id);
alter table public.student_verifications enable row level security;
alter table public.student_verification_events enable row level security;
revoke all on public.student_verifications, public.student_verification_events from public, anon, authenticated;
grant select on public.student_verifications, public.student_verification_events to authenticated;
create policy student_verifications_read on public.student_verifications for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy student_verification_events_read on public.student_verification_events for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('student-cards','student-cards',false,10485760,array['image/jpeg','image/png','application/pdf']);

create policy student_cards_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'student-cards' and exists (
    select 1 from public.student_verifications v where v.user_id = (select auth.uid())
    and v.document_path = name and v.status = 'draft'
  )
);
create policy student_cards_read on storage.objects for select to authenticated using (
  bucket_id = 'student-cards' and exists (
    select 1 from public.student_verifications v where v.document_path = name
      and (v.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);
-- No UPDATE/upsert policy: a submitted document cannot be replaced during review.
create function private.can_delete_student_card(p_path text) returns boolean
language plpgsql security definer set search_path='' as $$
declare v public.student_verifications;
begin
  if auth.uid() is null then return false; end if;
  -- Lock before allowing deletion so concurrent submission/review cannot race it.
  select * into v from public.student_verifications where document_path=p_path for update;
  if private.is_admin() then return v.status is distinct from 'pending'; end if;
  return split_part(p_path,'/',1)=auth.uid()::text and (v.status is null or v.status not in ('pending','approved'));
end $$;
revoke all on function private.can_delete_student_card(text) from public,anon,authenticated;
grant execute on function private.can_delete_student_card(text) to authenticated;
create policy student_cards_delete on storage.objects for delete to authenticated using (
  bucket_id = 'student-cards' and private.can_delete_student_card(name)
);

create function private.record_student_verification_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' or new.status is distinct from old.status or new.request_id is distinct from old.request_id then
    insert into public.student_verification_events(user_id,request_id,status,actor_id,reason)
    values(new.user_id,new.request_id,new.status,auth.uid(),new.rejection_reason);
  end if;
  return new;
end $$;
revoke all on function private.record_student_verification_event() from public, anon, authenticated;
create trigger student_verification_audit after insert or update on public.student_verifications
for each row execute function private.record_student_verification_event();

create function private.begin_student_verification(p_extension text) returns public.student_verifications
language plpgsql security definer set search_path = '' as $$
declare p public.profiles; v public.student_verifications; r uuid := gen_random_uuid();
begin
  p := private.require_profile('booker');
  select * into p from public.profiles where id = p.id for update;
  if p_extension is null or p_extension not in ('jpg','png','pdf') then
    raise exception 'JPG, PNG 또는 PDF 파일을 선택해주세요.' using errcode = '22023';
  end if;
  select * into v from public.student_verifications where user_id = p.id for update;
  if v.status in ('pending','approved') then
    raise exception '이미 심사 중이거나 승인된 인증입니다.' using errcode = '42501';
  end if;
  if v.status = 'draft' and exists(select 1 from storage.objects where bucket_id='student-cards' and name=v.document_path) then
    raise exception '업로드한 파일로 제출하거나 기존 파일을 삭제 후 다시 선택해주세요.' using errcode = '22023';
  end if;
  insert into public.student_verifications(user_id,request_id,document_path,real_name,school_name)
  values(p.id,r,p.id::text || '/' || r::text || '.' || p_extension,p.real_name,p.school_name)
  on conflict(user_id) do update set request_id=excluded.request_id,document_path=excluded.document_path,
    real_name=excluded.real_name,school_name=excluded.school_name,status='draft',submitted_at=null,
    reviewed_at=null,reviewed_by=null,rejection_reason='',updated_at=now()
  returning * into v;
  return v;
end $$;

create function private.submit_student_verification(p_request_id uuid) returns public.student_verifications
language plpgsql security definer set search_path = '' as $$
declare p public.profiles; v public.student_verifications;
begin
  p := private.require_profile('booker');
  select * into p from public.profiles where id=p.id for update;
  select * into v from public.student_verifications where user_id=p.id for update;
  if v.request_id is distinct from p_request_id then
    raise exception '인증 신청이 변경되었습니다. 새로고침해주세요.' using errcode='40001';
  end if;
  if v.status in ('pending','approved') then return v; end if;
  if v.status <> 'draft' then raise exception '새 파일로 다시 신청해주세요.' using errcode='22023'; end if;
  perform 1 from storage.objects where bucket_id='student-cards' and name=v.document_path for update;
  if not found then raise exception '학생증 파일 업로드를 먼저 완료해주세요.' using errcode='22023'; end if;
  update public.student_verifications set status='pending',submitted_at=now(),updated_at=now(),
    real_name=p.real_name,school_name=p.school_name where user_id=p.id returning * into v;
  return v;
end $$;

create function private.review_student_verification(p_user_id uuid,p_request_id uuid,p_approve boolean,p_reason text default '')
returns public.student_verifications language plpgsql security definer set search_path = '' as $$
declare v public.student_verifications;
begin
  if auth.uid() is null or not private.is_admin() or p_user_id=auth.uid() then
    raise exception '다른 사용자를 심사할 관리자 권한이 필요합니다.' using errcode='42501';
  end if;
  if p_approve is null or (not p_approve and (p_reason is null or length(btrim(p_reason)) not between 1 and 1000)) then
    raise exception '반려 또는 승인 취소 사유를 1~1000자로 입력해주세요.' using errcode='22023';
  end if;
  perform 1 from public.profiles where id=p_user_id for update;
  select * into v from public.student_verifications where user_id=p_user_id for update;
  if v.request_id is distinct from p_request_id then
    raise exception '신청이 변경되었습니다. 목록을 새로고침해주세요.' using errcode='40001';
  end if;
  if (p_approve and v.status='approved') or (not p_approve and v.status='rejected' and v.rejection_reason=btrim(p_reason)) then return v; end if;
  if v.status <> 'pending' and not (v.status='approved' and not p_approve) then
    raise exception '이미 처리되었거나 제출하지 않은 신청입니다.' using errcode='22023';
  end if;
  if p_approve then
    perform 1 from storage.objects where bucket_id='student-cards' and name=v.document_path for update;
    if not found then raise exception '심사할 학생증 파일이 없습니다.' using errcode='22023'; end if;
  end if;
  update public.student_verifications set status=case when p_approve then 'approved' else 'rejected' end,
    reviewed_at=now(),reviewed_by=auth.uid(),rejection_reason=case when p_approve then '' else btrim(p_reason) end,
    updated_at=now() where user_id=p_user_id returning * into v;
  return v;
end $$;

-- A name/school change invalidates the reviewed identity. Review and profile edits
-- both lock the profile before the application row, so stale approval cannot win.
create function private.invalidate_student_verification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.real_name,new.school_name) is distinct from (old.real_name,old.school_name) then
    update public.student_verifications set status='rejected',reviewed_at=null,reviewed_by=null,
      rejection_reason='이름 또는 학교 정보가 변경되었습니다. 학생증 인증을 다시 신청해주세요.',updated_at=now()
    where user_id=new.id and status in ('pending','approved');
  end if;
  return new;
end $$;
revoke all on function private.invalidate_student_verification() from public,anon,authenticated;
create trigger invalidate_student_identity after update on public.profiles
for each row execute function private.invalidate_student_verification();

create function private.enforce_student_reservation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not new.is_manual and new.status in ('pending','confirmed') then
    perform 1 from public.student_verifications where user_id=new.booker_id and status='approved' for share;
    if not found then raise exception '학생증 인증 승인 후 예약을 이용할 수 있습니다.' using errcode='42501'; end if;
  end if;
  return new;
end $$;
revoke all on function private.enforce_student_reservation() from public,anon,authenticated;
create trigger require_student_verification before insert or update on public.reservations
for each row execute function private.enforce_student_reservation();

-- Verified account ownership is still required; school email alone is no longer
-- evidence of student status. This allows ordinary emails to submit a student card.
create or replace function private.complete_profile(
  p_role text,p_real_name text,p_school_name text default '',p_department_name text default '',p_position text default ''
) returns public.profiles language plpgsql security definer set search_path = '' as $$
declare u auth.users; p public.profiles;
begin
  select * into u from auth.users where id=auth.uid() for update;
  if u.id is null or (u.email_confirmed_at is null and u.phone_confirmed_at is null) then
    raise exception '이메일 또는 전화번호 인증이 필요합니다.' using errcode='42501';
  end if;
  if p_role is null or p_role not in ('booker','owner') then raise exception '사용자 역할이 올바르지 않습니다.' using errcode='22023'; end if;
  if p_role='booker' and (p_school_name is null or btrim(p_school_name)='') then
    raise exception '학교명을 입력해주세요.' using errcode='22023';
  end if;
  select * into p from public.profiles where id=u.id for update;
  if p.id is not null and p.role<>p_role then raise exception '가입 후 역할을 변경할 수 없습니다.' using errcode='42501'; end if;
  insert into public.profiles(id,role,real_name,school_name,department_name,position)
  values(u.id,p_role,btrim(p_real_name),btrim(coalesce(p_school_name,'')),coalesce(p_department_name,''),coalesce(p_position,''))
  on conflict(id) do update set real_name=excluded.real_name,school_name=excluded.school_name,
    department_name=excluded.department_name,position=excluded.position returning * into p;
  return p;
end $$;

create function public.current_user_is_admin() returns boolean language sql stable security invoker set search_path=''
as $$ select private.is_admin() $$;
create function public.begin_student_verification(p_extension text) returns public.student_verifications
language sql security invoker set search_path='' as $$ select private.begin_student_verification(p_extension) $$;
create function public.submit_student_verification(p_request_id uuid) returns public.student_verifications
language sql security invoker set search_path='' as $$ select private.submit_student_verification(p_request_id) $$;
create function public.review_student_verification(p_user_id uuid,p_request_id uuid,p_approve boolean,p_reason text default '')
returns public.student_verifications language sql security invoker set search_path=''
as $$ select private.review_student_verification(p_user_id,p_request_id,p_approve,p_reason) $$;
revoke all on function private.begin_student_verification(text),private.submit_student_verification(uuid),
  private.review_student_verification(uuid,uuid,boolean,text),public.current_user_is_admin(),
  public.begin_student_verification(text),public.submit_student_verification(uuid),
  public.review_student_verification(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function private.begin_student_verification(text),private.submit_student_verification(uuid),
  private.review_student_verification(uuid,uuid,boolean,text),public.current_user_is_admin(),
  public.begin_student_verification(text),public.submit_student_verification(uuid),
  public.review_student_verification(uuid,uuid,boolean,text) to authenticated;
