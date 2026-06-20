import SwiftUI

// _14, _16, _22 — 가게 상세 + 예약 정보 입력
struct StoreDetailView: View {
    let store: Store
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    // 예약 입력 상태
    @State private var selectedDateKey: String = ""
    @State private var selectedTimes: Set<String> = []      // 연속, 최대 6칸
    @State private var peopleText: String = "18"            // 직접 입력
    @State private var budget: String = "25000"
    @State private var eventPurpose: String = ""            // 최대 15자
    @State private var requestMessage: String = ""          // 최대 100자
    @State private var isFavorite: Bool

    // 알림
    @State private var showSubmittedAlert: Bool = false
    @State private var showValidationAlert: Bool = false
    @State private var validationMessage: String = ""

    init(store: Store) {
        self.store = store
        _isFavorite = State(initialValue: store.isFavorite)
    }

    // MARK: - 시간표 (30분 간격, 마지막 빈칸 제외)
    private let timeRows: [[String]] = [
        ["17:00", "17:30", "18:00", "18:30"],
        ["19:00", "19:30", "20:00", "20:30"],
        ["21:00", "21:30", "22:00", "22:30"],
        ["23:00", "23:30", "24:00", ""],
    ]
    private let pastTimes: Set<String> = ["17:00", "17:30"]
    private let maxConsecutiveSlots: Int = 6

    private var allTimes: [String] {
        timeRows.flatMap { $0 }.filter { !$0.isEmpty }
    }

