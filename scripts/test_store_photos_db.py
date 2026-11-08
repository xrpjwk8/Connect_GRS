"""Store photo ownership, publication and cleanup, plus existing DB regressions."""
import uuid
import json
import test_student_verification_db
import test_supabase_db as base

class StorePhotoTests(base.ReservationTests):
    def upload_photo(self, store=None, user=base.OWNER):
        path = f'{store or self.store}/{uuid.uuid4()}.jpg'
        base.DB.run(f"insert into storage.objects(bucket_id,name,owner_id) values ('store-photos',{base.literal(path)},{base.literal(user)});", user)
        return path

    def attach(self, path, user=base.OWNER):
        return json.loads(base.DB.run(f"select coalesce(to_jsonb(public.set_store_photo('{self.store}',{base.literal(path)})), 'null'::jsonb)", user))

    def visible(self, path, user=None):
        return base.DB.run(f"select count(*) from storage.objects where bucket_id='store-photos' and name={base.literal(path)}", user, anonymous=user is None)

    def test_photo_owner_only_upload_and_attach(self):
        self.assertSqlError('42501', lambda: self.upload_photo(user=base.OTHER_OWNER))
        self.assertSqlError('42501', lambda: self.upload_photo(user=base.BOOKER))
        path = self.upload_photo()
        self.assertSqlError('42501', lambda: self.attach(path, base.OTHER_OWNER))
        self.assertSqlError('22023', lambda: self.attach(f'{self.store}/{uuid.uuid4()}.jpg'))
        self.assertSqlError('22023', lambda: self.attach(f'{uuid.uuid4()}/{uuid.uuid4()}.jpg'))
        self.assertIsNone(self.attach(path))
        self.assertEqual(base.DB.run(f"select photo_path from public.stores where id='{self.store}'", base.OWNER), path)

    def test_only_current_approved_photo_is_public(self):
        path = self.upload_photo()
        self.assertEqual(self.visible(path), '0')
        self.assertEqual(self.visible(path, base.OTHER_BOOKER), '0')
        self.attach(path)
        self.assertEqual(self.visible(path), '1')
        base.DB.rpc('approve_store', [self.store, False], base.ADMIN)
        self.assertEqual(self.visible(path), '0')
        self.assertEqual(self.visible(path, base.OTHER_BOOKER), '0')
        self.assertEqual(self.visible(path, base.OWNER), '1')
        self.assertEqual(self.visible(path, base.ADMIN), '1')

    def test_replacement_unlinks_before_cleanup_and_retries_keep_current(self):
        first = self.upload_photo(); self.attach(first)
        second = self.upload_photo()
        self.assertEqual(self.attach(second), first)
        self.assertEqual(self.attach(second), second)
        base.DB.run(f"delete from storage.objects where name='{second}'", base.OWNER)
        self.assertEqual(self.visible(second, base.OWNER), '1')
        base.DB.run(f"delete from storage.objects where name='{first}'", base.OTHER_OWNER)
        self.assertEqual(self.visible(first, base.OWNER), '1')
        base.DB.run(f"delete from storage.objects where name='{first}'", base.OWNER)
        self.assertEqual(self.visible(first, base.OWNER), '0')
        self.assertEqual(self.attach(None), second)
        base.DB.run(f"delete from storage.objects where name='{second}'", base.OWNER)
        self.assertEqual(self.visible(second, base.OWNER), '0')

base.ReservationTests = StorePhotoTests
if __name__ == '__main__':
    raise SystemExit(base.main())
