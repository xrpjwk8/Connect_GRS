-- Hosted Supabase uses pg_net + pg_cron. Plain-Postgres tests provide a net stub.
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_net') then create extension if not exists pg_net with schema extensions; end if;
 if exists(select 1 from pg_available_extensions where name='pg_cron') then create extension if not exists pg_cron with schema pg_catalog; end if;
end $$;

create function private.dispatch_push_notifications() returns void
language plpgsql security definer set search_path='' as $$
declare j record; response record; payload jsonb; result jsonb; code text; rid bigint; headers jsonb; access_token text;
begin
 -- Cron overlap must not dispatch a delivery twice in one lease.
 if not pg_try_advisory_xact_lock(90420261108) then return; end if;
 headers:='{"Content-Type":"application/json"}'::jsonb;
 if to_regclass('vault.decrypted_secrets') is not null then
   execute 'select decrypted_secret from vault.decrypted_secrets where name=$1 limit 1' into access_token using 'expo_push_access_token';
   if access_token is not null then headers:=headers || jsonb_build_object('Authorization','Bearer '||access_token); end if;
 end if;
 -- Never deliver an old account's pending notification after logout/token/account rotation.
 update private.push_deliveries d set state='cancelled',updated_at=now()
 where state in ('queued','sending','ticket','checking') and not exists (
   select 1 from private.push_devices p join public.notifications n on n.id=d.notification_id
   where p.id=d.device_id and p.enabled and p.token=d.token and p.user_id=n.user_id
 );
 for j in select * from private.push_deliveries where state in ('sending','checking') order by id limit 100 for update skip locked loop
   select * into response from net._http_response where id=j.request_id;
   if not found then
     if j.updated_at>now()-interval '2 minutes' then continue; end if;
     code:='HTTPTimeout'; result:=null;
   else
     code:=null; result:=null;
     if response.status_code between 200 and 299 and response.error_msg is null and not coalesce(response.timed_out,false) then
       begin
         payload:=response.content::jsonb;
         result:=case when j.state='sending' then payload->'data' else payload->'data'->j.ticket_id end;
         if jsonb_typeof(result)='array' then result:=result->0; end if;
       exception when others then result:=null;
       end;
     else
       code:=case when response.status_code in (400,401,403) then 'ConfigurationError' else 'HTTPError' end;
     end if;
   end if;
   if result->>'status'='ok' then
     if j.state='sending' and result->>'id' is not null then
       update private.push_deliveries set state='ticket',ticket_id=result->>'id',available_at=now()+interval '15 minutes',request_id=null,updated_at=now(),last_error=null where id=j.id;
     elsif j.state='checking' then
       update private.push_deliveries set state='delivered',request_id=null,updated_at=now(),last_error=null where id=j.id;
     else code:='InvalidResponse'; end if;
   else
     code:=coalesce(code,result->'details'->>'error','ReceiptPending');
   end if;
   if code is not null then
     if code='DeviceNotRegistered' then
       update private.push_devices set enabled=false where id=j.device_id and token=j.token;
     end if;
     update private.push_deliveries set
       state=case when code in ('DeviceNotRegistered','MessageTooBig','InvalidCredentials','MismatchSenderId','ConfigurationError')
         or (j.state='sending' and j.attempts>=5) or (j.state='checking' and j.receipt_checks>=8)
         or j.created_at<now()-interval '24 hours' then 'failed'
         when j.state='checking' then 'ticket' else 'queued' end,
       last_error=code,request_id=null,updated_at=now(),
       available_at=now()+case when j.state='checking' then interval '15 minutes' else make_interval(secs=>least(3600,60*power(2,j.attempts)::integer)) end
     where id=j.id;
   end if;
 end loop;
 for j in select d.*,n.user_id,n.reservation_id,n.kind,n.title,n.body from private.push_deliveries d
 join public.notifications n on n.id=d.notification_id
 where d.state in ('queued','ticket') and d.available_at<=now() order by d.id limit 50 for update of d skip locked loop
   if j.created_at<now()-interval '24 hours' then
     update private.push_deliveries set state='failed',last_error='Expired',updated_at=now() where id=j.id; continue;
   end if;
   if j.state='queued' then
     payload:=jsonb_build_object('to',j.token,'sound','default','channelId','activity','title',j.title,'body',j.body,
       'data',jsonb_build_object('notificationId',j.notification_id,'reservationId',j.reservation_id,'kind',j.kind,'userId',j.user_id));
     select net.http_post(url:='https://exp.host/--/api/v2/push/send',body:=payload,headers:=headers,timeout_milliseconds:=10000) into rid;
     update private.push_deliveries set state='sending',request_id=rid,attempts=attempts+1,updated_at=now() where id=j.id;
   else
     select net.http_post(url:='https://exp.host/--/api/v2/push/getReceipts',body:=jsonb_build_object('ids',jsonb_build_array(j.ticket_id)),headers:=headers,timeout_milliseconds:=10000) into rid;
     update private.push_deliveries set state='checking',request_id=rid,receipt_checks=receipt_checks+1,updated_at=now() where id=j.id;
   end if;
 end loop;
end $$;
revoke all on function private.dispatch_push_notifications() from public,anon,authenticated;
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
   perform cron.schedule('connect-push-dispatch','* * * * *','select private.dispatch_push_notifications()');
 end if;
end $$;
