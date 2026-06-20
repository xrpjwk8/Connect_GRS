import SwiftUI

// _1 — 검색 결과
struct SearchResultsView: View {
    @Environment(AppState.self) private var appState
    @State private var showFilter = false

    /// 필터 조건을 "지역 · M월 d일 · N명 · 시간" 형태로 포맷
    private var filterSummary: String {
        guard let f = appState.lastSearchFilter else {
            return "검색 조건이 설정되지 않았어요"
        }
        let dateFmt = DateFormatter()
        dateFmt.locale = Locale(identifier: "ko_KR")
        dateFmt.dateFormat = "M월 d일"
        let dateStr = dateFmt.string(from: f.date)

        var parts: [String] = []
        if !f.region.isEmpty { parts.append(f.region) }
        parts.append(dateStr)
        parts.append("\(f.people)명")
        if f.time != "상관없음" && !f.time.isEmpty {
            parts.append(f.time)
        }
        return parts.joined(separator: " · ")
    }

    var body: some View {
        VStack(spacing: 0) {
            // 검색 컨텍스트 헤더
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14))
                        .foregroundStyle(AppColors.inkSecondary)
                    Text(filterSummary)
                        .font(.bodyLG())
                        .foregroundStyle(AppColors.ink)
                        .lineLimit(1)
                }
                Spacer()
                Button { showFilter = true } label: {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundStyle(AppColors.ink)
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 10)
            .background(AppColors.white)
            .overlay(Rectangle().fill(AppColors.borderStrong).frame(height: 1), alignment: .bottom)

            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("검색 결과 (\(MockData.searchResults.count))")
                        .font(.headlineMD())
                        .foregroundStyle(AppColors.ink)
                        .padding(.top, 8)

                    ForEach(MockData.searchResults) { store in
                        NavigationLink {
                            StoreDetailView(store: store)
                        } label: {
                            StoreCard(store: store)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 8)
            }
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationTitle("Connect")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showFilter) {
            SearchFilterView { filter in
                appState.lastSearchFilter = filter
                appState.selectedSearchDate = filter.date
            }
        }
    }
}

#Preview {
    NavigationStack { SearchResultsView() }
        .environment(AppState())
}