    // MARK: - 날짜 옵션 ±1일
    private var dateOptions: [(key: String, label: String, day: String, dim: Bool)] {
        let cal = Calendar.current
        let anchor = appState.selectedSearchDate ?? Date()
        let dayFmt = DateFormatter()
        dayFmt.locale = Locale(identifier: "ko_KR")
        dayFmt.dateFormat = "M/d"
        let weekdayFmt = DateFormatter()
        weekdayFmt.locale = Locale(identifier: "ko_KR")
        weekdayFmt.dateFormat = "EEEEE"

        return (-1...1).compactMap { offset in
            guard let date = cal.date(byAdding: .day, value: offset, to: anchor) else { return nil }
            let weekday = cal.component(.weekday, from: date)
            let dim = (weekday == 1)
            return (
                key: dayFmt.string(from: date),
                label: dayFmt.string(from: date),
                day: weekdayFmt.string(from: date),
                dim: dim
            )
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    headerImage
                    storeInfoBlock
                    Divider().padding(.vertical, 4)
                    reservationInfoHeader
                    dateSelector
                    timeSelector
                    peopleField
                    budgetField
                    eventPurposeField
                    requestMessageField
                    InfoBanner(
                        title: "예약 안내",
                        message: "단체 예약은 확정 전 점주님의 확인이 필요할 수 있습니다. 입력하신 예산에 맞춰 메뉴를 추천해 드릴 수 있습니다."
                    )
                    Spacer().frame(height: 100)
                }
                .padding(.horizontal, 18)
            }
            bottomCTA
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .alert("예약 신청 완료", isPresented: $showSubmittedAlert) {
            Button("내 예약 보기") {
                // "내 예약" 탭(인덱스 2)으로 이동하고 현재 상세 화면 닫기
                appState.selectedBookerTab = 2
                dismiss()
            }
            Button("닫기", role: .cancel) { dismiss() }
        } message: {
            Text("점주님께 예약 요청을 보냈어요.\n‘내 예약’ 탭에서 진행 상황을 확인할 수 있어요.")
        }
        .alert("입력을 확인해주세요", isPresented: $showValidationAlert) {
            Button("확인", role: .cancel) { }
        } message: {
            Text(validationMessage)
        }
    }

    // MARK: - 상단 이미지
    private var headerImage: some View {
        ZStack(alignment: .top) {
            LinearGradient(colors: [Color(hex: 0x4D4030), Color(hex: 0x1B1C1C)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
                .frame(height: 220)
                .overlay(
                    Image(systemName: store.imageName)
                        .font(.system(size: 48))
                        .foregroundStyle(.white.opacity(0.45))
                )
            HStack {
                Spacer()
                HStack(spacing: 10) {
                    Button { } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(.black.opacity(0.4))
                            .clipShape(Circle())
                    }
                    Button {
                        isFavorite.toggle()
                    } label: {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .foregroundStyle(isFavorite ? AppColors.danger : .white)
                            .padding(10)
                            .background(.black.opacity(0.4))
                            .clipShape(Circle())
                    }
                }
                .padding(.trailing, 14)
                .padding(.top, 14)
            }
        }
    }

    // MARK: - 가게 정보 + KPI
    private var storeInfoBlock: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                TagLabel(text: "일식 펍", color: AppColors.ink, textColor: AppColors.white)
                TagLabel(text: "오마카세")
            }

            Text(store.name)
                .font(.displayHero())
                .foregroundStyle(AppColors.ink)

            HStack(spacing: 10) {
                kpi(icon: "star.fill", label: "별점", value: String(format: "%.1f", store.rating), sub: "(\(store.reviewCount))")
                kpi(icon: "person.2", label: "단체수용인원", value: "최대 \(store.maxCapacity)명", sub: nil)
            }
            HStack(spacing: 10) {
                kpi(icon: "wonsign.circle", label: "1인당 평균가", value: "₩\(store.pricePerPerson.formatted())", sub: nil)
                kpi(icon: "checkmark.seal.fill", label: "예약 수락률", value: "\(store.acceptanceRate)%",
                    sub: "우수", bg: AppColors.primary.opacity(0.25))
            }
        }
    }

    // MARK: - 예약 정보 헤더
    private var reservationInfoHeader: some View {
        HStack(spacing: 6) {
            Image(systemName: "calendar.badge.plus")
                .foregroundStyle(AppColors.ink)
            Text("예약 정보 입력")
                .font(.headlineSM())
                .foregroundStyle(AppColors.ink)
        }
    }

    // MARK: - 날짜 (±1일)
    private var dateSelector: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("날짜 선택").font(.titleMD()).foregroundStyle(AppColors.ink)
            HStack(spacing: 10) {
                ForEach(dateOptions, id: \.key) { d in
                    dateCell(d)
                }
            }
            .onAppear {
                if selectedDateKey.isEmpty, dateOptions.count >= 2 {
                    selectedDateKey = dateOptions[1].key
                }
            }
        }
    }

    private func dateCell(_ d: (key: String, label: String, day: String, dim: Bool)) -> some View {
        let isSel = selectedDateKey == d.key
        return Button { selectedDateKey = d.key } label: {
            VStack(spacing: 2) {
                Text(d.label)
                    .font(.labelMD())
                    .foregroundStyle(d.dim ? AppColors.danger.opacity(0.7)
                                     : (isSel ? AppColors.white : AppColors.inkSecondary))
                Text(d.day)
                    .font(.titleMD())
                    .foregroundStyle(d.dim ? AppColors.danger
                                     : (isSel ? AppColors.white : AppColors.ink))
            }
            .frame(maxWidth: .infinity, minHeight: 60)
            .background(isSel ? AppColors.ink : AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - 시간 (다중, 연속, 최대 6칸)
    private var timeSelector: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("시간 선택").font(.titleMD()).foregroundStyle(AppColors.ink)
                Text("(연속된 시간, 최대 6칸)")
                    .font(.labelMD())
                    .foregroundStyle(AppColors.inkSecondary)
                Spacer()
                if !selectedTimes.isEmpty {
                    Text(selectedTimeRangeLabel)
                        .font(.labelMD())
                        .foregroundStyle(AppColors.primaryDeep)
                }
            }
            VStack(spacing: 8) {
                ForEach(timeRows.indices, id: \.self) { rowIdx in
                    HStack(spacing: 8) {
                        ForEach(timeRows[rowIdx], id: \.self) { t in
                            if t.isEmpty {
                                Spacer().frame(maxWidth: .infinity)
                            } else {
                                timeCell(t)
                            }
                        }
                    }
                }
            }
        }
    }

    private func timeCell(_ t: String) -> some View {
        let isPast = pastTimes.contains(t)
        let isSelected = selectedTimes.contains(t)
        return Button {
            if !isPast { toggleTime(t) }
        } label: {
            Text(t)
                .font(.bodyLG())
                .foregroundStyle(
                    isPast ? AppColors.neutral
                    : (isSelected ? AppColors.ink : AppColors.ink)
                )
                .frame(maxWidth: .infinity, minHeight: 38)
                .background(
                    isSelected ? AppColors.primary
                    : (isPast ? AppColors.surfaceContainerLow : AppColors.white)
                )
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(isSelected ? AppColors.primaryDim : AppColors.borderStrong, lineWidth: 1)
                )
                .strikethrough(isPast, color: AppColors.neutral)
        }
        .buttonStyle(.plain)
        .disabled(isPast)
    }

    /// 시간 선택 로직: 연속 추가만 가능, 최대 6칸. 이미 선택된 시간 탭 시 그 이후를 모두 해제.
    private func toggleTime(_ t: String) {
        guard let idx = allTimes.firstIndex(of: t) else { return }

        if selectedTimes.contains(t) {
            // 그 시간(포함)부터 뒤쪽 모두 제거 → 항상 연속성 유지
            selectedTimes = Set(
                selectedTimes.filter { (allTimes.firstIndex(of: $0) ?? Int.max) < idx }
            )
            return
        }

        // 선택 안 된 시간을 추가하려는 경우
        let selectedIdx = selectedTimes.compactMap { allTimes.firstIndex(of: $0) }.sorted()
        if selectedIdx.isEmpty {
            selectedTimes.insert(t)
            return
        }

        // 6칸 초과 차단
        guard selectedTimes.count < maxConsecutiveSlots else {
            return
        }

        // 양 끝과 인접한 경우에만 추가
        if let first = selectedIdx.first, let last = selectedIdx.last,
           idx == first - 1 || idx == last + 1 {
            selectedTimes.insert(t)
        }
        // 그 외(중간 점프) — 무시
    }

