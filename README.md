# Connect_GRS

이 저장소에는 두 앱이 함께 있습니다.

- `Connect/` + `Connect.xcodeproj`: 기존 SwiftUI iOS 앱. 기존 Spring REST API를 사용하며 기본 주소는 `http://localhost:8080`입니다.
- `ConnectRN/`: Expo React Native 앱. 현재 Supabase 인증·예약 연결을 개발 중입니다. [서버 개발 계획](docs/SUPABASE_MIGRATION_PLAN.md)을 참고하세요.

Xcode에서 `Connect`를 실행하면 RN 쪽 Supabase 변경이 반영되지 않습니다.

## React Native 앱 실기기 실행

```bash
cd ConnectRN
npm ci
npx expo prebuild --platform ios --no-clean
npx expo run:ios --device
```

실기기 목록에서 사용할 iPhone을 선택합니다. 개발 빌드는 Mac의 Metro 서버에 연결하므로 터미널을 켜 두고 Mac과 iPhone을 같은 네트워크에 연결합니다.

iOS 27의 앱 시작 요구사항에 맞춰 Expo SDK 57 패치 버전과 `expo-build-properties`의 `ios.enableSceneSupport: true`를 사용합니다. `ios/`는 생성 파일이므로 설정은 `ConnectRN/app.json`에서 관리합니다. 네이티브 의존성이나 이 설정을 바꾼 경우 JavaScript 새로고침만으로 반영되지 않으며 위 prebuild와 실기기 빌드를 다시 실행해야 합니다. 근거: [Expo의 UIScene 전환 안내](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md).

### RN 앱 테스트 가입

개발 빌드의 예약자/점주 회원가입 화면은 기본 정보와 이메일 입력란을 먼저 표시합니다. 모두 빈칸이고 약관에 동의하지 않아도 `입력 없이 테스트 미리보기`를 누르면 앱에 진입합니다. 이메일 입력란 바로 아래의 `이메일 인증하기`는 실제 인증번호 입력 경로입니다. 입력한 값은 현재 미리보기 메모리에만 유지하며 실제 계정이나 인증 상태를 만들지 않습니다.

