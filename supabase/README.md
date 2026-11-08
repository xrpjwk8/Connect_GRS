# Connect Supabase backend

이 디렉터리는 새 서버의 DB 스키마, 권한, 예약 RPC를 관리합니다. 개발 순서와 정책은 [서버 개발 계획](../docs/SUPABASE_MIGRATION_PLAN.md)을 참고하세요. RN 앱의 인증·검색·즐겨찾기·예약·점주 설정 화면을 이 DB에 연결했습니다. 실제 이메일 인증과 두 계정 흐름 검증은 SMTP 설정 후 진행합니다.

## 현재 구현

- 인증된 사용자 프로필 등록, 역할 변경 차단, 이메일 소유 확인 (학교 도메인 제한 없음)
- 점주 매장 등록, 관리자 승인, 공개 매장 검색
- 본인/해당 매장만 접근 가능한 RLS
- 예약 신청, 점주 수락/거절, 수정 후 재승인, 취소, 종료 후 완료
- 점주 수동 예약, 날짜별 시간 차단, 정원/영업시간 설정
- 30분 단위 가용 좌석 검색, 자정 경계 처리
- 매장 행 잠금을 이용한 초과 예약 방지, 요청 UUID를 이용한 중복 신청 방지
- 개인 즐겨찾기

학생증 제출·심사와 비공개 Storage, 예약 권한 검사를 구현했습니다. 채팅·매장 사진·사업자 서류·푸시는 이후 작업에서 추가합니다. `backend/`의 Java 코드는 전환 완료 전까지 참고용으로 유지합니다.

## 개발 클라우드 배포 상태 (2026-11-08 KST)

