#!/usr/bin/env python3
"""Extends disposable DB suite with owner schedule authorization and constraints."""
import test_supabase_db as base

def insert(self, user=base.OWNER, title='입고', start='960', end='990'):
    return base.DB.run(f"insert into public.owner_schedule_events(store_id,service_date,title,start_minute,end_minute) values ({base.literal(self.store)},{base.literal(base.DAY)},{base.literal(title)},{start},{end}) returning id;", user)

def test_owner_schedule_rls(self):
    event = insert(self)
    self.assertEqual(base.DB.run('select count(*) from public.owner_schedule_events;', base.OWNER), '1')
    for user in [base.OTHER_OWNER, base.BOOKER]:
        self.assertEqual(base.DB.run('select count(*) from public.owner_schedule_events;', user), '0')
        self.assertSqlError('42501', lambda user=user: insert(self, user))
        base.DB.run(f"delete from public.owner_schedule_events where id={base.literal(event)};", user)
    self.assertEqual(base.DB.run('select count(*) from public.owner_schedule_events;', base.OWNER), '1')
    other_store=base.DB.rpc('register_store',['다른 매장','신촌','주점',20],base.OTHER_OWNER)['id']
    self.assertSqlError('42501',lambda:base.DB.run(f"update public.owner_schedule_events set store_id={base.literal(other_store)} where id={base.literal(event)};",base.OWNER))
    self.assertSqlError('42501',lambda:base.DB.run('select * from public.owner_schedule_events;',anonymous=True))
    base.DB.run(f"update public.owner_schedule_events set title='수정' where id={base.literal(event)};",base.OWNER)
    self.assertEqual(base.DB.run('select title from public.owner_schedule_events;',base.OWNER),'수정')
    base.DB.run(f"delete from public.owner_schedule_events where id={base.literal(event)};",base.OWNER)
    self.assertEqual(base.DB.run('select count(*) from public.owner_schedule_events;',base.OWNER),'0')

def test_schedule_constraints_and_no_reservation_block(self):
    insert(self,start='null',end='null')
    for start,end in [('960','null'),('null','990'),('961','990'),('960','960'),('1770','1830')]:
        self.assertSqlError('23514',lambda start=start,end=end:insert(self,start=start,end=end))
    self.assertSqlError('23514',lambda:insert(self,title=' '))
    self.assertSqlError('23514',lambda:insert(self,title='a'*81))
    insert(self,start='1440',end='1470')
    self.assertEqual(self.availability(1440)['remaining_seats'],40)
    self.assertEqual(base.DB.run('select count(*) from public.time_blocks;',base.OWNER),'0')

base.ReservationTests.test_owner_schedule_rls=test_owner_schedule_rls
base.ReservationTests.test_schedule_constraints_and_no_reservation_block=test_schedule_constraints_and_no_reservation_block
if __name__=='__main__':raise SystemExit(base.main())
