import Foundation

/// 백엔드는 java.time을 ISO 문자열(yyyy-MM-dd, HH:mm:ss)로 직렬화한다.
enum APIDateFormat {
    static let date: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static let time: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm:ss"
        return f
    }()

    static let displayTime: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm"
        return f
    }()

    static let dateWithWeekday: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M/d (E)"
        return f
    }()

    static func addHalfHour(to hhmm: String) -> String {
        let parts = hhmm.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return hhmm }
        let total = parts[0] * 60 + parts[1] + 30
        return String(format: "%02d:%02d", (total / 60) % 24, total % 60)
    }
}

extension StoreDTO {
    func toStore() -> Store {
        Store(
            id: id,
            name: name,
            category: category,
            rating: rating,
            reviewCount: reviewCount,
            maxCapacity: maxCapacity,
            pricePerPerson: pricePerPerson,
            acceptanceRate: acceptanceRate,
            location: region,
            imageName: imageName,
            keywords: keywords,
            isFavorite: favorite
        )
    }
}

extension ReservationDTO {
    var reservationStatus: ReservationStatus {
        switch status {
        case "PENDING": return .pending
        case "CONFIRMED": return .confirmed
        case "COMPLETED": return .completed
        case "CANCELLED": return .cancelled
        case "REJECTED": return .rejected
        default: return .pending
        }
    }

    private var displayTimeSlots: [String] {
        timeSlots.compactMap { slot in
            APIDateFormat.time.date(from: slot).map { APIDateFormat.displayTime.string(from: $0) }
                ?? String(slot.prefix(5))
        }
    }

    private var dateValueParsed: Date? {
        APIDateFormat.date.date(from: date)
    }

    func toMyReservation() -> MyReservation {
        let times = displayTimeSlots
        let timeLabel = times.isEmpty ? "" : (times.count == 1 ? times[0] : "\(times.first!) ~ \(times.last!)")
        let dayLabel = dateValueParsed.map { APIDateFormat.dateWithWeekday.string(from: $0) } ?? date
        let dateLabel = timeLabel.isEmpty ? dayLabel : "\(dayLabel) \(timeLabel)"

        return MyReservation(
            id: id,
            storeName: storeName,
            imageSymbol: imageName,
            status: reservationStatus,
            dateLabel: dateLabel,
            people: people,
            budget: budgetPerPerson,
            dateValue: dateValueParsed,
            timeLabels: times,
            eventPurpose: eventPurpose,
            requestMessage: requestMessage
        )
    }

    func toReservationRequest() -> ReservationRequest {
        let times = displayTimeSlots
        let dayLabel = dateValueParsed.map {
            let f = DateFormatter()
            f.locale = Locale(identifier: "ko_KR")
            f.dateFormat = "M/d"
            return f.string(from: $0)
        } ?? date
        let timeLabel = times.first ?? ""

        return ReservationRequest(
            id: id,
            storeName: storeName,
            bookerName: bookerName,
            bookerAffiliation: bookerAffiliation,
            dateTimeLabel: "\(dayLabel) \(timeLabel)",
            people: people,
            message: requestMessage
        )
    }
}

extension AvailabilitySlotDTO {
    func toTimeSlot() -> TimeSlot {
        let display = String(time.prefix(5))
        let endDisplay = APIDateFormat.addHalfHour(to: display)
        let mappedState: TimeSlotState
        switch state {
        case "blocked": mappedState = .blocked
        case "reserved": mappedState = .reserved
        case "closed": mappedState = .closed
        default: mappedState = .available
        }
        return TimeSlot(label: "\(display) ~ \(endDisplay)", state: mappedState, rawTime: time)
    }
}