//    private var selectedTimeRangeLabel: String {
//        let sorted = selectedTimes
//            .compactMap { t -> (Int, String)? in
//                guard let i = allTimes.firstIndex(of: t) else { return nil }
//                return (i, t)
//            }
//            .sorted(by: { $0.0 < $1.0 })
//            .map { $0.1 }
//        guard let first = sorted.first, let last = sorted.last else { return "" }
//        if first == last { return first }
//        return "\(first) ~ \(last) (\(sorted.count)칸)"
//    }
    
    private var selectedTimeRangeLabel: String {
        let sorted = selectedTimes
            .compactMap { t -> (Int, String)? in
                guard let i = allTimes.firstIndex(of: t) else { return nil }
                return (i, t)
            }
            .sorted(by: { $0.0 < $1.0 })
            .map { $0.1 }
            
        guard let first = sorted.first, let last = sorted.last else { return "" }
        
        // 마지막 시간에 30분을 더한 종료 시간을 구합니다.
        let formattedEndTime = add30Minutes(to: last)
        
        // 한 칸만 선택해도 '시작 시간 ~ 30분 뒤 종료 시간'으로 명확하게 표현해줍니다.
        return "\(first) ~ \(formattedEndTime) (\(sorted.count)칸)"
    }

    /// "HH:mm" 형태의 문자열에 30분을 더해주는 헬퍼 함수
    private func add30Minutes(to timeString: String) -> String {
        // ":"를 기준으로 시(Hour)와 분(Minute)을 분리합니다.
        let components = timeString.split(separator: ":").compactMap { Int($0) }
        guard components.count == 2 else { return timeString } // 변환 실패 시 원본 반환 (안전장치)
        
        let hour = components[0]
        let minute = components[1]
        
        // 전체를 분 단위로 바꾼 뒤 30분을 더합니다.
        let totalMinutes = hour * 60 + minute + 30
        
        // 다시 시와 분으로 환산합니다. (24시간 형식 케이스 대응)
        let newHour = (totalMinutes / 60) % 24
        let newMinute = totalMinutes % 60
        
        // 2자리 숫자에 맞춰 "00:00" 포맷 문자열로 반환합니다.
        return String(format: "%02d:%02d", newHour, newMinute)
    }

    // MARK: - 인원 (stepper 제거, 직접 입력)
    private var peopleField: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("인원").font(.titleMD()).foregroundStyle(AppColors.ink)
            HStack {
                Image(systemName: "person.2.fill")
                    .foregroundStyle(AppColors.inkSecondary)
                TextField("0", text: $peopleText)
                    .keyboardType(.numberPad)
                    .font(.headlineSM())
                    .foregroundStyle(AppColors.ink)
                    .onChange(of: peopleText) { _, new in
                        let filtered = new.filter { $0.isNumber }
                        if filtered != new { peopleText = filtered }
                    }
                Spacer()
                Text("명")
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.inkSecondary)
            }
            .padding(14)
            .background(AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
        }
    }

    // MARK: - 예산
    private var budgetField: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("예산").font(.titleMD()).foregroundStyle(AppColors.ink)
                Text("(1인당)").font(.bodyMD()).foregroundStyle(AppColors.inkSecondary)
            }
            HStack {
                Text("₩").foregroundStyle(AppColors.inkSecondary)
                TextField("25000", text: $budget)
                    .keyboardType(.numberPad)
                    .onChange(of: budget) { _, new in
                        let filtered = new.filter { $0.isNumber }
                        if filtered != new { budget = filtered }
                    }
            }
            .padding(14)
            .background(AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
        }
    }

    // MARK: - 행사 목적 (최대 15자)
    private var eventPurposeField: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("행사 목적").font(.titleMD()).foregroundStyle(AppColors.ink)
            ZStack(alignment: .topLeading) {
                if eventPurpose.isEmpty {
                    Text("예: 종강파티, 대동제 뒷풀이 등")
                        .font(.bodyLG())
                        .foregroundStyle(AppColors.neutral)
                        .padding(14)
                }
                TextEditor(text: $eventPurpose)
                    .padding(8)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 60)
                    .onChange(of: eventPurpose) { _, new in
                        if new.count > 15 { eventPurpose = String(new.prefix(15)) }
                    }
            }
            .background(AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
            HStack {
                Spacer()
                Text("\(eventPurpose.count) / 15")
                    .font(.labelMD())
                    .foregroundStyle(eventPurpose.count >= 15 ? AppColors.danger : AppColors.neutral)
            }
        }
    }

    // MARK: - 요청 사항 (최대 100자)
    private var requestMessageField: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("요청 사항").font(.titleMD()).foregroundStyle(AppColors.ink)
            ZStack(alignment: .topLeading) {
                if requestMessage.isEmpty {
                    Text("점주님께 전달할 요청 사항을 입력해주세요. (예: 생일 케이크 반입 가능할까요?)")
                        .font(.bodyMD())
                        .foregroundStyle(AppColors.neutral)
                        .padding(14)
                }
                TextEditor(text: $requestMessage)
                    .padding(8)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 80)
                    .onChange(of: requestMessage) { _, new in
                        if new.count > 100 { requestMessage = String(new.prefix(100)) }
                    }
            }
            .background(AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
            HStack {
                Spacer()
                Text("\(requestMessage.count) / 100")
                    .font(.labelMD())
                    .foregroundStyle(requestMessage.count >= 100 ? AppColors.danger : AppColors.neutral)
            }
        }
    }

    // MARK: - 하단 CTA
    private var bottomCTA: some View {
        VStack {
            Button { submit() } label: {
                HStack {
                    Text("예약 신청하기")
                    Image(systemName: "arrow.right")
                }
            }
            .buttonStyle(LimeButtonStyle())
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
        }
        .background(.thinMaterial)
    }

    // MARK: - 예약 신청
    private func submit() {
        if selectedDateKey.isEmpty {
            validationMessage = "예약 날짜를 선택해주세요."
            showValidationAlert = true
            return
        }
        if selectedTimes.isEmpty {
            validationMessage = "예약 시간을 선택해주세요."
            showValidationAlert = true
            return
        }
        let peopleNum = Int(peopleText) ?? 0
        if peopleNum < 1 {
            validationMessage = "인원을 1명 이상 입력해주세요."
            showValidationAlert = true
            return
        }
        guard let dateOpt = dateOptions.first(where: { $0.key == selectedDateKey }) else { return }

        // 정렬된 시간 목록
        let sortedTimes = selectedTimes
            .compactMap { t -> (Int, String)? in
                guard let i = allTimes.firstIndex(of: t) else { return nil }
                return (i, t)
            }
            .sorted(by: { $0.0 < $1.0 })
            .map { $0.1 }
        let timeLabel: String = {
            if sortedTimes.count == 1 { return sortedTimes[0] }
            return "\(sortedTimes.first!) ~ \(sortedTimes.last!)"
        }()
        let dateLabel = "\(dateOpt.label) (\(dateOpt.day)) \(timeLabel)"

        // 편집용 dateValue 계산
        let cal = Calendar.current
        let anchor = appState.selectedSearchDate ?? Date()
        let offset: Int = {
            if let idx = dateOptions.firstIndex(where: { $0.key == selectedDateKey }) {
                return idx - 1  // 0:어제, 1:기준, 2:내일
            }
            return 0
        }()
        let dateValue = cal.date(byAdding: .day, value: offset, to: anchor)

        let newReservation = MyReservation(
            id: UUID(),
            storeName: store.name,
            imageSymbol: store.imageName,
            status: .pending,
            dateLabel: dateLabel,
            people: peopleNum,
            budget: Int(budget),
            dateValue: dateValue,
            timeLabels: sortedTimes,
            eventPurpose: eventPurpose,
            requestMessage: requestMessage
        )
        appState.myReservations.insert(newReservation, at: 0)
        showSubmittedAlert = true
    }

    // MARK: - KPI 칸
    private func kpi(icon: String, label: String, value: String, sub: String?, bg: Color = AppColors.surfaceContainerLow) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(AppColors.primaryDeep)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                HStack(spacing: 4) {
                    Text(value).font(.titleMD()).foregroundStyle(AppColors.ink)
                    if let sub { Text(sub).font(.labelMD()).foregroundStyle(AppColors.primaryDeep) }
                }
            }
            Spacer()
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(bg)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    NavigationStack {
        StoreDetailView(store: MockData.searchResults.first!)
    }
    .environment(AppState())
}
