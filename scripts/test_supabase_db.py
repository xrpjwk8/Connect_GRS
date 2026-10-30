#!/usr/bin/env python3
"""Run migrations and security/concurrency tests in a disposable PostgreSQL cluster.

Requires PostgreSQL 16+ binaries on PATH (or PG_BIN). Never connects to a hosted DB.
Auth is stubbed only in this isolated cluster; hosted Auth/PostgREST need separate QA.
"""
import concurrent.futures
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]
OWNER = '11111111-1111-4111-8111-111111111111'
OTHER_OWNER = '22222222-2222-4222-8222-222222222222'
BOOKER = '33333333-3333-4333-8333-333333333333'
OTHER_BOOKER = '44444444-4444-4444-8444-444444444444'
ADMIN = '55555555-5555-4555-8555-555555555555'
UNVERIFIED = '66666666-6666-4666-8666-666666666666'
NON_SCHOOL = '77777777-7777-4777-8777-777777777777'
DAY = (datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()
       + datetime.timedelta(days=7)).isoformat()


def literal(value):
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


class Database:
    def __init__(self, binaries, socket):
        self.psql = [str(binaries / 'psql'), '-X', '-qAt', '-v', 'ON_ERROR_STOP=1',
                     '-v', 'VERBOSITY=verbose', '-h', socket, '-p', '55439', '-U', 'postgres', '-d', 'postgres']

    def run(self, sql, user=None, anonymous=False):
        if user or anonymous:
            role = 'anon' if anonymous else 'authenticated'
            sql = f"set role {role}; set request.jwt.claim.sub = {literal(user or '')};\n" + sql
        result = subprocess.run(self.psql, input=sql, text=True, capture_output=True, timeout=20)
        if result.returncode:
            raise RuntimeError(result.stderr)
        return result.stdout.strip()

    def rpc(self, function, args, user=BOOKER):
        return json.loads(self.run(f"select to_jsonb(public.{function}({','.join(map(literal, args))}));", user))


DB = None


