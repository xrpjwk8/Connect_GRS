import SwiftUI

// _5 — 점주 홈/대시보드
struct OwnerDashboardView: View {
    @Environment(AppState.self) private var appState
    @State private var requests: [ReservationRequest] = []
    @State private var storeName: String = "캠퍼스 포차"
    @State private var weeklyRevenueManWon: Int = 0
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // 헤더
                    HStack {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundStyle(AppColors.primaryDeep)
                        Spacer()
                        Text("Connect")
                            .font(.headlineLG())
                            .foregroundStyle(AppColors.primaryDeep)
                        Spacer()
                        Image(systemName: "bell").foregroundStyle(AppColors.ink)
                    }
                    .padding(.bottom, 4)

                    HStack(spacing: 6) {
                        Image(systemName: "storefront")
                            .foregroundStyle(AppColors.inkSecondary)
                        Text(storeName)
                            .font(.bodyLG())
                            .foregroundStyle(AppColors.inkSecondary)
                    }

                    Text("안녕하세요,\n지호님.")
                        .font(.displayHero())
                        .foregroundStyle(AppColors.ink)
                        .lineSpacing(2)

                    // KPI 2개
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("이번 주 단체 예약 매출")
                                    .font(.bodyLG())
                                    .foregroundStyle(AppColors.inkSecondary)
                                Spacer()
                                Image(systemName: "creditcard")
                                    .foregroundStyle(AppColors.inkSecondary)
                            }
                            HStack(alignment: .firstTextBaseline, spacing: 4) {
                                Text("\(weeklyRevenueManWon)")
                                    .font(.system(size: 36, weight: .heavy))
                                    .foregroundStyle(AppColors.ink)
                                Text("만원")
                                    .font(.titleMD())
                                    .foregroundStyle(AppColors.ink)
                            }
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(AppColors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))

                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("대기 요청")
                                    .font(.bodyLG())
                                    .foregroundStyle(AppColors.inkSecondary)
                                Spacer()
                                Circle().fill(AppColors.danger).frame(width: 6, height: 6)
                            }
                            HStack(alignment: .firstTextBaseline, spacing: 4) {
                                Text("\(requests.count)")
                                    .font(.system(size: 36, weight: .heavy))
                                    .foregroundStyle(AppColors.ink)
                                Text("건")
                                    .font(.titleMD())
                                    .foregroundStyle(AppColors.inkSecondary)
                            }
                            Button { } label: {
                                HStack {
                                    Text("확인하기")
                                    Image(systemName: "arrow.right")
                                }
                                .font(.bodyLG())
                                .foregroundStyle(AppColors.ink)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(AppColors.white)
                                .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous)
                                        .stroke(AppColors.borderStrong, lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(AppColors.white)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                                .stroke(AppColors.borderStrong, lineWidth: 1)
                        )
                    }

                    HStack {
                        Text("신규 예약 요청")
                            .font(.headlineMD())
                            .foregroundStyle(AppColors.ink)
                        TagLabel(text: "\(requests.count)", color: AppColors.danger, textColor: .white)
                        Spacer()
                    }

                    if isLoading {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, 20)
                    }

                    VStack(spacing: 12) {
                        ForEach(requests) { req in
                            requestCard(req)
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 8)
            }
            .background(AppColors.surface.ignoresSafeArea())
            .task { await loadDashboard() }
            .refreshable { await loadDashboard() }
        }
    }

    // MARK: - 백엔드 연동
    private func loadDashboard() async {
        isLoading = true
        defer { isLoading = false }
        if let dto = try? await ConnectAPI.ownerDashboard(ownerId: appState.ownerId) {
            storeName = dto.storeName
            weeklyRevenueManWon = dto.weeklyRevenueManWon
            requests = dto.pendingRequests.map { $0.toReservationRequest() }
        }
    }

    private func approve(_ reqId: UUID) async {
        _ = try? await ConnectAPI.approveReservation(ownerId: appState.ownerId, reservationId: reqId)
        await loadDashboard()
    }

    private func reject(_ reqId: UUID) async {
        _ = try? await ConnectAPI.rejectReservation(ownerId: appState.ownerId, reservationId: reqId)
        await loadDashboard()
    }

    @ViewBuilder
    private func requestCard(_ req: ReservationRequest) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                ZStack {
                    Circle().fill(AppColors.surfaceContainer)
                        .frame(width: 44, height: 44)
                    Text(req.bookerName.prefix(1))
                        .font(.titleMD())
                        .foregroundStyle(AppColors.ink)
                }
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(req.bookerName)
                            .font(.titleMD())
                            .foregroundStyle(AppColors.ink)
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(AppColors.primaryDeep)
                            .font(.system(size: 11))
                    }
                    Text(req.bookerAffiliation)
                        .font(.bodyMD())
                        .foregroundStyle(AppColors.inkSecondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text(req.dateTimeLabel)
                        .font(.bodyMD())
                        .foregroundStyle(AppColors.inkSecondary)
                    Text("\(req.people)명")
                        .font(.headlineSM())
                        .foregroundStyle(AppColors.ink)
                }
            }

            Text("“\(req.message)”")
                .font(.bodyMD())
                .foregroundStyle(AppColors.inkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(AppColors.chipBG)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            HStack(spacing: 10) {
                Button {
                    Task { await reject(req.id) }
                } label: {
                    Text("거절")
                }
                .buttonStyle(GhostButtonStyle())
                Button {
                    Task { await approve(req.id) }
                } label: {
                    Text("수락")
                        .foregroundStyle(.white)
                }
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(AppColors.primaryDeep)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            }
        }
        .padding(14)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
        .overlay(
            Rectangle()
                .fill(AppColors.primaryDeep)
                .frame(width: 4)
                .clipShape(RoundedRectangle(cornerRadius: 2)),
            alignment: .leading
        )
    }
}

#Preview {
    OwnerDashboardView()
        .environment(AppState())
}
