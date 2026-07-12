import Foundation

// MARK: - 백엔드 응답 DTO (backend/README.md 엔드포인트 기준)

struct FilterMetadataDTO: Decodable {
    let regions: [String]
    let categories: [String]
    let universities: [String]
    let timeOptions: [String]
}

struct StoreDTO: Decodable {
    let id: UUID
    let name: String
    let category: String
    let rating: Double
    let reviewCount: Int
    let maxCapacity: Int
    let pricePerPerson: Int
    let acceptanceRate: Int
    let region: String
    let description: String
    let imageName: String
    let keywords: [String]
    let favorite: Bool
}

struct ReservationDTO: Decodable {
    let id: UUID
    let storeId: UUID
    let storeName: String
    let imageName: String
    let ownerId: UUID
    let bookerId: UUID
    let bookerName: String
    let bookerAffiliation: String
    let date: String        // yyyy-MM-dd
    let timeSlots: [String] // HH:mm:ss
    let people: Int
    let budgetPerPerson: Int?
    let eventPurpose: String
    let requestMessage: String
    let status: String
    let createdAt: String
}

struct OwnerDashboardDTO: Decodable {
    let storeName: String
    let weeklyRevenueManWon: Int
    let weeklyReservationCount: Int
    let pendingRequestCount: Int
    let pendingRequests: [ReservationDTO]
}

struct AvailabilitySlotDTO: Decodable {
    let time: String  // HH:mm:ss
    let state: String // available | blocked | reserved | closed
}

struct AvailabilityDTO: Decodable {
    let date: String
    let slots: [AvailabilitySlotDTO]
}

struct BookerProfileDTO: Decodable {
    let id: UUID
    let schoolName: String
    let departmentName: String
    let position: String
    let realName: String
    let schoolEmail: String
    let phoneNumber: String
}

struct OwnerProfileDTO: Decodable {
    let id: UUID
    let storeName: String
    let ownerName: String
    let contact: String
    let businessNumber: String
    let storeId: UUID
}

// MARK: - 요청 바디

struct BookerSignUpRequestBody: Encodable {
    let schoolName: String
    let departmentName: String
    let position: String
    let realName: String
    let schoolEmail: String
    let phoneNumber: String
}

struct OwnerSignUpRequestBody: Encodable {
    let storeName: String
    let ownerName: String
    let contact: String
    let businessNumber: String
}

struct ReservationCreateRequestBody: Encodable {
    let storeId: UUID
    let bookerId: UUID
    let date: String
    let timeSlots: [String]
    let people: Int
    let budgetPerPerson: Int?
    let eventPurpose: String
    let requestMessage: String?
}

struct ReservationUpdateRequestBody: Encodable {
    let date: String
    let timeSlots: [String]
    let people: Int
    let budgetPerPerson: Int?
    let eventPurpose: String?
    let requestMessage: String?
}

struct TimeBlockUpdateRequestBody: Encodable {
    let storeId: UUID
    let date: String
    let blockedSlots: [String]
}

// MARK: - 백엔드 API 엔드포인트 래퍼

enum ConnectAPI {
    static func fetchFilters() async throws -> FilterMetadataDTO {
        try await APIClient.shared.get("/api/meta/filters")
    }

    static func signUpBooker(_ body: BookerSignUpRequestBody) async throws -> BookerProfileDTO {
        try await APIClient.shared.post("/api/auth/bookers", body: body)
    }

    static func signUpOwner(_ body: OwnerSignUpRequestBody) async throws -> OwnerProfileDTO {
        try await APIClient.shared.post("/api/auth/owners", body: body)
    }

    static func featuredStores(bookerId: UUID?, region: String?) async throws -> [StoreDTO] {
        try await APIClient.shared.get("/api/stores/featured", query: [
            "bookerId": bookerId?.uuidString,
            "region": region
        ])
    }

    static func searchStores(bookerId: UUID?, region: String?, category: String?, people: Int?, date: String?, time: String?) async throws -> [StoreDTO] {
        try await APIClient.shared.get("/api/stores", query: [
            "bookerId": bookerId?.uuidString,
            "region": region,
            "category": category,
            "people": people.map(String.init),
            "date": date,
            "time": time
        ])
    }

    static func store(storeId: UUID, bookerId: UUID?) async throws -> StoreDTO {
        try await APIClient.shared.get("/api/stores/\(storeId.uuidString)", query: [
            "bookerId": bookerId?.uuidString
        ])
    }

    static func favorites(bookerId: UUID) async throws -> [StoreDTO] {
        try await APIClient.shared.get("/api/bookers/\(bookerId.uuidString)/favorites")
    }

    static func addFavorite(bookerId: UUID, storeId: UUID) async throws {
        try await APIClient.shared.postNoContent("/api/bookers/\(bookerId.uuidString)/favorites/\(storeId.uuidString)")
    }

    static func removeFavorite(bookerId: UUID, storeId: UUID) async throws {
        try await APIClient.shared.delete("/api/bookers/\(bookerId.uuidString)/favorites/\(storeId.uuidString)")
    }

    static func createReservation(_ body: ReservationCreateRequestBody) async throws -> ReservationDTO {
        try await APIClient.shared.post("/api/reservations", body: body)
    }

    static func reservations(bookerId: UUID, statusGroup: String?) async throws -> [ReservationDTO] {
        try await APIClient.shared.get("/api/bookers/\(bookerId.uuidString)/reservations", query: [
            "statusGroup": statusGroup
        ])
    }

    static func updateReservation(reservationId: UUID, _ body: ReservationUpdateRequestBody) async throws -> ReservationDTO {
        try await APIClient.shared.patch("/api/reservations/\(reservationId.uuidString)", body: body)
    }

    static func cancelReservation(reservationId: UUID) async throws -> ReservationDTO {
        try await APIClient.shared.post("/api/reservations/\(reservationId.uuidString)/cancel", body: [String: String]())
    }

    static func ownerDashboard(ownerId: UUID) async throws -> OwnerDashboardDTO {
        try await APIClient.shared.get("/api/owners/\(ownerId.uuidString)/dashboard")
    }

    static func approveReservation(ownerId: UUID, reservationId: UUID) async throws -> ReservationDTO {
        try await APIClient.shared.post("/api/owners/\(ownerId.uuidString)/reservations/\(reservationId.uuidString)/approve", body: [String: String]())
    }

    static func rejectReservation(ownerId: UUID, reservationId: UUID) async throws -> ReservationDTO {
        try await APIClient.shared.post("/api/owners/\(ownerId.uuidString)/reservations/\(reservationId.uuidString)/reject", body: [String: String]())
    }

    static func availability(ownerId: UUID, storeId: UUID, date: String) async throws -> AvailabilityDTO {
        try await APIClient.shared.get("/api/owners/\(ownerId.uuidString)/availability", query: [
            "storeId": storeId.uuidString,
            "date": date
        ])
    }

    static func replaceBlockedSlots(ownerId: UUID, _ body: TimeBlockUpdateRequestBody) async throws -> AvailabilityDTO {
        try await APIClient.shared.put("/api/owners/\(ownerId.uuidString)/availability/blocks", body: body)
    }
}
