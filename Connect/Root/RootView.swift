import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var appState = appState
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
}

#Preview {
    RootView()
        .environment(AppState())
}
