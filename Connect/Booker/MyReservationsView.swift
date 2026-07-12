import SwiftUI

// _3 — 내 예약
struct MyReservationsView: View {
    enum Filter: String, CaseIterable, Identifiable {
        case ongoing = "진행 중", done = "완료", cancelled = "취소"
        var id: String { rawValue }
    }

    @Environment(AppState.self) private var appState
    @State private var filter: Filter = .ongoing
    @State private var editingReservation: MyReservation? = nil
    @State private var cancelingReservation: MyReservation? = nil
    @State private var isLoading = false

    // MARK: - 필터별 목록 (날짜 오름차순)
    private var pendingList: [MyReservation] {
        appState.myReservations
            .filter { $0.status == .pending }
            .sorted(by: dateAscending)
    }
    private var confirmedList: [MyReservation] {
        appState.myReservations
            .filter { $0.status == .confirmed }
            .sorted(by: dateAscending)
    }
    private var completedList: [MyReservation] {
        appState.myReservations
            .filter { $0.status == .completed }
            .sorted(by: dateAscending)
    }
    private var cancelledByUserList: [MyReservation] {
        appState.myReservations
            .filter { $0.status == .cancelled }
            .sorted(by: dateAscending)
    }
    private var rejectedList: [MyReservation] {
        appState.myReservations
            .filter { $0.status == .rejected }
            .sorted(by: dateAscending)
    }

    private func dateAscending(_ a: MyReservation, _ b: MyReservation) -> Bool {
        switch (a.dateValue, b.dateValue) {
        case (let da?, let db?): return da < db
        case (nil, _?):          return false
        case (_?, nil):          return true
        default:                 return false
        }
    }

    // MARK: - Body
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // 상단 헤더
                HStack {
                    Text("내 예약")
                        .font(.headlineLG())
                        .foregroundStyle(AppColors.primaryDeep)
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 10)

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        // 필터 칩
                        HStack(spacing: 10) {
                            ForEach(Filter.allCases) { f in
                                Button { filter = f } label: {
                                    Text(f.rawValue)
                                        .font(.bodyLG())
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .foregroundStyle(filter == f ? AppColors.white : AppColors.ink)
                                        .background(filter == f ? AppColors.ink : AppColors.white)
                                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous)
                                                .stroke(AppColors.borderStrong, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                            Spacer()
                        }

                        switch filter {
                        case .ongoing:   ongoingContent
                        case .done:      doneContent
                        case .cancelled: cancelledContent
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 8)
                }
            }
            .background(AppColors.surface.ignoresSafeArea())
            // 예약 수정 시트
            .sheet(item: $editingReservation) { res in
                ReservationEditView(reservationId: res.id)
            }
            // 신청 취소 확인 알림창
            .alert(
                "신청을 취소하시겠습니까?",
                isPresented: Binding(
                    get: { cancelingReservation != nil },
                    set: { if !$0 { cancelingReservation = nil } }
                ),
                presenting: cancelingReservation
            ) { res in
                Button("예, 취소합니다", role: .destructive) {
                    let target = res
                    cancelingReservation = nil
                    Task { await cancel(target) }
                }
                Button("아니요", role: .cancel) {
                    cancelingReservation = nil
                }
            } message: { _ in
                Text("이 예약 신청을 정말 취소하시겠습니까? 취소 후에는 되돌릴 수 없어요.")
            }
            .task { await loadReservations() }
        }
    }

    // MARK: - 백엔드 연동
    private func loadReservations() async {
        isLoading = true
        defer { isLoading = false }
        if let dtos = try? await ConnectAPI.reservations(bookerId: appState.bookerId, statusGroup: nil) {
            appState.myReservations = dtos.map { $0.toMyReservation() }
        }
    }

    private func cancel(_ res: MyReservation) async {
        if let updated = try? await ConnectAPI.cancelReservation(reservationId: res.id),
           let idx = appState.myReservations.firstIndex(where: { $0.id == res.id }) {
            appState.myReservations[idx] = updated.toMyReservation()
        }
    }

    // MARK: - 진행 중 탭
    @ViewBuilder
    private var ongoingContent: some View {
        if pendingList.isEmpty && confirmedList.isEmpty {
            emptyState(
                icon: "calendar.badge.exclamationmark",
                message: "진행 중인 예약이 없어요",
                sub: "홈에서 단체석을 검색하고 예약을 신청해보세요"
            )
        } else {
            if !pendingList.isEmpty {
                sectionHeader("점주 응답 대기 중")
                ForEach(pendingList) { res in reservationCard(res) }
            }
            if !confirmedList.isEmpty {
                sectionHeader("확정된 예약")
                ForEach(confirmedList) { res in reservationCard(res) }
            }
        }
    }

    // MARK: - 완료 탭
    @ViewBuilder
    private var doneContent: some View {
        if completedList.isEmpty {
            emptyState(
                icon: "checkmark.circle",
                message: "완료된 예약이 없어요",
                sub: "성사된 예약이 끝나면 여기에 기록돼요"
            )
        } else {
            VStack(spacing: 10) {
                ForEach(completedList) { res in completedRow(res) }
            }
        }
    }

    // MARK: - 취소 탭
    @ViewBuilder
    private var cancelledContent: some View {
        if cancelledByUserList.isEmpty && rejectedList.isEmpty {
            emptyState(
                icon: "xmark.circle",
                message: "취소된 예약이 없어요",
                sub: "취소하거나 거절당한 예약이 생기면 여기서 확인할 수 있어요"
            )
        } else {
            if !cancelledByUserList.isEmpty {
                sectionHeader("내가 취소한 예약")
                VStack(spacing: 10) {
                    ForEach(cancelledByUserList) { res in cancelledRow(res) }
                }
            }
            if !rejectedList.isEmpty {
                sectionHeader("점주가 거절한 예약")
                VStack(spacing: 10) {
                    ForEach(rejectedList) { res in cancelledRow(res) }
                }
            }
        }
    }

    // MARK: - 섹션 헤더
    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.headlineMD())
            .foregroundStyle(AppColors.ink)
            .padding(.top, 4)
    }

    // MARK: - 빈 상태
    private func emptyState(icon: String, message: String, sub: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 36))
                .foregroundStyle(AppColors.inkSecondary)
            Text(message)
                .font(.titleMD())
                .foregroundStyle(AppColors.ink)
            Text(sub)
                .font(.bodyMD())
                .foregroundStyle(AppColors.inkSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - 진행 중 카드 (pending / confirmed 공용)
    @ViewBuilder
    private func reservationCard(_ res: MyReservation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        if res.status == .pending {
                            TagLabel(text: "점주 응답 대기", color: AppColors.ink, textColor: AppColors.white)
                        } else {
                            TagLabel(text: "확정", color: AppColors.primaryDeep, textColor: AppColors.white)
                        }
                        Text(res.dateLabel)
                            .font(.bodyMD())
                            .foregroundStyle(AppColors.inkSecondary)
                    }
                    Text(res.storeName)
                        .font(.headlineSM())
                        .foregroundStyle(AppColors.ink)
                }
                Spacer()
                RoundedRectangle(cornerRadius: 10)
                    .fill(LinearGradient(colors: [Color(hex: 0x3D3D3D), Color(hex: 0x1B1C1C)],
                                         startPoint: .top, endPoint: .bottom))
                    .frame(width: 64, height: 64)
                    .overlay(
                        Image(systemName: res.imageSymbol)
                            .foregroundStyle(.white.opacity(0.7))
                    )
            }

            HStack(spacing: 14) {
                Label("\(res.people)명", systemImage: "person.2")
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.ink)
                if let b = res.budget {
                    HStack(spacing: 4) {
                        Image(systemName: "wonsign.circle")
                        Text("예산 \(b.formatted())원")
                    }
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.ink)
                }
                Spacer()
