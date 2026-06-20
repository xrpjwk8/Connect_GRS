import SwiftUI

// MARK: - 앱 전역 상태
@Observable
final class AppState {
    enum Route: Hashable {
        case roleSelection
        case bookerSignUp
        case ownerSignUp
        case bookerTabs
        case ownerTabs
    }

    var route: Route = .roleSelection
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

    /// 사용자가 신청한 예약 목록 (최신순)
    var myReservations: [MyReservation] = MockData.allReservations

    /// 예약자 탭 현재 선택 (0:홈 / 1:찜 / 2:내 예약 / 3:마이페이지)
    var selectedBookerTab: Int = 0

    func goToBookerSignUp() {
        selectedRole = .booker
        route = .bookerSignUp
    }

    func goToOwnerSignUp() {
        selectedRole = .owner
        route = .ownerSignUp
    }

    func finishBookerSignUp() {
        route = .bookerTabs
    }

    func finishOwnerSignUp() {
        route = .ownerTabs
    }

    func logout() {
        selectedRole = nil
        route = .roleSelection
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
        myReservations = MockData.allReservations
        selectedBookerTab = 0
    }
}
