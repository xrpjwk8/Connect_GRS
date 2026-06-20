import Foundation

// MARK: - Domain Models

enum UserRole: String, Codable {
    case booker, owner
}

enum ReservationStatus: String {
    case pending = "점주 응답 대기"
    case confirmed = "확정"
    case completed = "완료"
    case cancelled = "취소"
    case rejected = "점주 거절"
}

struct Store: Identifiable, Hashable {
    let id: UUID
    let name: String
    let category: String
    let rating: Double
    let reviewCount: Int
    let maxCapacity: Int
    let pricePerPerson: Int
    let acceptanceRate: Int   // 예약 수락률 (%)
    let location: String
    let imageName: String     // SF Symbol fallback or asset name
    let keywords: [String]
    let isFavorite: Bool
}

struct ReservationRequest: Identifiable, Hashable {
    let id: UUID
    let storeName: String
    let bookerName: String
    let bookerAffiliation: String
    let dateTimeLabel: String
    let people: Int
    let message: String
}

struct MyReservation: Identifiable, Hashable {
    let id: UUID
    var storeName: String
    var imageSymbol: String
    var status: ReservationStatus
    var dateLabel: String
    var people: Int
    var budget: Int?

    // 편집용 추가 필드 (앱에서 신청한 예약은 채워짐, 기존 mock 데이터는 nil/빈값)
    var dateValue: Date? = nil
    var timeLabels: [String] = []
    var eventPurpose: String = ""
    var requestMessage: String = ""
}

struct OwnerReservation: Identifiable, Hashable {
    let id: UUID
    let group: String           // 연세대학교 인공지능학과
    let event: String           // 기말 종강 파티
    let timeRange: String       // 19:00 - 21:00
    let people: Int
    let confirmed: Bool         // 확정 vs 대기
}

enum TimeSlotState {
    case available, blocked, reserved, closed
}

struct TimeSlot: Identifiable, Hashable {
    let id = UUID()
    let label: String  // "16:00 - 18:00"
    var state: TimeSlotState
}

// MARK: - Mock 데이터
enum MockData {
    static let regions = ["신촌", "왕십리", "건대", "혜화"]
    static let categories = ["전체", "술집", "고깃집", "파티룸", "카페"]
    static let timeOptions = ["상관없음", "18:00", "19:00", "20:00", "21:00", "22:00"]
    static let universities = ["연세대학교", "고려대학교", "서강대학교", "한양대학교", "이화여자대학교", "홍익대학교"]

    static let homeFeaturedStores: [Store] = [
        Store(id: UUID(),
              name: "청춘 연어 신촌점",
              category: "술집",
              rating: 4.8, reviewCount: 120,
              maxCapacity: 40, pricePerPerson: 15000,
              acceptanceRate: 96,
              location: "신촌",
              imageName: "fork.knife",
              keywords: ["최대 40석", "단체 환영"],
              isFavorite: false),
        Store(id: UUID(),
              name: "스페이스 아지트",
              category: "파티룸",
              rating: 4.9, reviewCount: 85,
              maxCapacity: 60, pricePerPerson: 20000,
              acceptanceRate: 92,
              location: "신촌",
              imageName: "sparkles",
              keywords: ["파티룸", "조용한 분위기"],
              isFavorite: true),
    ]

    static let searchResults: [Store] = [
        Store(id: UUID(),
              name: "수지상회 신촌점",
              category: "요리주점 / 오마카세",
              rating: 4.9, reviewCount: 124,
              maxCapacity: 30, pricePerPerson: 25000,
              acceptanceRate: 98,
              location: "신촌",
              imageName: "wineglass",
              keywords: ["단체 50명", "코스 메뉴"],
              isFavorite: false),
        Store(id: UUID(),
              name: "구이마을 2호점",
              category: "고기집 / 무한리필",
              rating: 4.7, reviewCount: 88,
              maxCapacity: 50, pricePerPerson: 30000,
              acceptanceRate: 95,
              location: "신촌",
              imageName: "flame",
              keywords: ["단체석 완비", "신촌역 도보 5분"],
              isFavorite: false),
        Store(id: UUID(),
              name: "신촌 현명포차",
              category: "요리주점 / 한중일양식",
              rating: 4.8, reviewCount: 60,
              maxCapacity: 80, pricePerPerson: 25000,
              acceptanceRate: 90,
              location: "신촌",
              imageName: "music.note.house",
              keywords: ["DJ 부킹", "스테이지"],
              isFavorite: false),
    ]

