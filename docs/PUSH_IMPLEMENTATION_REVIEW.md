# 채팅·예약 알림 구현 상태

2026-11-08 KST, ConnectRN + Supabase 개발 프로젝트 `connectors-dev` 기준.

앱 코드와 개발 서버 연결을 구현했다. iOS APNs 키 연결과 새 Release 빌드·iPhone 16 Pro Max 설치를 완료했다. Android FCM 서비스 계정 연결과 두 계정 간 실기기 수신 검증은 아직 완료하지 않았다. 실제 기기 푸시 수신 완료로 간주하면 안 된다.

## 구현 범위

| 이벤트 | 알림 대상 |
|---|---|
| 예약 신청·대기 예약 내용 변경 | 점주 |
| 예약 수락·거절 | 예약자 |
| 예약 취소 | 취소한 사람을 제외한 예약 참여자 |
| 새 채팅 메시지 | 상대방 |

- 실제 메시지는 `chat_messages`에 저장하며 예약자/해당 점주만 RLS로 조회한다. 관리자는 참여자가 아니면 읽지 못한다. 수동 전화 예약은 채팅 대상에서 제외한다.
- 대기·확정 예약만 새 메시지를 보낼 수 있다. 예약자는 학생증 승인도 필요하다. 종료된 예약의 기존 메시지는 참여자가 계속 조회할 수 있다.
- 메시지는 1~2,000자, 계정당 분당 20건. 서버에서 sender를 결정하고, `(sender_id, request_id)`로 동시 재전송을 중복 제거한다. 실패한 메시지는 입력창에 유지하며 불확실한 결과는 같은 UUID로 재시도한다.
- 메시지 50개씩 과거 조회, Supabase Realtime 수신, 재연결/앱 복귀/10초 주기 보완 조회를 구현했다. 채팅 목록의 최근 메시지 요약은 전체 최신 200개 기준이며 오래된 대화는 요약이 없을 수 있다. 해당 대화 화면에서는 과거 기록을 페이지로 조회한다.
- `notifications`는 본인만 보는 알림함이다. 읽음 처리는 소유자만 가능하다. 예약/메시지 커밋과 알림·발송 대기 생성은 같은 트랜잭션이다. 기존 예약에 과거 알림을 소급 생성하지 않는다.
- 앱 홈 종 아이콘과 점주 마이페이지에서 알림함에 진입한다. 알림 클릭은 payload 경로를 신뢰하지 않고 DB 알림 소유자를 재검사한 뒤 예약/채팅 화면으로 이동한다. 로그인 전 클릭은 로그인 이후 처리한다.
- 사용자 동작으로 알림 권한을 요청한다. 이미 허용된 기기는 로그인/복귀 시 토큰을 갱신한다. Android 채널은 `activity`다. 권한 철회 시 연결을 해제한다. 로그아웃은 기기 연결 해제 후 진행하며 해제 네트워크 요청이 실패하면 재시도를 안내한다.
- 계정/토큰이 바뀐 기기의 이전 대기 알림은 발송 전에 취소한다. 이미 APNs/FCM에 전달된 알림은 회수할 수 없다. 포그라운드에서는 현재 계정의 알림만 표시하며 열려 있는 같은 대화는 배너/소리를 생략한다.

## 서버 발송

적용된 migration은 `20261108114023_chat_notifications`, `20261108114027_push_dispatcher`다. `chat_messages`, `notifications`는 Realtime publication에 등록했다.

`pg_cron`의 `connect-push-dispatch`가 매분 `private.dispatch_push_notifications()`를 실행한다. `pg_net`으로 Expo Push API에 전송한다. Edge Function이나 클라이언트의 service-role key는 필요하지 않다. 실제 cron 실행 성공을 확인했다.

- 기기 토큰/발송 이력은 비노출 private 테이블에 있고 앱에는 직접 테이블 권한이 없다. 등록·해제 함수에서 로그인 계정을 검증한다.
- 정상 흐름: queued → sending → ticket → checking → delivered. `delivered`는 Expo receipt가 APNs/FCM 인계를 확인한 상태이며 사용자가 화면에서 읽었다는 뜻이 아니다.
- 네트워크/일시 오류는 지수 간격으로 최대 5회 전송한다. receipt는 15분 후 조회, 최대 8회 확인한다. 24시간 지난 건은 실패 처리한다. 잘못된 자격증명/토큰/초과 payload는 영구 실패 처리하고 DeviceNotRegistered 토큰은 비활성화한다.
- DB 알림/메시지는 중복 제거하지만 외부 전송 응답이 소실된 경우 재시도 푸시가 중복 표시될 가능성은 있다. 외부 전송을 exactly-once로 보장하지 않는다.
- 사용자 요청으로 새 채팅 알림에는 메시지 앞 120자(초과 시 …)를 보낸다. 잠금 화면 표시 여부는 기기 알림 미리보기 설정을 따른다. 예약 알림은 일반 안내를 보낸다. ID·알림 종류·수신 사용자 ID만 navigation data에 포함한다.
- Expo enhanced push security를 활성화했다면 서버 Vault에 `expo_push_access_token`이라는 이름으로 토큰을 등록해야 한다. 토큰은 앱 코드나 Git에 넣지 않는다.
- 발송 대기/실패가 자동으로 삭제되지는 않는다. 운영 데이터 보관 기간과 정리 작업은 별도 결정이 필요하다.

