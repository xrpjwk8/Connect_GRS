import SwiftUI

struct OwnerTabView: View {
    @State private var selectedTab: Int = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            OwnerDashboardView()
                .tabItem { Label("대시보드", systemImage: "square.grid.2x2") }
                .tag(0)

            ReservationCalendarView()
                .tabItem { Label("예약 관리", systemImage: "calendar") }
                .tag(1)

            SalesView()
                .tabItem { Label("매출 현황", systemImage: "chart.bar.xaxis") }
                .tag(2)

            StoreProfileView()
                .tabItem { Label("설정", systemImage: "gearshape") }
                .tag(3)
        }
        .tint(AppColors.primaryDeep)
    }
}

#Preview {
    OwnerTabView()
        .environment(AppState())
}
