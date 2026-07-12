# Connect_GRS

SwiftUI 기반 iOS 앱 프로젝트입니다. 현재 구조상 예약자(`Booker`) 화면, 점주(`Owner`) 화면, 공통 루트/디자인 시스템으로 나뉘어 있고, 앱 데이터는 대부분 `MockData.swift`를 통해 로컬 mock 데이터로 동작합니다.

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

이 프로젝트는 Xcode가 필요합니다. 현재 이 작업 환경에서는 `xcodebuild`가 `CommandLineTools`를 가리키고 있어 CLI 빌드 검증은 수행하지 못했습니다.

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

프로젝트는 `GoogleService-Info.plist`가 없어도 실행되도록 조정되어 있습니다. 이 경우 Firebase 없이 mock UI만 동작합니다.

실서비스 연동이 필요하면:

1. Firebase Console에서 iOS 앱 등록
2. `GoogleService-Info.plist` 다운로드
3. 파일을 `Connect/` 아래에 추가하고, Xcode target membership이 `Connect`로 잡혀 있는지 확인

## CLI에서 빌드하고 싶을 때

Xcode 설치 후 아래처럼 developer directory를 Xcode로 맞춘 뒤 사용합니다.

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -list -project /Users/minjooncho/SandBox/Connect_GRS/Connect.xcodeproj
```

## 현재 상태

- 레포지토리 클론 완료
- 프로젝트 구조 파악 완료
- Firebase 설정 파일 없이도 mock UI 실행 가능하도록 코드 보완 완료
- 다만 이 환경에서는 전체 Xcode가 잡혀 있지 않아 실제 빌드/시뮬레이터 실행 검증은 미완료