운영 확인(SQL Editor, 서버 관리자 전용):

```sql
select state, count(*) from private.push_deliveries group by state;
select last_error, count(*) from private.push_deliveries where state='failed' group by last_error;
select status, return_message, start_time from cron.job_run_details
where jobid=(select jobid from cron.job where jobname='connect-push-dispatch')
order by start_time desc limit 10;
```

## 남은 기기 설정

Expo 로그인 계정 `xrpjwk8`에 [ConnectRN 프로젝트](https://expo.dev/accounts/xrpjwk8/projects/ConnectRN)를 생성·연결했다. projectId는 `2fa26408-1e64-49bd-a852-bccceca4c268`이며 app.json에 반영했다. 기존 연결은 없었다.

1. `ConnectRN`에서 `npx eas-cli credentials --platform ios`로 Apple 팀 `7C2363N8Z6`의 APNs push key 연결을 확인한다. Bundle ID는 `com.xrpjwk8.ConnectRN`. Apple 로그인/2FA는 계정 소유자가 직접 수행한다. 기존 키를 임의 폐기하지 않는다.
2. Android는 `com.xrpjwk8.connectrn`에 맞는 Firebase 앱과 google-services.json을 연결하고 `npx eas-cli credentials --platform android`에서 FCM v1 service account를 연결한다. 서비스 계정 비밀키는 앱에 포함하지 않는다. Firebase 앱/FCM v1 키 연결을 완료했다(아래 진행 기록 참고).
3. `expo-notifications`를 추가했으므로 JS 새로고침으로는 적용되지 않는다. `npx expo prebuild --platform ios --no-clean` 후 `npx expo run:ios --device` 또는 적절한 EAS 빌드로 재설치한다. 이 작업에서는 클라우드 빌드를 시작하지 않았다.
4. 두 계정/기기로 예약 신청·수락·거절·취소와 메시지를 주고받고, 알림함의 **예약·채팅 푸시 알림 켜기**로 각 기기를 등록한다. 활성/백그라운드/종료 상태 수신·탭 이동, 재전송, 권한 거절, 로그아웃·계정 전환을 확인한다.

## 검증

- 로컬 PostgreSQL 50개 테스트: 참여자 RLS, 직접 쓰기 금지, 동시 메시지 재전송, 상태/학생증/빈 메시지/길이/전송량 제약, 알림 대상, 읽음 소유권, ticket/receipt, 재시도, 무효 토큰, 로그아웃/계정 변경 취소와 기존 회귀 테스트.
- RN 42개 테스트, TypeScript 검사, 웹 production 번들 생성 통과.
- 개발 서버 공개 API 검사 18개 통과: 채팅/알림 읽기·메시지 전송·기기 등록·읽음 처리의 비로그인 차단 포함.
- DB 테스트의 net transport와 클라이언트의 토큰/전송은 모킹했다. 실제 APNs/FCM 수신과 로그인한 두 계정의 Realtime E2E 검증을 대체하지 않는다.
- Advisor: 새 테이블의 누락 RLS/노출 definer 경고 없음. private 테이블의 정책 없음 INFO는 권한 회수+기본 거부 의도다. 기존 Auth의 [유출 비밀번호 보호 비활성 경고](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)는 별도 설정 항목이다.

참고: [Expo 설정](https://docs.expo.dev/push-notifications/push-notifications-setup/), [Expo ticket/receipt 및 재시도](https://docs.expo.dev/push-notifications/sending-notifications/), [Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).


## 실기기 설정 진행 (2026-11-08 KST)

- 사용자 승인 후 동일 Apple 팀(7C2363N8Z6)의 기존 APNs 키를 EAS ConnectRN에 연결했다. 기존 키를 폐기하거나 재발급하지 않았다.
- `expo prebuild --platform ios --no-clean` 및 CocoaPods 설치를 완료했다. 기존 와일드카드 프로파일은 푸시를 지원하지 않아 첫 빌드가 실패했지만, `xcodebuild -allowProvisioningUpdates -allowProvisioningDeviceRegistration`으로 앱 전용 프로파일을 갱신한 Release 빌드는 성공했다.
- iPhone 16 Pro Max에 새 앱을 설치·실행했다. 서명된 바이너리에서 `aps-environment=development`, 앱 식별자 `7C2363N8Z6.com.xrpjwk8.ConnectRN`를 확인했다. Release JS라도 로컬 개발 서명이며 Expo SDK는 entitlement에 맞는 APNs 환경을 선택한다.
- Firebase `reservationserviceapp`에 Android 패키지 `com.xrpjwk8.connectrn`를 등록하고 로컬 `google-services.json`을 연결했다. 이 파일은 클라이언트 설정으로, 서비스 계정 비밀키가 아니다. Git에서는 제외하며 빌드 환경에 별도로 제공한다.
- 사용자의 프로젝트·권한·키 연결 승인 후 `connectrn-expo-push@reservationserviceapp.iam.gserviceaccount.com` 전용 계정을 생성하고 `roles/firebasecloudmessaging.admin`을 부여했다. FCM API를 활성화하고 EAS의 `com.xrpjwk8.connectrn` FCM V1에 키를 업로드·할당했다. 권한 600 임시 키 파일은 업로드 성공 확인 후 삭제했다.
- iPhone 16 Pro Max의 승인된 예약자 계정에서 알림 허용 및 서버 기기 등록을 확인했다. 실기기 점검 중 실제 예약자 홈의 알림 진입 버튼 누락을 발견해 수정하고 재빌드·재설치했다. TypeScript 검사와 RN 42개 테스트가 통과했다. 예약 수락·채팅 푸시가 해당 기기 잠금 화면에 표시되는 것을 확인했다.

- iPhone 17에도 Release 빌드를 서명·업데이트 설치했다. 사용자가 점주 계정의 알림 허용을 완료했고, DB에서 예약자/점주 iOS 기기 각 1개의 enabled 등록을 확인했다.
- 지정 매장 신촌오거리포차를 사용자 승인 후 개발 서버에서 승인 상태로 변경했다. 실제 앱에서 11월 9일 17:00 예약을 신청하고, 사용자가 점주 iPhone 17에서 신청 푸시 수신·예약 수락·채팅 전송을 확인했다. 예약자 iPhone 16 Pro Max 잠금 화면의 예약 수락/새 메시지 알림과 앱 안의 메시지를 확인했다.
- `20261108121628_chat_push_preview`를 개발 서버에 적용했다. 새 채팅 알림에 앞 120자 미리보기를 포함하며 기존 알림은 변경하지 않는다. 한글·이모지와 수신자 RLS 테스트를 포함한 로컬 DB 50개 검사가 통과했다. Android FCM 키 연결은 완료했지만 Android 실기기 수신은 아직 미검증이다.

- 양쪽 채팅 메시지 송수신과 새 120자 미리보기 푸시를 확인했다. 예약자 기기 알림 센터에서 `Yes 잘 보임` 본문 표시를 직접 확인했다.
- 실기기 검증 중 점주 확정 예약 취소 UI가 없음을 발견해 캘린더의 `예약 상세 보기`와 상세 화면의 확인 창을 동반한 `예약 취소`를 추가했다. 기존 소유권·시작 전 상태 검사를 수행하는 취소 RPC를 사용한다. TypeScript 검사와 iPhone 17 Release 빌드·설치가 성공했다.

## 최종 iOS 실기기 수신 결과 (2026-11-08 KST)

- 점주가 앱에서 11월 9일 17:00 테스트 예약을 취소하고 17:30 예약을 거절했다. DB의 상태는 각각 `cancelled`, `rejected`이며 두 알림에 대해 Expo HTTP 200 / status ok 응답을 확인했다.
- 예약자 iPhone 16 Pro Max 알림 센터에서 “예약이 취소되었습니다”와 “예약이 거절되었습니다”를 모두 직접 확인했다. 기존 신청·수락·채팅 검증과 합쳐 요청한 4종 예약 이벤트 및 양방향 채팅의 iOS 실기기 수신을 확인했다.
- 테스트 예약 두 건은 종료 상태로 남기며 삭제하지 않았다. 개발 매장의 승인 상태는 사용자 요청대로 유지했다.
- 남은 별도 검증: Android 실제 기기 수신, 앱 종료 상태와 계정 전환 등 전체 알림 탭 이동 행렬. iOS 알림 표시 확인을 모든 플랫폼/상태의 검증으로 확대 해석하지 않는다.

## 점주 탐색 및 가입 폼 검증 (2026-11-08 KST)

- 점주 하위 화면에 뒤로가기 버튼과 네이티브 스와이프를 연결하고, 예약 거절 전 확인 창을 추가했다.
- iPhone 17은 iOS 버전 제한으로 Mac 화면 공유를 사용할 수 없어 사용자가 직접 확인했다. 뒤로가기 버튼, 스와이프, 거절 확인 창, 확인 창에서 취소 시 대기 상태 유지가 모두 정상이라고 회신했다. 검증용 11월 9일 18:00~18:30, 25명 예약은 대기 상태로 남겼다.
- 가입 화면의 점주 성함을 명확히 표시하고, 양 역할의 인증번호 요청·재요청 대기 중 원형 로딩 표시를 추가했다. 매장 등록에 placeholder와 지역·업종 선택 메뉴를 적용했으며 사진 미리보기는 5:3 cover로 통일했다.
- TypeScript 검사, RN 테스트 43개, iOS Release 빌드가 통과했다. 두 iPhone에 최신 앱을 설치했다.
