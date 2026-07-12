import SwiftUI

// _6 — 영업 시간표 관리 (원터치 타임 블락)
struct TimeBlockView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState
    @State private var selectedDate: Date = Calendar.current.startOfDay(for: Date())
    @State private var slots: [TimeSlot] = []
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String? = nil

    private let weekDayOffsets = Array(0..<6)

    private func date(for offset: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: offset, to: Calendar.current.startOfDay(for: Date()))!
    }

    private var monthLabel: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "yyyy년 M월"
        return f.string(from: selectedDate)
    }

    private var selectedDayLabel: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M월 d일 (E)"
        return f.string(from: selectedDate)
    }

    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text(monthLabel)
                        .font(.headlineMD())
                        .foregroundStyle(AppColors.ink)
                    Spacer()
                }

                // 주간 일자 (가로 스크롤)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(weekDayOffsets, id: \.self) { offset in
                            let d = date(for: offset)
                            dayCell(d)
                        }
                    }
                }

                InfoBanner(
                    title: "원터치 차단",
                    message: "버튼을 터치하여 실시간으로 예약을 차단하거나 해제할 수 있습니다. 차단된 시간은 고객 앱에서 예약 불가로 표시됩니다."
                )

                HStack {
                    Text("\(selectedDayLabel) 타임라인")
                        .font(.headlineSM())
                        .foregroundStyle(AppColors.ink)
                    Spacer()
                    HStack(spacing: 14) {
                        HStack(spacing: 4) {
                            Circle().fill(AppColors.white)
                                .frame(width: 10, height: 10)
                                .overlay(Circle().stroke(AppColors.borderStrong, lineWidth: 1))
                            Text("예약 가능").font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                        }
                        HStack(spacing: 4) {
                            Circle().fill(AppColors.danger).frame(width: 10, height: 10)
                            Text("차단됨").font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                        }
                    }
                }

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 30)
                } else if let errorMessage {
                    Text(errorMessage).font(.bodyMD()).foregroundStyle(AppColors.danger)
                } else {
                    ScrollView {
                        let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10),
                                    GridItem(.flexible(), spacing: 10),
                                    GridItem(.flexible(), spacing: 10)]
                        LazyVGrid(columns: cols, spacing: 10) {
                            ForEach(slots.indices, id: \.self) { i in
                                timeSlotCell(slots[i]) {
                                    toggle(at: i)
                                }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 18)

            Button {
                Task { await save() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "tray.and.arrow.down")
                    Text(isSaving ? "저장 중..." : "변경사항 저장")
                }
                .font(.titleMD())
                .foregroundStyle(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(AppColors.primaryDeep)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(isSaving)
            .offset(x: 100, y: 280)
            .shadow(color: AppColors.primaryDeep.opacity(0.5), radius: 3, x: 0, y: 2)
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationTitle("영업 시간표 관리")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .onChange(of: selectedDate) { _, _ in
            Task { await load() }
        }
    }

    private func dayCell(_ d: Date) -> some View {
        let isSelected = Calendar.current.isDate(d, inSameDayAs: selectedDate)
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "E"
        let dayNum = Calendar.current.component(.day, from: d)
        return Button { selectedDate = d } label: {
            VStack(spacing: 6) {
                Text(f.string(from: d)).font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                Text("\(dayNum)").font(.headlineSM()).foregroundStyle(AppColors.ink)
            }
            .frame(width: 56, height: 60)
            .background(isSelected ? AppColors.primary : AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - 백엔드 연동
    private func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let dto = try await ConnectAPI.availability(
                ownerId: appState.ownerId,
                storeId: appState.ownerStoreId,
                date: APIDateFormat.date.string(from: selectedDate)
            )
            slots = dto.slots.map { $0.toTimeSlot() }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        let blocked = slots.filter { $0.state == .blocked }.map { $0.rawTime }
        do {
            let body = TimeBlockUpdateRequestBody(
                storeId: appState.ownerStoreId,
                date: APIDateFormat.date.string(from: selectedDate),
                blockedSlots: blocked
            )
            let dto = try await ConnectAPI.replaceBlockedSlots(ownerId: appState.ownerId, body)
            slots = dto.slots.map { $0.toTimeSlot() }
            dismiss()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func toggle(at index: Int) {
        var s = slots[index]
        switch s.state {
        case .available: s.state = .blocked
        case .blocked:   s.state = .available
        case .reserved, .closed: break
        }
        slots[index] = s
    }

    @ViewBuilder
    private func timeSlotCell(_ slot: TimeSlot, onTap: @escaping () -> Void) -> some View {
        let isClosed = slot.state == .closed
        let isBlocked = slot.state == .blocked
        let isReserved = slot.state == .reserved

        Button(action: { if !isClosed && !isReserved { onTap() } }) {
            VStack(alignment: .leading, spacing: 6) {
                Text(slot.label)
                    .font(.headlineSM())
                    .foregroundStyle(isClosed ? AppColors.neutral : (isBlocked ? .white : AppColors.ink))
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isClosed ? AppColors.surfaceContainerLow
                       : (isBlocked ? AppColors.danger : (isReserved ? AppColors.chipBG : AppColors.white)))
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .stroke(isBlocked ? AppColors.danger : AppColors.borderStrong, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(isClosed || isReserved)
    }
}

#Preview {
    NavigationStack { TimeBlockView() }
        .environment(AppState())
}
