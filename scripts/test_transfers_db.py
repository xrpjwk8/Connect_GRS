"""Reservation transfer permission, atomicity, chat isolation and concurrency tests.
Runs only in the disposable local PostgreSQL harness; never contacts hosted users.
"""
import concurrent.futures
import json
import uuid
import test_chat_notifications_db
import test_supabase_db as base

class TransferTests(base.ReservationTests):
    def listing(self, **kwargs):
        r = self.request(**kwargs); self.decide(r)
        tid = base.DB.rpc('create_transfer', [r['id'], '추가 합의 조건 없음', True], kwargs.get('user', base.BOOKER))
        return r, tid
    def claim(self, tid, user=base.OTHER_BOOKER, key=None):
        return base.DB.rpc('claim_transfer', [tid, key or str(uuid.uuid4()), True], user)
    def detail(self, tid, user=base.OTHER_BOOKER):
        return base.DB.rpc('get_transfer', [tid], user)
    def third_booker(self):
        u=base.NON_SCHOOL
        base.DB.rpc('complete_profile',['booker','새 단체','학교','동아리'],u)
        d=base.DB.rpc('begin_student_verification',['jpg'],u)
        base.DB.run(f"insert into storage.objects(bucket_id,name,owner_id) values ('student-cards',{base.literal(d['document_path'])},'{u}')",u)
        base.DB.rpc('submit_student_verification',[d['request_id']],u)
        base.DB.rpc('review_student_verification',[u,d['request_id'],True,''],base.ADMIN)
        return u
    def test_transfer_atomic_ownership_capacity_and_notifications(self):
        r, tid=self.listing(); before=self.availability(); key=str(uuid.uuid4())
        self.assertEqual(self.claim(tid,key=key),r['id']); self.assertEqual(self.claim(tid,key=key),r['id'])
        self.assertEqual(self.availability(),before)
        row=json.loads(base.DB.run(f"select to_jsonb(r) from public.reservations r where id='{r['id']}'",base.OTHER_BOOKER))
        self.assertEqual(row['booker_id'],base.OTHER_BOOKER); self.assertEqual(row['status'],'confirmed')
        self.assertEqual(row['chat_epoch'],1)
        for u in [base.OWNER,base.BOOKER,base.OTHER_BOOKER]:
            self.assertEqual(base.DB.run("select count(*) from public.notifications where kind='reservation_transferred'",u),'1')
        self.assertEqual(base.DB.run('select count(*) from public.reservations',base.BOOKER),'0')
        self.assertSqlError('42501',lambda:base.DB.rpc('cancel_reservation',[r['id']],base.BOOKER))
        self.assertSqlError('22023',lambda:base.DB.rpc('create_transfer',[r['id'],'조건',True],base.OTHER_BOOKER))
        self.assertEqual(self.detail(tid,base.BOOKER)['status'],'completed')
    def test_board_only_public_projection_and_exact_filters(self):
        r, tid=self.listing(); d=self.detail(tid)
        for key in ['reservation_id','from_name','from_affiliation','to_name','request_message','budget_per_person','from_user_id']:
            self.assertNotIn(key,d)
        self.assertEqual(base.DB.run('select count(*) from public.reservation_transfers',base.OTHER_BOOKER),'0')
        self.assertEqual(base.DB.run('select count(*) from public.reservations',base.OTHER_BOOKER),'0')
        self.assertEqual(len(base.DB.rpc('list_transfers',[base.DAY,1140,20,'신촌',3])),1)
        self.assertEqual(base.DB.rpc('list_transfers',[base.DAY,1140,19,'신촌',3]),[])
        self.assertEqual(base.DB.rpc('list_transfers',[base.DAY,1170,20,'신촌',3]),[])
        self.assertSqlError('42501',lambda:base.DB.run('select public.list_transfers()',anonymous=True))
        self.assertSqlError('42501',lambda:base.DB.rpc('list_transfers',[],base.OWNER))
        self.assertSqlError('42501',lambda:base.DB.run("update public.reservation_transfers set status='completed'",base.BOOKER))
    def test_board_latest_three_and_cursor_no_duplicates(self):
        for minute in [1050,1110,1170,1230,1290]: self.listing(minute=minute)
        first=base.DB.rpc('list_transfers',[None,None,None,'',3]);self.assertEqual(len(first),3)
        last=first[-1]
        second=base.DB.rpc('list_transfers',[None,None,None,'',3,last['created_at'],last['id']]);self.assertEqual(len(second),2)
        self.assertEqual(len({t['id'] for t in first+second}),5)
        self.assertGreaterEqual(first[0]['created_at'],first[1]['created_at'])
    def test_registration_requires_owner_confirmed_deposit_and_terms(self):
        r=self.request()
        self.assertSqlError('22023',lambda:base.DB.rpc('create_transfer',[r['id'],'조건',True]))
        self.decide(r)
        self.assertSqlError('42501',lambda:base.DB.rpc('create_transfer',[r['id'],'조건',True],base.OTHER_BOOKER))
        for terms, deposit in [('조건',False),('조건',None),('',True),('x'*1001,True)]:
            self.assertSqlError('22023',lambda:base.DB.rpc('create_transfer',[r['id'],terms,deposit]))
        tid=base.DB.rpc('create_transfer',[r['id'],'조건',True])
        self.assertEqual(tid,base.DB.rpc('create_transfer',[r['id'],'조건',True]))
        self.assertSqlError('22023',lambda:base.DB.rpc('create_transfer',[r['id'],'다른 조건',True]))
        self.assertSqlError('42501',lambda:self.claim(tid,user=base.BOOKER))
    def test_edit_requires_withdrawal_and_cancel_ends_board(self):
        r,tid=self.listing()
        self.assertSqlError('22023',lambda:base.DB.rpc('edit_reservation',[r['id'],base.DAY,1200,2,20]))
        base.DB.run(f"select public.withdraw_transfer('{tid}')",base.BOOKER)
        self.assertEqual(self.detail(tid)['status'],'withdrawn'); self.assertEqual(base.DB.rpc('list_transfers',[]),[])
        base.DB.rpc('edit_reservation',[r['id'],base.DAY,1200,2,20]);self.decide(r)
        tid=base.DB.rpc('create_transfer',[r['id'],'조건',True]);base.DB.rpc('cancel_reservation',[r['id']],base.OWNER)
        self.assertEqual(self.detail(tid)['status'],'cancelled')
        self.assertSqlError('22023',lambda:self.claim(tid))
    def test_unverified_recipient_cannot_claim(self):
        r,tid=self.listing()
        base.DB.rpc('complete_profile',['booker','이름 변경','학교','단체'],base.OTHER_BOOKER)
        self.assertSqlError('42501',lambda:self.claim(tid))
        self.assertEqual(self.detail(tid)['status'],'active')
    def test_concurrent_claim_exactly_one_winner(self):
        third=self.third_booker();r,tid=self.listing()
        def take(user):
            try: self.claim(tid,user); return 'ok'
            except RuntimeError as e: self.assertIn('22023',str(e));return 'conflict'
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            self.assertCountEqual(list(pool.map(take,[base.OTHER_BOOKER,third])),['ok','conflict'])
        self.assertEqual(base.DB.run("select count(*) from public.reservation_transfers where status='completed'"),'1')
    def test_concurrent_same_request_returns_same_result(self):
        r,tid=self.listing();key=str(uuid.uuid4())
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            results=list(pool.map(lambda _:self.claim(tid,key=key),range(2)))
        self.assertEqual(results,[r['id'],r['id']])
        self.assertEqual(base.DB.run("select count(*) from public.notifications where kind='reservation_transferred'"),'3')
    def test_claim_vs_withdraw_or_cancel_is_serialized(self):
        for operation in ['withdraw','cancel']:
            r,tid=self.listing(minute=1050 if operation=='withdraw' else 1200)
            def act(kind):
                try:
                    if kind=='claim':self.claim(tid)
                    elif operation=='withdraw':base.DB.run(f"select public.withdraw_transfer('{tid}')",base.BOOKER)
                    else:base.DB.rpc('cancel_reservation',[r['id']],base.BOOKER)
                    return 'ok'
                except RuntimeError as e:
                    self.assertRegex(str(e),'22023|42501');return 'conflict'
            with concurrent.futures.ThreadPoolExecutor(2) as pool:
                self.assertCountEqual(list(pool.map(act,['claim','other'])),['ok','conflict'])
    def test_chat_epoch_isolates_history_and_stale_send(self):
        r,tid=self.listing();self.send(r,'이전 비밀'); self.send(r,'점주 이전 메시지',user=base.OWNER)
        self.claim(tid)
        self.assertEqual(base.DB.run('select count(*) from public.chat_messages',base.OTHER_BOOKER),'0')
        for user in [base.BOOKER,base.OWNER]:self.assertEqual(base.DB.run('select count(*) from public.chat_messages',user),'2')
        self.assertSqlError('42501',lambda:self.send(r,user=base.BOOKER))
        self.assertSqlError('22023',lambda:self.send(r,user=base.OWNER))
        self.assertSqlError('22023',lambda:base.DB.rpc('send_chat_message_epoch',[r['id'],'잘못된 대화',str(uuid.uuid4()),0],base.OTHER_BOOKER))
        base.DB.rpc('send_chat_message_epoch',[r['id'],'새 대화',str(uuid.uuid4()),1],base.OTHER_BOOKER)
        self.assertEqual(base.DB.run('select count(*) from public.chat_messages',base.BOOKER),'2')
        self.assertEqual(base.DB.run('select count(*) from public.chat_messages',base.OTHER_BOOKER),'1')
        self.assertEqual(base.DB.run("select chat_epoch from public.notifications where kind='chat_message' order by created_at desc limit 1",base.OWNER),'1')
    def test_chat_and_transfer_concurrency_no_deadlock_or_cross_party_delivery(self):
        r,tid=self.listing()
        def act(kind):
            try:
                if kind=='claim':self.claim(tid)
                else:self.send(r,'동시 메시지',user=base.OWNER if kind=='owner' else base.BOOKER)
                return 'ok'
            except RuntimeError as e:
                self.assertRegex(str(e),'22023|42501');self.assertNotIn('40P01',str(e));return 'closed'
        with concurrent.futures.ThreadPoolExecutor(3) as pool:
            results=list(pool.map(act,['claim','owner','booker']))
        self.assertEqual(results[0],'ok')
        self.assertEqual(base.DB.run('select count(*) from public.chat_messages',base.OTHER_BOOKER),'0')
    def test_notification_failure_rolls_back_whole_transfer(self):
        r,tid=self.listing()
        base.DB.run("create function private.test_reject_transfer_notification() returns trigger language plpgsql as $$ begin if new.kind='reservation_transferred' then raise exception 'test notification failure'; end if; return new; end $$; create trigger test_reject before insert on public.notifications for each row execute function private.test_reject_transfer_notification()")
        try:
            self.assertSqlError('P0001',lambda:self.claim(tid))
            self.assertEqual(self.detail(tid)['status'],'active')
            self.assertEqual(base.DB.run(f"select booker_id from public.reservations where id='{r['id']}'"),base.BOOKER)
            self.assertEqual(base.DB.run(f"select chat_epoch from public.reservations where id='{r['id']}'"),'0')
        finally:
            base.DB.run('drop trigger test_reject on public.notifications; drop function private.test_reject_transfer_notification()')
    def test_optional_memo_legacy_and_fifty_character_limit(self):
        r,tid=self.listing()
        self.assertEqual(self.detail(tid,base.BOOKER)['memo'],'')
        base.DB.run(f"select public.withdraw_transfer('{tid}')",base.BOOKER)
        memo='가'*50
        tid=base.DB.rpc('create_transfer',[r['id'],'조건',True,memo])
        self.assertEqual(self.detail(tid,base.BOOKER)['memo'],memo)
        self.assertEqual(base.DB.rpc('create_transfer',[r['id'],'조건',True,memo]),tid)
        self.assertSqlError('22023',lambda:base.DB.rpc('create_transfer',[r['id'],'조건',True,'다른 메모']))
    def test_memo_visible_only_to_sender_and_actual_recipient(self):
        r=self.request();self.decide(r)
        tid=base.DB.rpc('create_transfer',[r['id'],'조건',True,'좋은 모임 되세요'])
        self.assertNotIn('memo',self.detail(tid,base.OTHER_BOOKER))
        self.assertNotIn('memo',self.detail(tid,base.OWNER))
        self.assertNotIn('memo',base.DB.rpc('list_transfers',[],base.OTHER_BOOKER)[0])
        self.assertSqlError('42501',lambda:base.DB.run('select * from private.transfer_memos',base.OWNER))
        self.claim(tid)
        self.assertEqual(self.detail(tid,base.OTHER_BOOKER)['memo'],'좋은 모임 되세요')
        self.assertEqual(self.detail(tid,base.BOOKER)['memo'],'좋은 모임 되세요')
        self.assertNotIn('memo',self.detail(tid,base.OWNER))
    def test_memo_server_rejects_emoji_and_long_text(self):
        r=self.request();self.decide(r)
        for memo in ['가'*51,'𠮷'*51,'🙂','🇰🇷','👨‍👩‍👧','1️⃣','👍🏽','❤️','☺','🫩','©','조건\n메모']:
            self.assertSqlError('22023',lambda:base.DB.rpc('create_transfer',[r['id'],'조건',True,memo]))
        self.assertEqual(base.DB.run('select count(*) from public.reservation_transfers'),'0')
        tid=base.DB.rpc('create_transfer',[r['id'],'조건',True,'예약 2층 #3번 *좌석*'])
        self.assertEqual(self.detail(tid,base.BOOKER)['memo'],'예약 2층 #3번 *좌석*')
        self.assertSqlError('23514',lambda:base.DB.run(f"update private.transfer_memos set memo='🙂' where transfer_id='{tid}'"))
    def test_private_notes_not_inherited(self):
        r=self.request();base.DB.rpc('edit_reservation',[r['id'],base.DAY,1140,2,20,None,'비밀 행사','개인 연락처']);self.decide(r)
        tid=base.DB.rpc('create_transfer',[r['id'],'합의 조건만',True]);self.claim(tid)
        self.assertEqual(base.DB.run(f"select event_purpose||request_message from public.reservations where id='{r['id']}'",base.OTHER_BOOKER),'')
    def test_expiry_and_unapproved_store_prevent_claim(self):
        r,tid=self.listing()
        base.DB.run(f"update public.reservation_transfers set starts_at=now()-interval '1 second' where id='{tid}'")
        # Authoritative reservation time must also be checked; construct a past reservation with internal fixture SQL.
        base.DB.run(f"update public.reservation_transfers set status='withdrawn' where id='{tid}'")
        base.DB.run(f"update public.reservations set service_date=current_date-1,starts_at=private.slot_start(current_date-1,start_minute),ends_at=private.slot_start(current_date-1,start_minute+slot_count*30) where id='{r['id']}'")
        base.DB.run(f"update public.reservation_transfers set status='active' where id='{tid}'")
        self.assertEqual(self.detail(tid)['status'],'expired');self.assertEqual(base.DB.rpc('list_transfers',[]),[])
        self.assertSqlError('22023',lambda:self.claim(tid))
        r,tid=self.listing(minute=1200);base.DB.rpc('approve_store',[self.store,False],base.ADMIN)
        self.assertEqual(base.DB.rpc('list_transfers',[]),[]);self.assertSqlError('42501',lambda:self.claim(tid))

base.ReservationTests=TransferTests
if __name__=='__main__':raise SystemExit(base.main())
