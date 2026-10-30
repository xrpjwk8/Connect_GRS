import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var appState = appState
        Group {
            switch appState.route {
            case .onboarding:
                NavigationStack(path: $appState.onboardingPath) {
                    RoleSelectionView()
                        .navigationBarHidden(true)
                        .navigationDestination(for: AppState.OnboardingDestination.self) { dest in
                            switch dest {
                            case .bookerSignUp: BookerSignUpView()
                            case .ownerSignUp:  OwnerSignUpView()
                            }
                        }
                }
            case .bookerTabs:
                BookerTabView()
            case .ownerTabs:
                OwnerTabView()
            }
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            #if DEBUG
            if APIConfig.isOfflinePreview {
                Text("개발 미리보기 · 입력 없이 가입 가능 · 실제 가입/예약 아님")
                    .font(.caption)
                    .foregroundStyle(AppColors.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(AppColors.primaryDim)
            }
            #endif
        }
    }
}

#Preview {
    RootView()
        .environment(AppState())
}
