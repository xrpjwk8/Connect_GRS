#!/usr/bin/env python3
"""Student review authorization/state tests plus existing reservation regression suite."""
import concurrent.futures
import json
import uuid
import test_representative_db  # installs owner/representative regressions
import test_supabase_db as base


class StudentVerificationTests(base.ReservationTests):
    def draft(self, user=base.NON_SCHOOL):
        base.DB.rpc('complete_profile', ['booker', '학생', '학교'], user)
        return base.DB.rpc('begin_student_verification', ['jpg'], user)

    def upload(self, draft, user=base.NON_SCHOOL):
        base.DB.run(f"insert into storage.objects(bucket_id,name,owner_id) values "
                    f"('student-cards',{base.literal(draft['document_path'])},{base.literal(user)});", user)

    def pending(self):
        draft = self.draft(); self.upload(draft)
        return base.DB.rpc('submit_student_verification', [draft['request_id']], base.NON_SCHOOL)

    def review(self, row, approve=True, reason='', user=base.ADMIN):
        return base.DB.rpc('review_student_verification', [row['user_id'], row['request_id'], approve, reason], user)

    def test_student_cannot_self_approve_or_write_state(self):
        row = self.pending()
        self.assertSqlError('42501', lambda: self.review(row, user=base.NON_SCHOOL))
        self.assertSqlError('42501', lambda: base.DB.run("update public.student_verifications set status='approved';", base.NON_SCHOOL))
        self.assertSqlError('42501', lambda: base.DB.run("delete from public.student_verification_events;", base.NON_SCHOOL))
        self.assertSqlError('42501', lambda: base.DB.run('select * from public.student_verifications;', anonymous=True))

    def test_student_file_and_status_are_private(self):
        row = self.pending()
        for user, expected in [(base.NON_SCHOOL,'1'),(base.ADMIN,'1'),(base.BOOKER,'0'),(base.OWNER,'0')]:
            self.assertEqual(base.DB.run(f"select count(*) from public.student_verifications where user_id='{base.NON_SCHOOL}';",user),expected)
            self.assertEqual(base.DB.run(f"select count(*) from storage.objects where name={base.literal(row['document_path'])};",user),expected)
        self.assertEqual(base.DB.run('select count(*) from storage.objects;',anonymous=True),'0')
        self.assertSqlError('42501',lambda: self.upload({'document_path':row['document_path']+'other'},base.OTHER_BOOKER))

    def test_student_requires_uploaded_file_before_submit(self):
        row = self.draft()
        self.assertSqlError('22023',lambda:base.DB.rpc('submit_student_verification',[row['request_id']],base.NON_SCHOOL))
        self.assertSqlError('42501',lambda:base.DB.rpc('begin_student_verification',['jpg'],base.OWNER))
        self.assertSqlError('22023',lambda:base.DB.rpc('begin_student_verification',['html'],base.NON_SCHOOL))

    def test_student_pending_document_cannot_change_or_disappear(self):
        row = self.pending()
        base.DB.run(f"delete from storage.objects where name={base.literal(row['document_path'])};",base.NON_SCHOOL)
        base.DB.run(f"delete from storage.objects where name={base.literal(row['document_path'])};",base.ADMIN)
        base.DB.run(f"update storage.objects set name='replacement' where name={base.literal(row['document_path'])};",base.NON_SCHOOL)
        self.assertEqual(base.DB.run(f"select count(*) from storage.objects where name={base.literal(row['document_path'])};"),'1')
        self.assertSqlError('42501',lambda:base.DB.rpc('begin_student_verification',['png'],base.NON_SCHOOL))

    def test_student_approval_unlocks_reservation_and_revoke_blocks_edits(self):
        row = self.pending()
        self.assertSqlError('42501',lambda:self.request(user=base.NON_SCHOOL))
        self.assertEqual(self.review(row)['status'],'approved')
        reservation = self.request(user=base.NON_SCHOOL)
        self.review(row,False,'신분 확인 취소')
        self.assertSqlError('42501',lambda:self.request(user=base.NON_SCHOOL))
        self.assertSqlError('42501',lambda:self.decide(reservation))
        self.assertSqlError('42501',lambda:base.DB.rpc('edit_reservation',[reservation['id'],base.DAY,1200,1,2],base.NON_SCHOOL))
        self.assertEqual(base.DB.rpc('cancel_reservation',[reservation['id']],base.NON_SCHOOL)['status'],'cancelled')

    def test_student_rejection_requires_reason_and_resubmit_replaces_request(self):
        row = self.pending()
        self.assertSqlError('22023',lambda:self.review(row,False,''))
        self.review(row,False,'사진이 흐림')
        replacement = base.DB.rpc('begin_student_verification',['png'],base.NON_SCHOOL)
        self.assertNotEqual(row['request_id'],replacement['request_id'])
        self.assertSqlError('40001',lambda:self.review(row))
        self.upload(replacement)
        base.DB.rpc('submit_student_verification',[replacement['request_id']],base.NON_SCHOOL)
        self.assertEqual(self.review(replacement)['status'],'approved')
        self.assertGreaterEqual(int(base.DB.run(f"select count(*) from public.student_verification_events where user_id='{base.NON_SCHOOL}';",base.ADMIN)),6)

    def test_student_profile_identity_changes_require_reverification(self):
        row = self.pending(); self.review(row)
        base.DB.rpc('complete_profile',['booker','다른 이름','다른 학교'],base.NON_SCHOOL)
        self.assertSqlError('42501',lambda:self.request(user=base.NON_SCHOOL))
        self.assertEqual(base.DB.run(f"select status from public.student_verifications where user_id='{base.NON_SCHOOL}';"),'rejected')

    def test_student_admin_cannot_approve_self(self):
        row = self.pending()
        base.DB.run(f"insert into private.admin_users values('{base.NON_SCHOOL}');")
        self.assertSqlError('42501',lambda:self.review(row,user=base.NON_SCHOOL))

    def test_student_review_retry_is_idempotent_and_conflicting_reviews_fail(self):
        row = self.pending(); self.review(row)
        count = base.DB.run('select count(*) from public.student_verification_events;')
        self.review(row)
        self.assertEqual(base.DB.run('select count(*) from public.student_verification_events;'),count)
        self.review(row,False,'승인 취소')
        self.assertSqlError('22023',lambda:self.review(row))

    def test_admin_invitation_requires_verified_email_and_is_one_time(self):
        base.DB.run("insert into private.admin_invitations(email) values('u@yonsei.ac.kr');")
        self.assertFalse(base.DB.rpc('accept_admin_invitation',[],base.UNVERIFIED))
        self.assertFalse(base.DB.rpc('accept_admin_invitation',[],base.BOOKER))
        self.assertSqlError('42501',lambda:base.DB.run('select * from private.admin_invitations;',base.BOOKER))
        base.DB.run(f"update auth.users set email_confirmed_at=now() where id='{base.UNVERIFIED}';")
        self.assertTrue(base.DB.rpc('accept_admin_invitation',[],base.UNVERIFIED))
        self.assertEqual(base.DB.run('select count(*) from private.admin_invitations;'),'0')
        self.assertTrue(base.DB.rpc('current_user_is_admin',[],base.UNVERIFIED))

    def test_student_concurrent_submission_and_deletion_preserve_pending_document(self):
        row = self.draft(); self.upload(row)
        def act(kind):
            try:
                if kind == 'submit': base.DB.rpc('submit_student_verification',[row['request_id']],base.NON_SCHOOL)
                else: base.DB.run(f"delete from storage.objects where name={base.literal(row['document_path'])};",base.NON_SCHOOL)
            except RuntimeError as error:
                self.assertTrue('22023' in str(error) or '40P01' in str(error), str(error))
        with concurrent.futures.ThreadPoolExecutor(2) as pool: list(pool.map(act,['submit','delete']))
        status = base.DB.run(f"select status from public.student_verifications where user_id='{base.NON_SCHOOL}';")
        if status == 'pending':
            self.assertEqual(base.DB.run(f"select count(*) from storage.objects where name={base.literal(row['document_path'])};"),'1')

    def test_student_concurrent_profile_edit_cannot_leave_stale_approval(self):
        row = self.pending()
        def act(kind):
            try:
                if kind == 'review': self.review(row)
                else: base.DB.rpc('complete_profile',['booker','새 이름','새 학교'],base.NON_SCHOOL)
            except RuntimeError as error: self.assertIn('22023',str(error))
        with concurrent.futures.ThreadPoolExecutor(2) as pool: list(pool.map(act,['review','edit']))
        self.assertEqual(base.DB.run(f"select status from public.student_verifications where user_id='{base.NON_SCHOOL}';"),'rejected')


base.ReservationTests = StudentVerificationTests
if __name__ == '__main__':
    raise SystemExit(base.main())