class ReservationTests(unittest.TestCase):
    def setUp(self):
        DB.run('truncate auth.users cascade;')
        for user, email, verified in [
            (OWNER, 'owner@example.com', True), (OTHER_OWNER, 'owner2@example.com', True),
            (BOOKER, 'booker@yonsei.ac.kr', True), (OTHER_BOOKER, 'booker2@yonsei.ac.kr', True),
            (ADMIN, 'admin@example.com', True), (UNVERIFIED, 'u@yonsei.ac.kr', False),
            (NON_SCHOOL, 'other@example.com', True)
        ]:
            DB.run(f"insert into auth.users(id,email,email_confirmed_at) values "
                   f"({literal(user)},{literal(email)},{'now()' if verified else 'null'});")
        DB.run(f"insert into private.admin_users values ({literal(ADMIN)});")
        for user, role in [(OWNER, 'owner'), (OTHER_OWNER, 'owner'), (BOOKER, 'booker'), (OTHER_BOOKER, 'booker')]:
            DB.rpc('complete_profile', [role, '테스트 사용자', '연세대학교', '동아리'], user)
        self.store = DB.rpc('register_store', ['캠퍼스 포차', '신촌', '주점', 40], OWNER)['id']
        DB.rpc('approve_store', [self.store, True], ADMIN)

    def request(self, people=20, minute=1140, count=2, user=BOOKER, date=DAY, key=None):
        return DB.rpc('request_reservation', [self.store, date, minute, count, people, key or str(uuid.uuid4())], user)

    def decide(self, reservation, accept=True, user=OWNER):
        return DB.rpc('decide_reservation', [reservation['id'], accept], user)

    def blocks(self, minutes, user=OWNER, date=DAY):
        array = 'ARRAY[' + ','.join(str(m) for m in minutes) + ']::integer[]'
        return DB.run(f"select public.replace_time_blocks({literal(self.store)},{literal(date)},{array});", user)

    def availability(self, minute=1140, date=DAY):
        return json.loads(DB.run(f"select to_jsonb(a) from public.get_availability({literal(self.store)},"
                                f"{literal(date)}) a where start_minute={minute};", anonymous=True))

    def assertSqlError(self, code, action):
        with self.assertRaisesRegex(RuntimeError, code):
            action()

    def test_verified_school_identity_and_immutable_role(self):
        self.assertSqlError('42501', lambda: DB.rpc('complete_profile', ['booker', '이름', '학교'], UNVERIFIED))
        self.assertSqlError('42501', lambda: DB.rpc('complete_profile', ['booker', '이름', '학교'], NON_SCHOOL))
        self.assertSqlError('42501', lambda: DB.rpc('complete_profile', ['owner', '이름'], BOOKER))
        self.assertSqlError('42501', lambda: DB.rpc('register_store', ['가게', '신촌', '주점', 20], BOOKER))

    def test_unapproved_store_is_private_and_cannot_be_booked(self):
        DB.rpc('approve_store', [self.store, False], ADMIN)
        self.assertEqual(DB.run('select count(*) from public.stores;', anonymous=True), '0')
        self.assertEqual(DB.run('select count(*) from public.stores;', OWNER), '1')
        self.assertEqual(DB.run('select count(*) from public.stores;', OTHER_OWNER), '0')
        self.assertSqlError('P0002', self.request)
        self.assertSqlError('42501', lambda: DB.rpc('approve_store', [self.store, True], OWNER))

    def test_reservations_and_profiles_are_visible_only_to_participants(self):
        self.request()
        for user, expected in [(BOOKER, '1'), (OWNER, '1'), (OTHER_BOOKER, '0'), (OTHER_OWNER, '0'), (ADMIN, '1')]:
            self.assertEqual(DB.run('select count(*) from public.reservations;', user), expected)
        self.assertEqual(DB.run('select count(*) from public.profiles;', BOOKER), '1')
        self.assertSqlError('42501', lambda: DB.run('select * from public.reservations;', anonymous=True))
        self.assertSqlError('42501', lambda: DB.run('select * from private.admin_users;', BOOKER))

    def test_direct_writes_and_internal_functions_are_denied(self):
        self.request()
        self.assertSqlError('42501', lambda: DB.run("update public.reservations set status='confirmed';", BOOKER))
        self.assertSqlError('42501', lambda: DB.run('update public.stores set approved=true;', OWNER))
        self.assertSqlError('42501', lambda: DB.run("update public.profiles set role='owner';", BOOKER))
        self.assertSqlError('42501', lambda: DB.run('select private.require_profile();', BOOKER))
        self.assertSqlError('42501', lambda: DB.run(f"select public.cancel_reservation('{uuid.uuid4()}');", anonymous=True))

    def test_pending_does_not_consume_capacity_and_accept_rechecks(self):
        first, second = self.request(25), self.request(20, user=OTHER_BOOKER)
        self.assertEqual(self.availability()['remaining_seats'], 40)
        self.decide(first)
        self.assertEqual(self.availability()['remaining_seats'], 15)
        self.assertSqlError('23514', lambda: self.decide(second))

    def test_invalid_times_and_capacity(self):
        for args in [dict(people=41), dict(people=0), dict(minute=1141), dict(count=0),
                     dict(count=7), dict(minute=990), dict(minute=1440, count=2), dict(date='2000-01-01')]:
            self.assertSqlError('22023', lambda args=args: self.request(**args))

    def test_duplicate_request_is_idempotent_and_payload_must_match(self):
        key = str(uuid.uuid4())
        first = self.request(key=key)
        self.assertEqual(first['id'], self.request(key=key)['id'])
        self.assertSqlError('22023', lambda: self.request(people=21, key=key))
        self.assertEqual(DB.run('select count(*) from public.reservations;'), '1')

    def test_other_users_cannot_mutate_reservation(self):
        res = self.request()
        self.assertSqlError('42501', lambda: self.decide(res, user=OTHER_OWNER))
        self.assertSqlError('42501', lambda: DB.rpc('cancel_reservation', [res['id']], OTHER_BOOKER))
        self.assertSqlError('42501', lambda: DB.rpc('edit_reservation', [res['id'], DAY, 1200, 2, 10], OTHER_BOOKER))
        self.assertSqlError('42501', lambda: self.blocks([1140], OTHER_OWNER))

    def test_blocks_affect_search_requests_and_later_approval(self):
        pending = self.request()
        self.blocks([1140, 1140])
        self.assertEqual(self.availability()['remaining_seats'], 0)
        self.assertSqlError('23514', self.request)
        self.assertSqlError('23514', lambda: self.decide(pending))
        results = DB.run(f"select count(*) from public.search_stores('신촌',null,'{DAY}',1140,2,20);", anonymous=True)
        self.assertEqual(results, '0')
        self.blocks([])
        self.decide(pending)
        self.assertSqlError('23514', lambda: self.blocks([1140]))

    def test_search_requires_whole_consecutive_range(self):
        self.blocks([1170])
        self.assertEqual(DB.run(f"select count(*) from public.search_stores('신촌',null,'{DAY}',1140,2,20);", anonymous=True), '0')
        self.assertEqual(DB.run(f"select count(*) from public.search_stores('신촌',null,'{DAY}',1200,2,20);", anonymous=True), '1')
        self.assertEqual(DB.run(f"select count(*) from public.search_stores('홍대',null,'{DAY}',1200,2,20);", anonymous=True), '0')

    def test_edit_confirmed_requires_reapproval_and_releases_old_capacity(self):
        res = self.decide(self.request(30))
        updated = DB.rpc('edit_reservation', [res['id'], DAY, 1200, 2, 35], BOOKER)
        self.assertEqual(updated['status'], 'pending')
        self.assertEqual(self.availability()['remaining_seats'], 40)
        self.decide(updated)
        self.assertEqual(self.availability(1200)['remaining_seats'], 5)

    def test_illegal_status_changes_and_cancel_idempotency(self):
        res = self.decide(self.request(), False)
        self.assertSqlError('22023', lambda: self.decide(res))
        self.assertSqlError('22023', lambda: DB.rpc('cancel_reservation', [res['id']]))
        confirmed = self.decide(self.request())
        self.assertSqlError('22023', lambda: DB.rpc('complete_reservation', [confirmed['id']], OWNER))
        self.assertEqual(DB.rpc('cancel_reservation', [confirmed['id']])['status'], 'cancelled')
        self.assertEqual(DB.rpc('cancel_reservation', [confirmed['id']])['status'], 'cancelled')

    def test_manual_reservation_persists_and_consumes_capacity(self):
        args = [self.store, DAY, 1140, 2, 25, '전화 예약', str(uuid.uuid4())]
        res = DB.rpc('create_manual_reservation', args, OWNER)
        self.assertEqual(res['status'], 'confirmed')
        self.assertTrue(res['is_manual'])
        self.assertEqual(DB.rpc('create_manual_reservation', args, OWNER)['id'], res['id'])
        self.assertEqual(self.availability()['remaining_seats'], 15)
        self.assertSqlError('23514', lambda: self.request(20))
        self.assertSqlError('42501', lambda: DB.rpc('create_manual_reservation', args, OTHER_OWNER))

    def test_exclusive_mode_and_capacity_changes_protect_existing_reservations(self):
        first = self.decide(self.request(20))
        self.decide(self.request(15, user=OTHER_BOOKER))
        for settings in [[30, True, 1020, 1470], [40, False, 1020, 1470], [40, True, 1200, 1470]]:
            self.assertSqlError('23514', lambda s=settings: DB.rpc('update_store_capacity', [self.store] + s, OWNER))
        DB.rpc('cancel_reservation', [first['id']], BOOKER)
        DB.rpc('update_store_capacity', [self.store, 40, False, 1020, 1470], OWNER)
        self.assertEqual(self.availability()['remaining_seats'], 0)
        self.assertSqlError('23514', lambda: self.request(1))

    def test_midnight_and_adjacent_service_dates_share_capacity(self):
        DB.rpc('update_store_capacity', [self.store, 40, True, 0, 1470], OWNER)
        self.decide(self.request(30, minute=1440, count=1))
        tomorrow = (datetime.date.fromisoformat(DAY) + datetime.timedelta(days=1)).isoformat()
        self.assertEqual(self.availability(0, tomorrow)['remaining_seats'], 10)
        self.assertSqlError('23514', lambda: self.request(20, minute=0, count=1, date=tomorrow))
        self.assertSqlError('23514', lambda: self.blocks([0], date=tomorrow))

    def test_favorites_are_personal(self):
        DB.run(f"insert into public.favorites values ('{BOOKER}','{self.store}');", BOOKER)
        self.assertEqual(DB.run('select count(*) from public.favorites;', OTHER_BOOKER), '0')
        self.assertSqlError('42501', lambda: DB.run(f"insert into public.favorites values ('{OTHER_BOOKER}','{self.store}');", BOOKER))

    def test_completed_reservation_cannot_be_reopened_or_cancelled(self):
        res = self.decide(self.request())
        # Move a fixture into the past as the test administrator; client writes remain denied.
        DB.run(f"update public.reservations set service_date=service_date-30,"
               f"starts_at=starts_at-interval '30 days', ends_at=ends_at-interval '30 days' where id='{res['id']}';")
        self.assertSqlError('42501', lambda: DB.rpc('complete_reservation', [res['id']], OTHER_OWNER))
        self.assertEqual(DB.rpc('complete_reservation', [res['id']], OWNER)['status'], 'completed')
        self.assertEqual(DB.rpc('complete_reservation', [res['id']], OWNER)['status'], 'completed')
        self.assertSqlError('22023', lambda: DB.rpc('cancel_reservation', [res['id']], OWNER))
        self.assertSqlError('22023', lambda: self.decide(res))

    def test_failed_block_replacement_preserves_previous_blocks(self):
        self.blocks([1200])
        self.decide(self.request())
        self.assertSqlError('23514', lambda: self.blocks([1140]))
        self.assertTrue(self.availability(1200)['blocked'])

    def test_concurrent_duplicate_request_creates_one_row(self):
        key = str(uuid.uuid4())
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            reservations = list(pool.map(lambda _: self.request(key=key), range(2)))
        self.assertEqual(reservations[0]['id'], reservations[1]['id'])
        self.assertEqual(DB.run('select count(*) from public.reservations;'), '1')

    def test_concurrent_approvals_do_not_overbook(self):
        first, second = self.request(25), self.request(25, user=OTHER_BOOKER)
        def accept(res):
            try:
                return self.decide(res)['status']
            except RuntimeError as e:
                self.assertIn('23514', str(e))
                return 'rejected-capacity'
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            outcomes = list(pool.map(accept, [first, second]))
        self.assertCountEqual(outcomes, ['confirmed', 'rejected-capacity'])
        self.assertEqual(self.availability()['remaining_seats'], 15)

    def test_concurrent_block_and_approval_cannot_both_succeed(self):
        res = self.request()
        def action(kind):
            try:
                self.decide(res) if kind == 'accept' else self.blocks([1140])
                return 'ok'
            except RuntimeError as e:
                self.assertIn('23514', str(e))
                return 'conflict'
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            self.assertCountEqual(list(pool.map(action, ['accept', 'block'])), ['ok', 'conflict'])

    def test_concurrent_manual_and_approval_do_not_overbook(self):
        pending = self.request(25)
        def action(kind):
            try:
                if kind == 'accept':
                    self.decide(pending)
                else:
                    DB.rpc('create_manual_reservation', [self.store, DAY, 1140, 2, 25, '전화', str(uuid.uuid4())], OWNER)
                return 'ok'
            except RuntimeError as e:
                self.assertIn('23514', str(e))
                return 'conflict'
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            self.assertCountEqual(list(pool.map(action, ['accept', 'manual'])), ['ok', 'conflict'])


