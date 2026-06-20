import SwiftUI
import UIKit

struct BookerTabView: View {
    @Environment(AppState.self) private var appState

    init() {
        // 탭바 배경: white
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.white
        appearance.shadowColor = UIColor(white: 0.92, alpha: 1)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some View {
        // @Observable 모델의 프로퍼티를 binding으로 쓰기 위한 @Bindable 래핑
        @Bindable var bindableState = appState

        TabView(selection: $bindableState.selectedBookerTab) {
            BookerHomeView()
                .tabItem {
                    Label("홈", systemImage: "house.fill")
                }
                .tag(0)

            NavigationStack { FavoritesView() }
                .tabItem {
                    Label("찜", systemImage: "heart.fill")
                }
                .tag(1)

            MyReservationsView()
                .tabItem {
                    Label("내 예약", systemImage: "calendar")
                }
                .tag(2)

            MyPageView()
                .tabItem {
                    Label("마이페이지", systemImage: "person.circle")
                }
                .tag(3)
        }
        .tint(AppColors.primaryDeep)
    }
}

#Preview {
    BookerTabView()
        .environment(AppState())
}
