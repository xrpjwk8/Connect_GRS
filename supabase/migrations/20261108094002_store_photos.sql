-- Files live in Storage; only the current cover path lives in the store row.
alter table public.stores add column photo_path text;
create unique index stores_photo_path_idx on public.stores(photo_path) where photo_path is not null;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('store-photos','store-photos',false,1048576,array['image/jpeg','image/png']);

create policy store_photos_insert on storage.objects for insert to authenticated with check (
  bucket_id='store-photos'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png)$'
  and exists (select 1 from public.stores s where s.id::text=split_part(objects.name,'/',1) and s.owner_id=(select auth.uid()))
);
create policy store_photos_read on storage.objects for select to authenticated using (
  bucket_id='store-photos' and exists (
    select 1 from public.stores s where s.id::text=split_part(objects.name,'/',1)
    and (s.owner_id=(select auth.uid()) or (s.photo_path=objects.name and s.approved) or (select private.is_admin()))
  )
);
create policy store_photos_public_read on storage.objects for select to anon using (
  bucket_id='store-photos' and exists (select 1 from public.stores s where s.photo_path=objects.name and s.approved)
);
-- Serialize unlink/delete with attachment, including retries after a lost response.
create function private.can_delete_store_photo(p_path text) returns boolean
language plpgsql security definer set search_path='' as $$
declare s public.stores;
begin
  if auth.uid() is null then return false; end if;
  select * into s from public.stores where id::text=split_part(p_path,'/',1) for update;
  return s.owner_id=auth.uid() and s.photo_path is distinct from p_path;
end $$;
revoke all on function private.can_delete_store_photo(text) from public,anon,authenticated;
grant execute on function private.can_delete_store_photo(text) to authenticated;
create policy store_photos_delete on storage.objects for delete to authenticated using (
  bucket_id='store-photos' and private.can_delete_store_photo(name)
);

create function private.set_store_photo(p_store_id uuid,p_path text) returns text
language plpgsql security definer set search_path='' as $$
declare s public.stores; old_path text;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
  select * into s from public.stores where id=p_store_id for update;
  if s.id is null or s.owner_id<>auth.uid() then raise exception '본인 매장만 수정할 수 있습니다.' using errcode='42501'; end if;
  if p_path is not null then
    if split_part(p_path,'/',1)<>p_store_id::text then raise exception '잘못된 사진 경로입니다.' using errcode='22023'; end if;
    perform 1 from storage.objects where bucket_id='store-photos' and name=p_path for update;
    if not found then raise exception '사진 업로드를 먼저 완료해주세요.' using errcode='22023'; end if;
  end if;
  old_path := s.photo_path;
  update public.stores set photo_path=p_path where id=p_store_id;
  return old_path;
end $$;
create function public.set_store_photo(p_store_id uuid,p_path text) returns text
language sql security invoker set search_path='' as $$ select private.set_store_photo(p_store_id,p_path) $$;
revoke all on function private.set_store_photo(uuid,text),public.set_store_photo(uuid,text) from public,anon,authenticated;
grant execute on function private.set_store_photo(uuid,text),public.set_store_photo(uuid,text) to authenticated;