//                Text("abcdefghabcde")
                Label("\(res.people)명", systemImage: "person.2")
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.ink)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(AppColors.chipBG)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            HStack(spacing: 10) {
                if res.status == .confirmed {
                    Button { } label: { Text("위치 안내") }
                        .buttonStyle(LimeButtonStyle())
                } else {
                    Button {
                        editingReservation = res
                    } label: {
                        Text("예약 수정")
                    }
                    .buttonStyle(GhostButtonStyle())

                    Button {
                        cancelingReservation = res
                    } label: {
                        Text("신청 취소").foregroundStyle(AppColors.danger)
                    }
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .background(AppColors.white)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                            .stroke(AppColors.danger, lineWidth: 1)
                    )
                }
            }
        }
        .appCard()
    }

    // MARK: - 완료 행
    @ViewBuilder
    private func completedRow(_ res: MyReservation) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(AppColors.chipBG)
                    .frame(width: 44, height: 44)
                Image(systemName: res.imageSymbol)
                    .foregroundStyle(AppColors.inkSecondary)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(res.storeName).font(.titleMD()).foregroundStyle(AppColors.ink)
                Text(res.dateLabel).font(.bodyMD()).foregroundStyle(AppColors.inkSecondary)
            }
            Spacer()
            TagLabel(text: "완료", color: AppColors.chipBG, textColor: AppColors.inkSecondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
    }

    // MARK: - 취소 / 거절 행
    @ViewBuilder
    private func cancelledRow(_ res: MyReservation) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(AppColors.chipBG)
                    .frame(width: 44, height: 44)
                Image(systemName: res.imageSymbol)
                    .foregroundStyle(AppColors.inkSecondary)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(res.storeName).font(.titleMD()).foregroundStyle(AppColors.ink)
                Text(res.dateLabel).font(.bodyMD()).foregroundStyle(AppColors.inkSecondary)
            }
            Spacer()
            TagLabel(
                text: res.status == .rejected ? "점주 거절" : "취소",
                color: AppColors.dangerSoft,
                textColor: AppColors.danger
            )
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
    }
}

#Preview {
    MyReservationsView()
        .environment(AppState())
}
