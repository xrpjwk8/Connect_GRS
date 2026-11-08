"""Chat/notification permission, idempotency and dispatcher transport tests."""
import uuid
import json
import concurrent.futures
import test_store_photos_db
import test_supabase_db as base

class ChatPushTests(base.ReservationTests):
    def device(self, user=base.OWNER):
        device=str(uuid.uuid4()); token='ExpoPushToken['+uuid.uuid4().hex+']'
        base.DB.run(f"select public.register_push_device('{device}','{token}','ios')", user)
        return device
    def send(self, reservation, text='안녕하세요', user=base.BOOKER, key=None):
        return base.DB.rpc('send_chat_message',[reservation['id'],text,key or str(uuid.uuid4())],user)
    def inbox(self, user):
        return json.loads(base.DB.run("select coalesce(jsonb_agg(kind),'[]') from public.notifications",user))
    def dispatch(self): base.DB.run('select private.dispatch_push_notifications()')
    def test_chat_participants_and_idempotency(self):
        r=self.request(); key=str(uuid.uuid4()); m=self.send(r,key=key)
        self.assertEqual(self.send(r,key=key)['id'],m['id'])
        self.assertSqlError('22023',lambda:self.send(r,'different',key=key))
        for user in [base.OTHER_OWNER,base.OTHER_BOOKER,base.ADMIN]:
            self.assertSqlError('42501',lambda:self.send(r,user=user))
            self.assertEqual(base.DB.run('select count(*) from public.chat_messages',user),'0')
        self.assertEqual(base.DB.run('select count(*) from public.chat_messages',base.OWNER),'1')
        self.assertEqual(self.inbox(base.OWNER).count('chat_message'),1)
        self.assertNotIn('chat_message',self.inbox(base.BOOKER))
        self.decide(r,False)
        self.assertSqlError('22023',lambda:self.send(r))
        self.assertEqual(base.DB.run('select count(*) from public.chat_messages',base.BOOKER),'1')
    def test_notifications_reservation_and_cancel_target(self):
        r=self.request(); self.assertEqual(self.inbox(base.OWNER),['reservation_requested'])
        self.decide(r); self.decide(r)
        self.assertEqual(self.inbox(base.BOOKER),['reservation_confirmed'])
        base.DB.rpc('cancel_reservation',[r['id']],base.BOOKER)
        self.assertIn('reservation_cancelled',self.inbox(base.OWNER))
        self.assertNotIn('reservation_cancelled',self.inbox(base.BOOKER))
        self.assertEqual(self.inbox(base.OTHER_BOOKER),[])
    def test_chat_notification_preview_is_bounded_and_recipient_only(self):
        r=self.request()
        body='한글🙂'*50
        self.send(r,body)
        preview=base.DB.run("select body from public.notifications where kind='chat_message'",base.OWNER)
        self.assertEqual(preview,body[:120]+'…')
        self.assertEqual(base.DB.run("select body from public.notifications where kind='chat_message'",base.OTHER_BOOKER),'')
        self.send(r,'짧은 메시지',user=base.OWNER)
        self.assertEqual(base.DB.run("select body from public.notifications where kind='chat_message'",base.BOOKER),'짧은 메시지')
    def test_concurrent_chat_retry_creates_one_message_and_one_notification(self):
        r=self.request(); key=str(uuid.uuid4())
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            ids=list(pool.map(lambda _: self.send(r,key=key)['id'],range(2)))
        self.assertEqual(ids[0],ids[1])
        self.assertEqual(self.inbox(base.OWNER).count('chat_message'),1)
    def test_unapproved_student_cannot_send_and_manual_reservation_cannot_chat(self):
        r=self.request()
        base.DB.rpc('complete_profile',['booker','변경된 이름','연세대학교','동아리'],base.BOOKER)
        self.assertSqlError('42501',lambda:self.send(r))
        manual=base.DB.rpc('create_manual_reservation',[self.store,base.DAY,1200,2,10,'전화',str(uuid.uuid4())],base.OWNER)
        self.assertSqlError('42501',lambda:self.send(manual,user=base.OWNER))
    def test_notification_read_is_owner_scoped(self):
        r=self.request(); row=base.DB.run("select id from public.notifications limit 1")
        base.DB.run(f"select public.mark_notification_read('{row}')",base.BOOKER)
        self.assertEqual(base.DB.run(f"select read_at is null from public.notifications where id='{row}'",base.OWNER),'t')
        base.DB.run(f"select public.mark_notification_read('{row}')",base.OWNER)
        self.assertEqual(base.DB.run(f"select read_at is not null from public.notifications where id='{row}'",base.OWNER),'t')
    def test_chat_limits_and_direct_writes(self):
        r=self.request()
        self.assertSqlError('22023',lambda:self.send(r,' '))
        self.assertSqlError('22023',lambda:self.send(r,'x'*2001))
        for _ in range(20): self.send(r)
        self.assertSqlError('54000',lambda:self.send(r))
        self.assertSqlError('42501',lambda:base.DB.run('delete from public.chat_messages',base.BOOKER))
        self.assertSqlError('42501',lambda:base.DB.run('select * from private.push_devices',base.BOOKER))
        self.assertSqlError('42501',lambda:base.DB.run('select private.dispatch_push_notifications()',base.BOOKER))
    def test_dispatch_ticket_receipt_and_logout(self):
        device=self.device(); self.request(); self.dispatch()
        row=json.loads(base.DB.run("select to_jsonb(d) from private.push_deliveries d order by id desc limit 1"))
        self.assertEqual(row['state'],'sending')
        base.DB.run(f"insert into net._http_response(id,status_code,content) values ({row['request_id']},200,'{{\"data\":{{\"status\":\"ok\",\"id\":\"ticket\"}}}}')")
        self.dispatch()
        self.assertEqual(base.DB.run(f"select state from private.push_deliveries where id={row['id']}"),'ticket')
        base.DB.run(f"update private.push_deliveries set available_at=now() where id={row['id']}")
        self.dispatch()
        rid=base.DB.run(f"select request_id from private.push_deliveries where id={row['id']}")
        base.DB.run(f"insert into net._http_response(id,status_code,content) values ({rid},200,'{{\"data\":{{\"ticket\":{{\"status\":\"ok\"}}}}}}')")
        self.dispatch()
        self.assertEqual(base.DB.run(f"select state from private.push_deliveries where id={row['id']}"),'delivered')
        self.request(minute=1200); base.DB.run(f"select public.unregister_push_device('{device}')",base.OWNER); self.dispatch()
        self.assertEqual(base.DB.run("select state from private.push_deliveries order by id desc limit 1"),'cancelled')
    def test_invalid_token_disabled_and_transient_failure_retried(self):
        device=self.device(); self.request(); self.dispatch()
        row=json.loads(base.DB.run('select to_jsonb(d) from private.push_deliveries d order by id desc limit 1'))
        base.DB.run(f"insert into net._http_response(id,status_code,content) values ({row['request_id']},503,'{{}}')")
        self.dispatch(); self.assertEqual(base.DB.run(f"select state from private.push_deliveries where id={row['id']}"),'queued')
        base.DB.run(f"update private.push_deliveries set available_at=now() where id={row['id']}");self.dispatch()
        rid=base.DB.run(f"select request_id from private.push_deliveries where id={row['id']}")
        base.DB.run(f"insert into net._http_response(id,status_code,content) values ({rid},200,'{{\"data\":{{\"status\":\"error\",\"details\":{{\"error\":\"DeviceNotRegistered\"}}}}}}')")
        self.dispatch()
        self.assertEqual(base.DB.run(f"select enabled from private.push_devices where id='{device}'"),'f')
    def test_account_rebind_cancels_previous_account_delivery(self):
        device=self.device();self.request()
        token=base.DB.run(f"select token from private.push_devices where id='{device}'")
        base.DB.run(f"select public.register_push_device('{device}','{token}','ios')",base.OTHER_OWNER)
        self.dispatch();self.assertEqual(base.DB.run('select state from private.push_deliveries order by id desc limit 1'),'cancelled')

base.ReservationTests=ChatPushTests
if __name__=='__main__': raise SystemExit(base.main())
