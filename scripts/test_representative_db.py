#!/usr/bin/env python3
import uuid
import test_owner_schedule_db
import test_supabase_db as base

def test_representative_and_affiliation(self):
    key=str(uuid.uuid4())
    args=[self.store,base.DAY,1140,2,8,'김민준',key,'회식','경영학과 학생회']
    first=base.DB.rpc('create_manual_reservation',args,base.OWNER)
    self.assertEqual(first['booker_name'],'김민준')
    self.assertEqual(first['booker_affiliation'],'경영학과 학생회')
    self.assertEqual(base.DB.rpc('create_manual_reservation',args,base.OWNER)['id'],first['id'])
    self.assertSqlError('22023',lambda:base.DB.rpc('create_manual_reservation',args[:-1]+['다른 단체'],base.OWNER))
    for name in ['', '   ', None]:
        self.assertSqlError('22023',lambda name=name:base.DB.rpc('create_manual_reservation',[self.store,base.DAY,1200,2,8,name,str(uuid.uuid4()),'','단체명만'],base.OWNER))
    self.assertSqlError('42501',lambda:base.DB.rpc('create_manual_reservation',args,base.OTHER_OWNER))
    self.assertSqlError('42501',lambda:base.DB.rpc('create_manual_reservation',args,base.BOOKER))
    app=self.request(people=2,minute=1260)
    self.assertEqual(app['booker_name'],'테스트 사용자')
    self.assertIn('연세대학교',app['booker_affiliation'])

base.ReservationTests.test_representative_and_affiliation=test_representative_and_affiliation
if __name__=='__main__':raise SystemExit(base.main())
