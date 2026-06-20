import SwiftUI

struct MyPageView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    // 프로필 카드 — 누르면 개인정보 수정으로 이동
                    NavigationLink {
                        ProfileEditView()
                    } label: {
                        HStack(spacing: 14) {
                            profileAvatar()
                                .frame(width: 64, height: 64)
                                .clipShape(Circle())

                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 6) {
                                    Text(affiliationLabel)
                                        .font(.bodyLG())
                                        .foregroundStyle(AppColors.inkSecondary)
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundStyle(AppColors.primaryDeep)
                                        .font(.system(size: 12))
                                }
                                Text(nameLabel)
                                    .font(.headlineSM())
                                    .foregroundStyle(AppColors.ink)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(AppColors.inkSecondary)
                        }
                        .padding(16)
                        .background(AppColors.white)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                                .stroke(AppColors.borderStrong, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)

                    // 개인정보 수정
                    NavigationLink {
                        ProfileEditView()
                    } label: {
                        menuRow(icon: "person.text.rectangle", title: "개인정보 수정")
                    }
                    .buttonStyle(.plain)

                    menuRow(icon: "creditcard", title: "결제 수단 관리")
                    menuRow(icon: "doc.text", title: "이용 약관")
                    menuRow(icon: "questionmark.circle", title: "도움말 / FAQ")

                    Spacer().frame(height: 12)

                    Button { appState.logout() } label: {
                        Text("로그아웃")
                            .foregroundStyle(AppColors.danger)
                    }
                    .buttonStyle(GhostButtonStyle())
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
            }
            .background(AppColors.surface.ignoresSafeArea())
            .navigationTitle("마이페이지")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - Profile helpers

    private var affiliationLabel: String {
        let school = appState.schoolName.isEmpty ? "연세대학교" : appState.schoolName
        let dept = appState.departmentName.isEmpty ? "경영학과" : appState.departmentName
        return "\(school) \(dept)"
    }

    private var nameLabel: String {
        let pos = appState.position.isEmpty ? "부회장" : appState.position
        let name = appState.realName.isEmpty ? "김재원" : appState.realName
        return "\(pos) \(name)"
    }

    @ViewBuilder
    private func profileAvatar() -> some View {
        if let data = appState.profileImageData, let img = UIImage(data: data) {
            Image(uiImage: img)
                .resizable()
                .scaledToFill()
        } else {
            ZStack {
                Circle().fill(AppColors.primary)
                Text(appState.realName.isEmpty ? "원" : String(appState.realName.prefix(1)))
                    .font(.headlineLG())
                    .foregroundStyle(AppColors.ink)
            }
        }
    }

    private func menuRow(icon: String, title: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .foregroundStyle(AppColors.ink)
                .frame(width: 28)
            Text(title)
                .font(.titleMD())
                .foregroundStyle(AppColors.ink)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(AppColors.inkSecondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
    }
}

#Preview {
    MyPageView()
        .environment(AppState())
}
