import SwiftUI

/// 예약 수정 화면 — 내 예약 목록에서 "예약 수정" 누르면 sheet로 진입
struct ReservationEditView: View {
    let reservationId: UUID
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    @State private var date: Date = Date()
    @State private var selectedTimes: Set<String> = []
    @State private var peopleText: String = "0"
    @State private var budgetText: String = ""
    @State private var eventPurpose: String = ""
    @State private var requestMessage: String = ""

    @State private var showSavedAlert: Bool = false
    @State private var showValidationAlert: Bool = false
    @State private var validationMessage: String = ""
    @State private var isSaving: Bool = false

    // 시간 관련 (StoreDetailView와 동일 규칙)
    private let timeRows: [[String]] = [
        ["17:00", "17:30", "18:00", "18:30"],
        ["19:00", "19:30", "20:00", "20:30"],
        ["21:00", "21:30", "22:00", "22:30"],
        ["23:00", "23:30", "24:00", ""],
    ]
    private let maxConsecutiveSlots: Int = 6

    private var allTimes: [String] {
        timeRows.flatMap { $0 }.filter { !$0.isEmpty }
    }

    private var currentReservation: MyReservation? {
        appState.myReservations.first(where: { $0.id == reservationId })
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        storeHeader
                        Divider()
                        dateSection
                        timeSection
                        peopleField
                        budgetField
                        eventPurposeField
                        requestMessageField
                        Spacer().frame(height: 20)
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 18)
                }
                bottomBar
            }
            .background(AppColors.surface.ignoresSafeArea())
            .navigationTitle("예약 수정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .foregroundStyle(AppColors.ink)
                    }
                }
            }
            .onAppear { loadFromReservation() }
            .alert("변경 사항이 저장되었습니다", isPresented: $showSavedAlert) {
                Button("확인") { dismiss() }
            } message: {
                Text("‘내 예약’ 목록에서 변경된 정보를 확인할 수 있어요.")
            }
            .alert("입력을 확인해주세요", isPresented: $showValidationAlert) {
                Button("확인", role: .cancel) { }
            } message: {
                Text(validationMessage)
            }
        }
    }

    // MARK: - 가게 정보 헤더
    private var storeHeader: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(LinearGradient(colors: [Color(hex: 0x3D3D3D), Color(hex: 0x1B1C1C)],
                                         startPoint: .top, endPoint: .bottom))
                    .frame(width: 56, height: 56)
                Image(systemName: currentReservation?.imageSymbol ?? "fork.knife")
                    .foregroundStyle(.white.opacity(0.7))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(currentReservation?.storeName ?? "")
                    .font(.headlineSM())
                    .foregroundStyle(AppColors.ink)
                Text(currentReservation?.dateLabel ?? "")
                    .font(.bodyMD())
                    .foregroundStyle(AppColors.inkSecondary)
            }
            Spacer()
        }
    }

    // MARK: - 날짜 (DatePicker)
    private var dateSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("날짜").font(.titleMD()).foregroundStyle(AppColors.ink)
            DatePicker("",
                       selection: $date,
                       in: Calendar.current.startOfDay(for: Date())...,
                       displayedComponents: [.date])
                .datePickerStyle(.graphical)
                .tint(AppColors.primaryDeep)
                .padding(.horizontal, 8)
                .padding(.vertical, 8)
                .background(AppColors.white)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                        .stroke(AppColors.borderStrong, lineWidth: 1)
                )
        }
    }

    // MARK: - 시간 (연속/최대 6칸)
    private var timeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("시간").font(.titleMD()).foregroundStyle(AppColors.ink)
                Text("(연속, 최대 6칸)")
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
        let isSelected = selectedTimes.contains(t)
        return Button { toggleTime(t) } label: {
            Text(t)
                .font(.bodyLG())
                .foregroundStyle(AppColors.ink)
                .frame(maxWidth: .infinity, minHeight: 38)
                .background(isSelected ? AppColors.primary : AppColors.white)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(isSelected ? AppColors.primaryDim : AppColors.borderStrong, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func toggleTime(_ t: String) {
        guard let idx = allTimes.firstIndex(of: t) else { return }
        if selectedTimes.contains(t) {
            // 이 시간 포함 그 이후 모두 제거
            selectedTimes = Set(
                selectedTimes.filter { (allTimes.firstIndex(of: $0) ?? Int.max) < idx }
            )
            return
        }
        let selectedIdx = selectedTimes.compactMap { allTimes.firstIndex(of: $0) }.sorted()
        if selectedIdx.isEmpty {
            selectedTimes.insert(t)
            return
        }
        guard selectedTimes.count < maxConsecutiveSlots else { return }
        if let first = selectedIdx.first, let last = selectedIdx.last,
           idx == first - 1 || idx == last + 1 {
            selectedTimes.insert(t)
        }
    }

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
        let components = timeString.split(separator: ":").compactMap { Int($0) }
        guard components.count == 2 else { return timeString }

        let hour = components[0]
        let minute = components[1]

        let totalMinutes = hour * 60 + minute + 30

        let newHour = (totalMinutes / 60) % 24
        let newMinute = totalMinutes % 60

        return String(format: "%02d:%02d", newHour, newMinute)
    }

    private func sortedSelectedTimes() -> [String] {
        selectedTimes
            .compactMap { t -> (Int, String)? in
                guard let i = allTimes.firstIndex(of: t) else { return nil }
                return (i, t)
            }
            .sorted(by: { $0.0 < $1.0 })
            .map { $0.1 }
    }

    // MARK: - 인원
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
                TextField("0", text: $budgetText)
                    .keyboardType(.numberPad)
                    .onChange(of: budgetText) { _, new in
                        let filtered = new.filter { $0.isNumber }
                        if filtered != new { budgetText = filtered }
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

    // MARK: - 행사 목적
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

    // MARK: - 요청 사항
    private var requestMessageField: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("요청 사항").font(.titleMD()).foregroundStyle(AppColors.ink)
            ZStack(alignment: .topLeading) {
                if requestMessage.isEmpty {
                    Text("점주님께 전달할 요청 사항을 입력해주세요.")
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

    // MARK: - 하단 버튼
    private var bottomBar: some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Text("취소")
            }
            .buttonStyle(GhostButtonStyle())

            Button { Task { await saveChanges() } } label: {
                Text(isSaving ? "저장 중..." : "변경 저장")
            }
            .buttonStyle(LimeButtonStyle())
            .disabled(isSaving)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(AppColors.white)
    }

    // MARK: - 데이터 로드 / 저장
    private func loadFromReservation() {
        guard let r = currentReservation else { return }
        date = r.dateValue ?? Date()
        selectedTimes = Set(r.timeLabels)
        peopleText = "\(r.people)"
        budgetText = r.budget.map(String.init) ?? ""
        eventPurpose = r.eventPurpose
        requestMessage = r.requestMessage
    }

    private func saveChanges() async {
        let peopleNum = Int(peopleText) ?? 0
        if peopleNum < 1 {
            validationMessage = "인원을 1명 이상 입력해주세요."
            showValidationAlert = true
            return
        }
        if selectedTimes.isEmpty {
            validationMessage = "예약 시간을 선택해주세요."
            showValidationAlert = true
            return
        }
        guard appState.myReservations.firstIndex(where: { $0.id == reservationId }) != nil else {
            dismiss(); return
        }

        let sorted = sortedSelectedTimes()
        // "24:00" 표기는 자정을 뜻하므로 백엔드가 이해하는 "00:00:00"으로 변환
        let backendTimeSlots = sorted.map { $0 == "24:00" ? "00:00:00" : "\($0):00" }

        isSaving = true
        defer { isSaving = false }
        do {
            let body = ReservationUpdateRequestBody(
                date: APIDateFormat.date.string(from: date),
                timeSlots: backendTimeSlots,
                people: peopleNum,
                budgetPerPerson: Int(budgetText),
                eventPurpose: eventPurpose,
                requestMessage: requestMessage
            )
            let updated = try await ConnectAPI.updateReservation(reservationId: reservationId, body)
            if let idx = appState.myReservations.firstIndex(where: { $0.id == reservationId }) {
                appState.myReservations[idx] = updated.toMyReservation()
            }
            showSavedAlert = true
        } catch {
            validationMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            showValidationAlert = true
        }
    }
}

#Preview {
    ReservationEditView(reservationId: UUID())
        .environment(AppState())
}