- 화면 하단에 테스트 미리보기 상태와 `나가기`를 표시합니다. 나가기·로그아웃·앱 새로 시작 시 입력값을 지웁니다.
- 검색/시간표는 로컬 예시, 예약/채팅/서버 저장은 차단합니다. 공통 작업 훅과 Supabase fetch 경계에서 차단하여 기존 로그인 세션이 있어도 서버로 쓰기를 보내지 않습니다.
- `이메일 인증하기`는 기존 OTP 연동을 확인하는 경로입니다. 개발용 건너뛰기는 `__DEV__`일 때만 허용하고 Release에서는 기존 인증·필수 입력을 요구합니다.
- 인증번호 요청 중 `인증하고 계속`은 문구를 유지한 채 비활성화합니다. Release에서 개발 미리보기 카드·복귀 버튼이 숨겨지는 회귀 검사를 포함해 32개 테스트와 TypeScript 검사를 통과했습니다.
- 이메일 인증 중에는 입력 폼을 유지합니다. 인증 완료 후 기본 정보·필수 약관을 확인하고 `가입 완료하고 학생증 제출하기`를 누르면 학생증 화면으로 이동합니다. 로그인된 계정에는 테스트 가입 버튼을 표시하지 않습니다.
- 학생증 제출·재신청, 관리자 승인·반려·승인 취소, 서버의 예약 권한 검사를 구현하고 개발 Supabase에 적용했습니다. 실제 계정은 일반 이메일도 허용하며, 이메일 소유 확인과 학생증 승인을 구분합니다. 개발 미리보기에서는 학생증 파일을 전송하지 않습니다.
- Gmail SMTP 인증메일 수신, 실제 이메일 인증 및 지정 관리자 권한 연결을 확인했습니다. 일반 예약자의 학생증 제출 → 관리자 승인 → 예약자 화면의 승인 완료 표시를 실기기와 서버에서 확인했습니다. 예약 신청 → 점주 수락은 아직 검증 전입니다.
- 학생증 이미지 선택 시 제출 전 미리보기·파일명·용량을 표시하며 제거 후 다시 선택할 수 있습니다. PDF는 파일명만 표시합니다. 개발 미리보기에서도 로컬 파일 선택·교체·제거를 체험할 수 있지만 제출 동의·제출 액션은 표시하지 않습니다. 채팅 서버, 학생증 보관·삭제 정책, 회장단 권한 증빙은 후속 작업입니다.
- 가입 UI: 첫 화면의 큰 버튼은 예약자·점주 로그인, 하단 링크는 가입입니다. 예약자 가입 폼은 이름·학교명·학과/집단명·직책·이메일에 빨간 별과 입력 예시를 표시하며, 가입 완료 시 학과/집단명·직책도 필수로 확인합니다. 빈 입력·약관 미동의 개발 미리보기는 유지합니다.
- UI: 주요·보조 버튼은 반경 16 / 최소 높이 52를 공유합니다. 가입·학생증·관리자 심사는 고정 상단 뒤로가기와 제목을 사용하고, 학생증 상태·파일 교체/제거·나중에 제출 액션을 구분합니다. 개발 미리보기는 별도 안내 카드에 배치합니다.
- iOS 뒤로가기: 가입·로그인·학생증·관리자 화면은 native-stack의 인터랙티브 전환을 사용합니다. 화면 왼쪽 절반(너비의 50%)에서 시작하는 오른쪽 스와이프를 허용하고 오른쪽 절반은 제외합니다. 인식 범위는 화면 너비 변화에 맞춰 갱신합니다. 이전 화면을 스택에 유지하고 손가락 이동에 따라 전환하며, 취소 시 현재 화면과 입력값을 유지합니다. 상단 버튼도 같은 native pop을 사용합니다. 가입 인증/학생증 제출 중에는 제스처와 버튼을 차단합니다. 관리자 화면이 실제로 스택에서 제거될 때만 닫기 또는 프로필 없는 관리자의 로그아웃을 실행합니다.
- 네이티브 전환 검증: TypeScript 및 30개 테스트 통과. 제스처 취소 시 정리 동작 미실행, 완료 시 한 번 실행, 처리 중 화면 제거 차단을 자동 검사했습니다. iPhone 16 Pro Max에서 가입 화면의 뒤로가기 버튼·재진입을 확인했고, 사용자 직접 터치로 화면이 손가락을 따라 이동하고 첫 화면으로 복귀함을 확인했습니다. 학생증 화면에서 사용자 직접 터치로 왼쪽 절반 시작 시 복귀, 오른쪽 절반 시작 시 무시, 중간 취소 시 화면 유지를 확인했습니다. 관리자 화면도 사용자 직접 터치로 오른쪽 절반 무시, 취소 시 심사 화면·로그인 유지, 완료 시 로그아웃·첫 화면 복귀를 확인했습니다. 실제 제출·심사 상태 변경은 하지 않았습니다. iOS 이메일 입력란의 ASCII 키보드와 영문 입력은 실기기로 확인했습니다.
- UI 실기기 검증(2026-11-08, iPhone 16 Pro Max): 가입 화면 하단 이메일 입력·키보드·스크롤, 빈 입력·약관 미동의 미리보기 진입, 학생증 승인 상태와 제출 이미지 조회를 확인했습니다. 관리자 대기·승인·반려 탭, 승인 자료 미리보기, 사유 입력과 스크롤도 확인했습니다. 키보드가 입력란을 가리는 문제는 ScrollView의 자동 키보드 여백으로 수정했습니다.
- 학생증 로컬 첨부 검증: 개인정보 없는 19KB PNG로 전체 이미지·파일명·용량, 교체 선택기와 동일 파일 재선택, 선택 취소 시 기존 파일 유지, 제거를 확인했습니다. 실제 업로드·제출·심사 변경은 실행하지 않았습니다. PDF와 대용량 사진의 회전·압축 후 글자 판독성은 별도 검증이 필요합니다.
- 검사: TypeScript 및 27개 테스트 통과(이미지 압축 테스트 포함). 네이티브 의존성을 포함해 iOS 재빌드·기기 설치·실행 성공. 빌드 오류는 없으며 로컬 Metal 도구 경로 관련 경고 3개가 남았습니다.
- 검증: `cd ConnectRN && npm test`로 개발 모드 요청 차단·Release 진입 거부 등을 확인합니다.

## Swift 앱 개발 미리보기

Xcode의 **Debug** 빌드는 기본적으로 서버 없이 실행됩니다. 예약자 `가입 완료하기`와 점주 `가입 신청하기`는 빈 정보로도 다음 화면에 진입합니다. 상단 배너가 개발 미리보기임을 표시합니다.