    static let favorites: [Store] = [
        Store(id: UUID(),
              name: "미도리 가든 신촌점",
              category: "일식",
              rating: 4.9, reviewCount: 200,
              maxCapacity: 25, pricePerPerson: 28000,
              acceptanceRate: 97,
              location: "신촌",
              imageName: "leaf",
              keywords: ["최대 25석"],
              isFavorite: true),
        Store(id: UUID(),
              name: "더 링크 다이닝",
              category: "이태리",
              rating: 4.7, reviewCount: 150,
              maxCapacity: 50, pricePerPerson: 35000,
              acceptanceRate: 93,
              location: "신촌",
              imageName: "fork.knife.circle",
              keywords: ["최대 50석"],
              isFavorite: true),
    ]

    static let activeReservations: [MyReservation] = {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        func d(_ offset: Int, hour: Int, minute: Int = 0) -> Date {
            var c = DateComponents(); c.day = offset; c.hour = hour; c.minute = minute
            return cal.date(byAdding: c, to: today)!
        }
        return [
            MyReservation(id: UUID(),
                          storeName: "이자카야 모리",
                          imageSymbol: "wineglass",
                          status: .confirmed,
                          dateLabel: "5/25 (일) 19:00",
                          people: 18, budget: 25000,
                          dateValue: d(1, hour: 19)),
            MyReservation(id: UUID(),
                          storeName: "구이구이 정육식당",
                          imageSymbol: "flame",
                          status: .pending,
                          dateLabel: "5/27 (화) 18:30",
                          people: 24, budget: nil,
                          dateValue: d(3, hour: 18, minute: 30)),
        ]
    }()

    static let pastReservations: [MyReservation] = [
        MyReservation(id: UUID(),
                      storeName: "맥주창고 강남점",
                      imageSymbol: "mug",
                      status: .completed,
                      dateLabel: "5/10 (금) 방문",
                      people: 0, budget: nil),
        MyReservation(id: UUID(),
                      storeName: "카페 드 로스터리",
                      imageSymbol: "cup.and.saucer",
                      status: .completed,
                      dateLabel: "4/28 (일) 방문",
                      people: 0, budget: nil),
    ]

    /// 모든 상태(진행 중 / 완료 / 취소 / 거절)를 포함한 전체 예약 mock 목록
    static let allReservations: [MyReservation] = {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        func d(_ offset: Int, hour: Int, minute: Int = 0) -> Date {
            var c = DateComponents(); c.day = offset; c.hour = hour; c.minute = minute
            return cal.date(byAdding: c, to: today)!
        }
        return [
            // ── 진행 중: 확정
            MyReservation(id: UUID(),
                          storeName: "이자카야 모리",
                          imageSymbol: "wineglass",
                          status: .confirmed,
                          dateLabel: "5/25 (일) 19:00",
                          people: 18, budget: 25000,
                          dateValue: d(1, hour: 19)),
            // ── 진행 중: 점주 응답 대기
            MyReservation(id: UUID(),
                          storeName: "구이구이 정육식당",
                          imageSymbol: "flame",
                          status: .pending,
                          dateLabel: "5/27 (화) 18:30",
                          people: 24, budget: nil,
                          dateValue: d(3, hour: 18, minute: 30)),
            MyReservation(id: UUID(),
                          storeName: "스페이스 아지트",
                          imageSymbol: "sparkles",
                          status: .pending,
                          dateLabel: "6/1 (일) 20:00",
                          people: 15, budget: 20000,
                          dateValue: d(8, hour: 20)),
            // ── 완료
            MyReservation(id: UUID(),
                          storeName: "맥주창고 강남점",
                          imageSymbol: "mug",
                          status: .completed,
                          dateLabel: "5/10 (금) 19:00",
                          people: 12, budget: 18000,
                          dateValue: d(-14, hour: 19)),
            MyReservation(id: UUID(),
                          storeName: "카페 드 로스터리",
                          imageSymbol: "cup.and.saucer",
                          status: .completed,
                          dateLabel: "4/28 (일) 18:00",
                          people: 8, budget: 15000,
                          dateValue: d(-26, hour: 18)),
            // ── 취소 (유저 직접 취소)
            MyReservation(id: UUID(),
                          storeName: "수지상회 신촌점",
                          imageSymbol: "wineglass",
                          status: .cancelled,
                          dateLabel: "5/15 (수) 19:00",
                          people: 10, budget: 25000,
                          dateValue: d(-9, hour: 19)),
            // ── 거절 (점주 거절)
            MyReservation(id: UUID(),
                          storeName: "신촌 현명포차",
                          imageSymbol: "music.note.house",
                          status: .rejected,
                          dateLabel: "5/12 (월) 20:00",
                          people: 20, budget: nil,
                          dateValue: d(-12, hour: 20)),
        ]
    }()

