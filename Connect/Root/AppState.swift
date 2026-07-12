import SwiftUI

// MARK: - 앱 전역 상태
@Observable
final class AppState {
    enum Route: Hashable {
        case onboarding
        case bookerTabs
        case ownerTabs
    }

    enum OnboardingDestination: Hashable {
        case bookerSignUp
        case ownerSignUp
    }

    var route: Route = .onboarding
    var onboardingPath: [OnboardingDestination] = []
    var selectedRole: UserRole? = nil

    // 예약자 프로필 (가입 시 입력 / 마이페이지에서 수정)
    var schoolName: String = ""
    var departmentName: String = ""
    var position: String = ""
    var realName: String = ""
    var schoolEmail: String = ""
    var phoneNumber: String = ""

    /// 사용자가 직접 올린 프로필 사진 (PhotosPicker 결과)
    var profileImageData: Data? = nil

    /// 검색 필터에서 마지막으로 고른 날짜
    var selectedSearchDate: Date? = nil

    /// 마지막으로 적용한 검색 필터 (지역/날짜/인원/시간)
    var lastSearchFilter: SearchFilter? = nil

    /// 사용자가 신청한 예약 목록 (최신순) — 백엔드 GET /api/bookers/{id}/reservations 로 채워짐
    var myReservations: [MyReservation] = []

    /// 예약자 탭 현재 선택 (0:홈 / 1:찜 / 2:내 예약 / 3:마이페이지)
    var selectedBookerTab: Int = 0

    // MARK: - 백엔드 연동 ID
    // 회원가입 전에는 backend/README.md의 시드 샘플 ID로 기본 동작 (테스트 편의).
    // 가입 완료 시 서버가 발급한 실제 ID로 교체됨.
    var bookerId: UUID = UUID(uuidString: "33333333-3333-3333-3333-333333333333")!
    var ownerId: UUID = UUID(uuidString: "11111111-1111-1111-1111-111111111111")!
    var ownerStoreId: UUID = UUID(uuidString: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")!

    func goToBookerSignUp() {
        selectedRole = .booker
        onboardingPath = [.bookerSignUp]
    }

    func goToOwnerSignUp() {
        selectedRole = .owner
        onboardingPath = [.ownerSignUp]
    }

    func finishBookerSignUp() {
        route = .bookerTabs
        onboardingPath = []
    }

    func finishOwnerSignUp() {
        route = .ownerTabs
        onboardingPath = []
    }

    func logout() {
        selectedRole = nil
        route = .onboarding
        onboardingPath = []
        // 프로필 정보 / 사진 / 검색 기록 초기화
        schoolName = ""
        departmentName = ""
        position = ""
        realName = ""
        schoolEmail = ""
        phoneNumber = ""
        profileImageData = nil
        selectedSearchDate = nil
        lastSearchFilter = nil
        myReservations = []
        selectedBookerTab = 0
        bookerId = UUID(uuidString: "33333333-3333-3333-3333-333333333333")!
        ownerId = UUID(uuidString: "11111111-1111-1111-1111-111111111111")!
        ownerStoreId = UUID(uuidString: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")!
    }
}