def main():
    global DB
    if os.environ.get('PG_BIN'):
        binaries = Path(os.environ['PG_BIN'])
    else:
        pg_config = shutil.which('pg_config')
        if not pg_config:
            raise SystemExit('PostgreSQL 16+ is required. Set PG_BIN to its bin directory.')
        binaries = Path(subprocess.check_output([pg_config, '--bindir'], text=True).strip())
    with tempfile.TemporaryDirectory(prefix='connect-db-', dir='/tmp') as directory:
        cluster = Path(directory) / 'data'
        log = Path(directory) / 'postgres.log'
        initialized = subprocess.run(
            [str(binaries / 'initdb'), '-D', str(cluster), '-A', 'trust', '-U', 'postgres', '--no-locale', '-E', 'UTF8'],
            capture_output=True, text=True)
        if initialized.returncode:
            raise SystemExit(initialized.stderr)
        start = subprocess.run([str(binaries / 'pg_ctl'), '-D', str(cluster), '-l', str(log), '-o',
                                f"-h '' -k {directory} -p 55439", '-w', 'start'], capture_output=True, text=True)
        if start.returncode:
            raise SystemExit(start.stderr + (log.read_text() if log.exists() else ''))
        try:
            DB = Database(binaries, directory)
            for file in [ROOT / 'supabase/tests/bootstrap.sql', *sorted((ROOT / 'supabase/migrations').glob('*.sql'))]:
                DB.run('begin;\n' + file.read_text() + '\ncommit;')
                print(f'Applied {file.name}', flush=True)
            result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ReservationTests))
            return 0 if result.wasSuccessful() else 1
        finally:
            subprocess.run([str(binaries / 'pg_ctl'), '-D', str(cluster), '-m', 'fast', '-w', 'stop'], capture_output=True)


if __name__ == '__main__':
    raise SystemExit(main())
