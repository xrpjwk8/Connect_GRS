import SwiftUI

// _9 / _10 / _15 화면 — 역할 선택
struct RoleSelectionView: View {
    @Environment(AppState.self) private var appState
    @State private var selected: UserRole? = nil

    var body: some View {
        ZStack(alignment: .bottom) {
            AppColors.surface.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("환영합니다! 어떤 서비스가 필요하신가요?")
                        .font(.headlineLG())
                        .foregroundStyle(AppColors.ink)
                        .multilineTextAlignment(.leading)
                    Text("Connect에서 원하시는 역할을 선택해주세요.")
                        .font(.bodyLG())
                        .foregroundStyle(AppColors.inkSecondary)
                }
                .padding(.top, 8)

                roleCard(role: .booker,
                         icon: "person.3.fill",
                         title: "예약자로 시작하기",
                         description: "단체석을 찾고 예약하고 싶어요. 다양한 모임 장소를 쉽고 빠르게 검색해보세요.")

                roleCard(role: .owner,
                         icon: "storefront",
                         title: "점주로 시작하기",
                         description: "우리 가게 단체 예약을 관리하고 싶어요. 효율적인 매장 운영과 예약 스케줄 관리를 시작하세요.")

                Spacer()
            }
            .padding(.horizontal, 18)
            .padding(.top, 24)
            .padding(.bottom, 120)

            VStack(spacing: 12) {
                Button {
                    guard let selected else { return }
                    switch selected {
                    case .booker: appState.goToBookerSignUp()
                    case .owner: appState.goToOwnerSignUp()
                    }
                } label: {
                    Text("다음 단계 진행하기")
                }
                .buttonStyle(LimeButtonStyle())
                .disabled(selected == nil)
                .opacity(selected == nil ? 0.4 : 1)

                HStack(spacing: 6) {
                    Text("이미 계정이 있으신가요?")
                        .font(.bodyMD())
                        .foregroundStyle(AppColors.inkSecondary)
                    Button("로그인") { }
                        .font(.bodyLG())
                        .foregroundStyle(AppColors.ink)
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 16)
        }
    }
        
    // 네비게이션 헬퍼 (재사용)
    private func goToSignUp(for role: UserRole) {
        switch role {
        case .booker: appState.goToBookerSignUp()
        case .owner: appState.goToOwnerSignUp()
        }
    }

    @ViewBuilder
    private func roleCard(role: UserRole, icon: String, title: String, description: String) -> some View {
        let isSelected = (selected == role)
        let bgColor: Color = (role == .booker && isSelected) ? AppColors.primary : AppColors.white

        VStack(alignment: .leading, spacing: 14) {
            ZStack {
                Circle()
                    .fill(isSelected ? AppColors.ink : AppColors.chipBG)
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .foregroundStyle(isSelected ? AppColors.white : AppColors.inkSecondary)
                    .font(.system(size: 18, weight: .semibold))
            }

            Text(title)
                .font(.headlineMD())
                .foregroundStyle(AppColors.ink)

            Text(description)
                .font(.bodyLG())
                .foregroundStyle(AppColors.inkSecondary)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            HStack {
                Spacer()
                Button {
                    goToSignUp(for: role)        // ← 화살표만 누르면 바로 이동
                } label: {
                    ZStack {
                        Circle()
                            .fill(isSelected ? AppColors.primaryDeep : AppColors.surfaceContainerLow)
                            .frame(width: 36, height: 36)
                        Image(systemName: "arrow.right")
                            .foregroundStyle(isSelected ? AppColors.white : AppColors.inkSecondary)
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(20)
        .background(bgColor)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous)
                .stroke(isSelected ? AppColors.primary : AppColors.borderStrong, lineWidth: isSelected ? 2 : 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .animation(.easeInOut(duration: 0.2), value: selected)
        .onTapGesture {
            selected = role               // ← 카드 본문 탭 = 선택만
        }
    }
}

#Preview {
    RoleSelectionView()
        .environment(AppState())
}