- 조회 화면은 로컬 예시/빈 데이터를 사용합니다. 실제 회원가입이나 서버 예약이 아닙니다.
- API transport에서 모든 네트워크 요청을 차단하므로 개발용 ID가 실제 서버로 전송되지 않습니다.
- 기존 Spring 서버 연동을 다시 확인하려면 **Edit Scheme → Run → Arguments → Environment Variables**에 `CONNECT_USE_LEGACY_SERVER=1`을 설정합니다. 이때는 서버 실행과 가입 정보가 필요합니다. 실기기의 `localhost`는 휴대폰 자체이므로 서버 주소도 변경해야 합니다.
- **Release** 빌드에는 입력 생략 진입과 예시 API 응답이 포함되지 않습니다. 이것이 Swift 앱의 출시 준비 완료를 의미하지는 않습니다. Swift 쪽 인증/서버 전환은 별도로 필요합니다.
- 검증: `python3 scripts/test_swift_preview.py`로 오프라인 조회·네트워크 차단·Release 제외를 확인합니다.

## 프로젝트 구조

- `Connect/Booker`: 예약자 플로우 화면
- `Connect/Owner`: 점주 플로우 화면
- `Connect/Root`: 앱 진입, 라우팅, 전역 상태
- `Connect/Components`: 공통 UI 컴포넌트
- `Connect/DesignSystem`: 색상, 타이포그래피 정의
- `Connect/Models/MockData.swift`: 화면 구동용 mock 모델/데이터
- `Connect.xcodeproj`: Xcode 프로젝트

## 현재 확인된 의존성

- 앱 유형: iOS SwiftUI 앱
- 패키지 의존성: Firebase iOS SDK
  - `FirebaseAnalytics`
  - `FirebaseAuth`
  - `FirebaseFirestore`

## 로컬 실행 전제

Swift 앱은 Xcode가 필요합니다. 2026-10-13에 Debug iOS Simulator 빌드를 검증했습니다.

필요 조건:

1. macOS에 `Xcode.app` 설치
2. 필요 시 `xcode-select`를 Xcode로 전환
3. Firebase를 실제로 붙일 경우 `GoogleService-Info.plist` 추가

## 실행 방법

1. Xcode로 `Connect.xcodeproj`를 엽니다.
2. 처음 열면 Swift Package 의존성(Firebase)이 자동으로 resolve/download 됩니다.
3. iOS Simulator 대상(iPhone 15 등)을 선택합니다.
4. `Run`을 실행합니다.

## Firebase 설정

프로젝트는 `GoogleService-Info.plist`가 없어도 실행되도록 조정되어 있습니다. 이 경우 Firebase 초기화를 생략합니다. REST 호출 여부는 위 개발 미리보기 설정으로 결정됩니다.

실서비스 연동이 필요하면:

1. Firebase Console에서 iOS 앱 등록
2. `GoogleService-Info.plist` 다운로드
3. 파일을 `Connect/` 아래에 추가하고, Xcode target membership이 `Connect`로 잡혀 있는지 확인

## CLI에서 빌드하고 싶을 때

Xcode 설치 후 아래처럼 developer directory를 Xcode로 맞춘 뒤 사용합니다.

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -list -project Connect.xcodeproj
```

## 현재 상태

- 레포지토리 클론 완료
- 프로젝트 구조 파악 완료
- Firebase 설정 파일 없이도 mock UI 실행 가능하도록 코드 보완 완료
- Debug iOS Simulator 빌드와 오프라인 API 격리 테스트 통과

## 업로드 이미지 자동 압축 (RN)

- 학생증 파일 선택 시 기기에서 JPEG로 압축하고, 실제 전송할 결과를 미리보기에 표시합니다. 긴 변 최대 2,000px, 최대 2MB이며 가로세로 비율을 유지합니다. 이미지 원본은 최대 10MB까지 선택할 수 있습니다.
- 공통 `InteractiveUploader`의 사진·이미지 파일은 긴 변 최대 1,600px, 최대 1MB로 준비합니다. 현재 매장 등록 화면에는 사진 저장 기능이 없으며, 해당 화면에 연결할 때 공통 선택기의 결과 URI를 사용해야 합니다.
- 작은 JPG/PNG는 변환 결과보다 원본이 작고 해상도 제한 이내이면 원본을 유지합니다. PDF는 압축하지 않고 기존 10MB 제한을 유지합니다. 압축 실패 시 업로드하지 않습니다.
- 이미지 바이트는 Supabase Storage에 저장하며 DB에는 기존 문서 경로를 저장합니다. 이미 저장된 파일에는 소급 적용하지 않습니다.
- `expo-image-manipulator` 네이티브 모듈을 추가했으므로 기존 개발 앱은 `npx expo prebuild --platform ios --no-clean` 후 `npx expo run:ios --device`로 다시 빌드해야 합니다. API 근거: [Expo SDK 57 ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/).
- 검증: 압축 정책 단위 테스트는 이미지 인코더를 모킹합니다. 실제 기기의 사진 회전·글자 판독성과 인코딩 결과는 별도 실기기 확인이 필요합니다.