- 프로젝트: [connectors-dev](https://supabase.com/dashboard/project/vfyxsalbvtuxurujadno), 서울, PostgreSQL 17.11.
- 적용 이력: `20261012154513_core`, `20261012154529_reservation_rpc`, `20261012154802_harden_rpc_access`, `20261013135913_owner_schedule_events`, `20261013145243_manual_reservation_affiliation`, `20261108052343_student_verification`. 중지 상태에서 복구 후 `ACTIVE_HEALTHY` 확인.
- Supabase MCP로 적용했으며 로컬 파일명도 원격 migration 버전에 맞췄습니다. 이력의 시간은 UTC입니다. 이후 CLI를 사용할 때는 먼저 인증·link 후 로컬/원격 이력을 확인하세요. CLI 인증이나 link가 완료된 상태는 아닙니다.
- `ConnectRN/.env.local`에 공개 URL/publishable key가 있으며 Git에서 제외됩니다. DB 비밀번호와 secret/service-role key는 사용하지 않았습니다.
- `ConnectRN/src/models/database.types.ts`는 실제 원격 DB에서 생성했습니다. 주요 화면의 Mock 상태 변경을 SDK 조회와 RPC 저장으로 교체했습니다.
- 로컬 DB 테스트 37개와 아래 원격 API 검사 11개를 통과했습니다. 원격 검사는 이메일을 발송하거나 사용자를 만들지 않습니다. 실제 로그인 JWT와 두 계정의 예약 흐름은 별도 검증이 필요합니다.

```sh
python3 scripts/check_supabase_api.py
```

공개 RPC는 SECURITY INVOKER 래퍼이고, 권한 상승이 필요한 구현은 비노출 `private` 스키마에 있습니다. 각 구현에서 신원·역할·소유자를 검사합니다. 익명 접근은 승인된 매장 검색과 개인정보 없는 가용 좌석 집계만 허용합니다.

Advisor의 ERROR/WARN은 없습니다. 다음 INFO는 의도적으로 유지합니다.

- [RLS 정책 없음](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): `private.admin_users`와 `private.admin_invitations`는 API 역할의 테이블 권한을 회수하고 RLS 기본 거부를 적용했습니다. 운영자 SQL과 권한 함수만 접근합니다.
- [미사용 인덱스](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index): 새 빈 프로젝트라 사용 기록이 없습니다. 실제 조회·예약 경로를 위해 만든 인덱스이므로 제거하지 않습니다.

## 로컬 검증

PostgreSQL 16 이상이 설치돼 있으면 Docker나 Supabase 계정 없이 DB 로직을 검증할 수 있습니다.

```sh
python3 scripts/test_student_verification_db.py
```

`pg_config`가 PATH에 없으면 `PG_BIN=/path/to/postgres/bin`을 지정합니다. 스크립트는 `/tmp`에 임시 PostgreSQL을 만들고 Unix socket으로만 연결합니다. 종료 시 서버와 데이터를 제거하며 기존 DB에 접속하지 않습니다.

`tests/bootstrap.sql`의 Auth/Storage 스텁은 이 임시 DB 전용입니다. **Supabase 프로젝트에 bootstrap.sql을 실행하지 마세요.** 실제 JWT 검증·OTP·PostgREST는 클라우드 연결 후 별도 검증해야 합니다.

Supabase 전체 로컬 스택을 사용할 경우 공식 CLI와 지원 런타임을 준비한 뒤 저장소 루트에서 `supabase start`, `supabase db reset`을 사용합니다. 이 환경에서는 전체 로컬 스택 실행을 아직 검증하지 않았습니다.

## 클라우드 프로젝트 연결 순서

1. 개발 프로젝트를 생성합니다. 첫 배포는 실사용 데이터가 없는 새 프로젝트에서 진행합니다.
2. 프로젝트 URL과 publishable key를 앱의 `.env.local`에 저장합니다. 이 값들은 공개 클라이언트용입니다. DB 비밀번호·secret/service-role key는 앱에 넣지 않습니다.
3. Supabase CLI를 인증하고 `supabase link --project-ref <project-ref>`로 개발 프로젝트에 연결합니다. 비밀번호는 CLI의 숨김 입력을 사용합니다.
4. `supabase migration list`로 이력을 확인하고 `supabase db push --dry-run`으로 미적용 migration만 확인한 뒤 `supabase db push`를 실행합니다. 위 개발 프로젝트에는 현재 6개가 모두 적용되어 있으므로 재적용하지 않습니다.
5. 실제 Auth 계정으로 RPC와 RLS를 검증합니다. 관리자 등록은 아래 운영자 SQL을 사용합니다. 앱은 운영자가 지정한 이메일의 소유 확인을 마친 계정만 초대를 수락할 수 있습니다.
6. Auth 이메일 OTP 템플릿과 SMTP를 설정합니다. 이메일 소유 확인은 Supabase Auth가 담당하고, 학생 신분은 별도 학생증 심사로 확인합니다. custom SMTP는 2026-10-13 확인 당시 미설정이었고 실제 메일 수신은 아직 검증 전입니다.
7. 앱 연결 후 두 계정으로 검색→신청→수락→취소와 세션 복구를 검증합니다.

### 이메일 인증 준비

기본 SMTP는 조직 팀원의 이메일만 허용하고 현재 시간당 2건으로 제한됩니다. 새 Free 프로젝트는 custom SMTP를 설정해야 인증 메일 본문을 편집할 수 있습니다. [SMTP 공식 문서](https://supabase.com/docs/guides/auth/auth-smtp), [템플릿 정책 변경](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

다음 순서는 발신 도메인 확보 → 이메일 발송 서비스(예: Resend)에서 도메인 검증 → [SMTP 설정](https://supabase.com/dashboard/project/vfyxsalbvtuxurujadno/auth/smtp) → `{{ .Token }}`을 포함한 OTP 템플릿 설정 → 구현된 앱에서 실제 수신 검증입니다. [Resend 연결 안내](https://resend.com/docs/send-with-supabase-smtp). 계정 비밀번호나 SMTP 키를 채팅이나 앱 코드에 넣지 않습니다. 이메일 확인을 꺼서 이메일 소유 확인을 우회하지 않습니다.

관리자 등록 예시(실제 운영자 Auth UID로 바꾼 뒤 SQL Editor에서 실행):

```sql
insert into private.admin_users(user_id)
values ('운영자-auth-uuid')
on conflict do nothing;
```

## 학생증 심사와 관리자 지정

- `student-cards`는 비공개 버킷이며 JPG/PNG/PDF만, 최대 10MB를 허용합니다. 앱에서 파일 시그니처도 검사합니다. 문서 조회는 본인/관리자만 가능하고 앱의 signed URL 유효기간은 60초입니다. URL/문서는 앱 저장소에 영구 저장하지 않습니다.
- 학생증은 `draft → pending → approved/rejected` 상태를 사용합니다. 반려 후 새 요청 UUID로 재신청합니다. 동일 요청 재시도는 중복 처리하지 않으며, 이전 UUID로 심사하면 `40001` 오류를 반환합니다.
- 심사 중 자료 교체/삭제 및 사용자 직접 상태 변경은 차단합니다. 관리자는 본인 신청을 승인할 수 없으며, 반려/승인 취소 사유를 남겨야 합니다. 이름/학교 변경 시 승인/심사 상태를 무효화하고 감사 이력을 남깁니다.
- 예약 신청·수정·수락 시 DB가 학생증 승인을 다시 확인합니다. 취소/완료와 점주 수동 예약은 계속 가능합니다. 채팅 서버는 아직 구현 전입니다.
- 관리자 초대는 아래처럼 **운영자가** 지정합니다. `accept_admin_invitation()`은 `auth.users`의 이메일 소유 확인을 검사하고, 초대를 한 번 소비하여 권한을 부여합니다. 이메일 문자열이나 클라이언트 metadata만으로 승격하지 않습니다. 이미 지정된 관리자에게 초대를 재등록하지 마세요. 권한 회수 시 남은 초대도 함께 제거해야 합니다.

```sql
insert into private.admin_invitations(email)
values (lower(trim('admin@example.com')))
on conflict do nothing;
```

RN 실제 로그인 후 관리자 권한을 확인하며, 프로필이 없으면 바로 학생증 심사 화면으로 진입합니다. 프로필이 있으면 마이페이지의 `관리자 학생증 심사`를 사용합니다. 매장 미등록 점주 관리자는 매장 등록 화면에서도 진입할 수 있습니다. 개발 미리보기는 관리자 권한이나 파일 제출을 제공하지 않습니다.

출시 전 남은 작업: 실제 Auth JWT/Storage 전송/심사 전체 흐름 검증, 보관 기간 확정과 자동 삭제(현재 자동 삭제 없음), 회장단·단체 대표 권한 증빙. 현재 반려 후 재신청할 때 이전 파일을 삭제하지만, 이를 보관 정책 전체 구현으로 간주하지 않습니다. 로컬 DB 테스트의 Auth/Storage 스텁은 실제 서비스 검증을 대체하지 않습니다.

## 앱용 RPC 계약

인증이 필요한 요청에는 Supabase Auth 세션 JWT를 사용합니다. 호출자 식별은 DB의 `auth.uid()`로 이루어집니다.

| RPC | 주요 인자 | 결과 |
|---|---|---|
| accept_admin_invitation | 없음 | 사전 지정된 확인 이메일의 초대 수락 후 관리자 여부 |
| begin_student_verification | extension | 내 draft 신청 및 업로드 경로 |
| submit_student_verification | request_id | 업로드된 파일을 심사 대기로 제출 |
| review_student_verification | user_id, request_id, approve, reason? | 관리자 승인/반려/승인 취소 |
| complete_profile | role, real_name, school_name, department_name, position | 내 프로필 |
| register_store | name, region, category, capacity | 미승인 매장 |
| approve_store | store_id, approved | 매장; 관리자만 |
| search_stores | region?, category?, service_date?, start_minute?, slot_count, people | 예약 가능한 승인 매장 |
| get_availability | store_id, service_date | 시작 분·잔여 좌석·차단 여부 |
| request_reservation | store_id, service_date, start_minute, slot_count, people, request_id, budget_per_person?, event_purpose?, request_message? | 대기 예약 |
| create_manual_reservation | store_id, service_date, start_minute, slot_count, people, booker_name, request_id, event_purpose? | 확정 외부 예약 |
| decide_reservation | reservation_id, accept | 수락 또는 거절 결과 |
| edit_reservation | reservation_id, service_date, start_minute, slot_count, people, budget_per_person?, event_purpose?, request_message? | 재승인 대기 예약 |
| cancel_reservation | reservation_id | 취소 결과 |
| complete_reservation | reservation_id | 완료 결과 |
| replace_time_blocks | store_id, service_date, start_minutes | 해당 영업일의 차단 시간을 전체 교체 |
| update_store_capacity | store_id, capacity, allow_shared, opening_minute, closing_minute | 검증된 매장 설정 |

실제 RPC 인자 이름에는 모두 `p_` 접두사가 있습니다. 시작 분 1440은 해당 영업일의 다음 날 00:00입니다. `request_id`는 사용자 동작마다 생성한 UUID이며, 네트워크 재시도에는 같은 UUID를 사용합니다.

읽기는 `profiles`, `stores`, `reservations`, `time_blocks`, `favorites`, `student_verifications`, `student_verification_events` 테이블에서 RLS 범위 내로 가능합니다. 예약·매장·프로필의 직접 INSERT/UPDATE/DELETE는 허용하지 않습니다. 즐겨찾기만 본인 행을 직접 추가/삭제할 수 있습니다.

예약자 수정은 확정 예약도 대기로 바꾸고 기존 좌석을 해제하므로 UI에서 저장 전에 안내해야 합니다. 확정 후 시작 시간이 지난 예약은 수정/취소할 수 없고, 종료 후 점주가 완료 처리합니다.

주요 SQLSTATE: `42501` 권한/신원 오류, `22023` 잘못된 입력/상태 전이, `23514` 정원·차단 충돌, `P0002` 조회 불가. 전송 실패 시 성공 여부를 추정하지 말고 동일 요청 ID로 재조회/재시도합니다.

## 점주 웹 내부 일정 (2026-10-13)

`20261013135913_owner_schedule_events`를 개발 프로젝트에 적용했습니다. `owner_schedule_events`는 해당 매장 소유자만 CRUD할 수 있으며 RLS가 활성화돼 있습니다. 일반 일정은 가용 좌석이나 `time_blocks`를 변경하지 않습니다. 웹은 기존 예약/차단 RPC를 그대로 사용합니다.

`python3 scripts/test_owner_schedule_db.py`는 기존 22개 예약 테스트와 새 일정 RLS·제약 테스트 2개를 함께 실행합니다. 총 24개 통과. 보안 Advisor ERROR/WARN 없음. 실제 점주 이메일 OTP와 앱↔웹 JWT 통합 검증은 여전히 별도입니다.
