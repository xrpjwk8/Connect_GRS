-- Internal notes never change availability. Reservation blocking remains in existing RPCs.
create table public.owner_schedule_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  service_date date not null,
  start_minute integer,
  end_minute integer,
  title text not null check (length(btrim(title)) between 1 and 80),
  memo text not null default '' check (length(memo) <= 1000),
  created_at timestamptz not null default now(),
  check ((start_minute is null and end_minute is null) or
    (start_minute is not null and end_minute is not null and
     start_minute between 0 and 1770 and start_minute % 30 = 0 and
     end_minute > start_minute and end_minute <= 1800 and end_minute % 30 = 0))
);
create index owner_schedule_events_store_date_idx on public.owner_schedule_events(store_id, service_date);
alter table public.owner_schedule_events enable row level security;
revoke all on public.owner_schedule_events from public, anon, authenticated;
grant select, insert, update, delete on public.owner_schedule_events to authenticated;
create policy owner_schedule_events_select on public.owner_schedule_events for select to authenticated
  using (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())));
create policy owner_schedule_events_insert on public.owner_schedule_events for insert to authenticated
  with check (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())));
create policy owner_schedule_events_update on public.owner_schedule_events for update to authenticated
  using (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())))
  with check (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())));
create policy owner_schedule_events_delete on public.owner_schedule_events for delete to authenticated
  using (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid())));
