-- Keep elevated implementations outside the exposed API schema.
-- Wrappers preserve RPC names, argument defaults, results and caller auth.uid().
alter table private.admin_users enable row level security;
create index favorites_store_idx on public.favorites(store_id);

alter policy stores_public_read on public.stores to anon;
alter policy stores_owner_read on public.stores
  using (approved or owner_id = (select auth.uid()) or (select private.is_admin()));

-- anon only has EXECUTE on the two read-only aggregate/search entry points.
grant usage on schema private to anon;

do $migration$
declare f record; v_signature text; v_args text; v_body text;
begin
  for f in
    select p.oid, p.proname, p.pronargs, p.proargnames, p.proretset, p.provolatile,
      pg_get_function_identity_arguments(p.oid) identity_args,
      pg_get_function_arguments(p.oid) full_args,
      pg_get_function_result(p.oid) result_type
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(array[
      'complete_profile','register_store','approve_store','request_reservation',
      'create_manual_reservation','decide_reservation','edit_reservation',
      'cancel_reservation','complete_reservation','replace_time_blocks',
      'update_store_capacity','get_availability','search_stores'
    ])
  loop
    select string_agg(format('%I', f.proargnames[i]), ', ' order by i)
      into v_args from generate_series(1, f.pronargs) i;
    execute format('alter function public.%I(%s) set schema private', f.proname, f.identity_args);
    v_signature := format('private.%I(%s)', f.proname, f.identity_args);
    execute format('revoke all on function %s from public, anon, authenticated', v_signature);
    execute format('grant execute on function %s to authenticated', v_signature);
    if f.proname in ('get_availability','search_stores') then
      execute format('grant execute on function %s to anon', v_signature);
    end if;

    v_body := case when f.proretset then 'select * from ' else 'select ' end
      || format('private.%I(%s)', f.proname, v_args);
    execute format(
      'create function public.%I(%s) returns %s language sql %s security invoker set search_path = %L as %L',
      f.proname, f.full_args, f.result_type,
      case f.provolatile when 's' then 'stable' when 'i' then 'immutable' else 'volatile' end,
      '', v_body
    );
    v_signature := format('public.%I(%s)', f.proname, f.identity_args);
    execute format('revoke all on function %s from public, anon, authenticated', v_signature);
    execute format('grant execute on function %s to authenticated', v_signature);
    if f.proname in ('get_availability','search_stores') then
      execute format('grant execute on function %s to anon', v_signature);
    end if;
  end loop;
end $migration$;
