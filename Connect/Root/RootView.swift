import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        switch appState.route {
        case .roleSelection:
            RoleSelectionView()
        case .bookerSignUp:
            BookerSignUpView()
        case .ownerSignUp:
            OwnerSignUpView()
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