    static let pendingRequests: [ReservationRequest] = [
        ReservationRequest(id: UUID(),
                           storeName: "캠퍼스 포차",
                           bookerName: "김지연",
                           bookerAffiliation: "연세대학교 · 경영학과",
                           dateTimeLabel: "오늘 19:00",
                           people: 8,
                           message: "동아리 회식입니다! 안쪽 조용한 자리로 부탁드려요."),
        ReservationRequest(id: UUID(),
                           storeName: "캠퍼스 포차",
                           bookerName: "박준혁",
                           bookerAffiliation: "홍익대학교 · 시각디자인과",
                           dateTimeLabel: "내일 20:00",
                           people: 12,
                           message: "기말 작품 종강 모임으로 가려고 합니다."),
    ]

    static let ownerReservations: [OwnerReservation] = [
        OwnerReservation(id: UUID(),
                         group: "연세대학교 인공지능학과",
                         event: "기말 종강 파티",
                         timeRange: "19:00 - 21:00",
                         people: 25, confirmed: true),
        OwnerReservation(id: UUID(),
                         group: "고려대학교 경영학회",
                         event: "네트워킹 이벤트",
                         timeRange: "15:00 - 17:30",
                         people: 12, confirmed: false),
    ]

    static let defaultTimeSlots: [TimeSlot] = [
        TimeSlot(label: "16:00 ~ 16:30", state: .closed),
        TimeSlot(label: "16:30 ~ 17:00", state: .closed),
        TimeSlot(label: "17:00 ~ 17:30", state: .closed),
        TimeSlot(label: "17:30 ~ 18:00", state: .closed),
        TimeSlot(label: "18:00 ~ 18:30", state: .blocked),
        TimeSlot(label: "18:30 ~ 19:00", state: .available),
        TimeSlot(label: "19:00 ~ 19:30", state: .blocked),
        TimeSlot(label: "19:30 ~ 20:00", state: .blocked),
        TimeSlot(label: "20:00 ~ 20:30", state: .available),
        TimeSlot(label: "20:30 ~ 21:00", state: .available),
        TimeSlot(label: "21:00 ~ 21:30", state: .available),
        TimeSlot(label: "21:30 ~ 22:00", state: .available),
        TimeSlot(label: "22:00 ~ 22:30", state: .available),
        TimeSlot(label: "22:30 ~ 23:00", state: .available),
        TimeSlot(label: "23:00 ~ 23:30", state: .available),
        TimeSlot(label: "23:30 ~ 00:00", state: .available),
        TimeSlot(label: "00:00 ~ 00:30", state: .closed),
        TimeSlot(label: "00:30 ~ 01:00", state: .closed),
        TimeSlot(label: "01:00 ~ 01:30", state: .closed),
        TimeSlot(label: "01:30 ~ 02:00", state: .closed)
    ]
}
