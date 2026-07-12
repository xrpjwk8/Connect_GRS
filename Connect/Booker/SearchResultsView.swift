import SwiftUI

// _1 — 검색 결과
struct SearchResultsView: View {
    @Environment(AppState.self) private var appState
    @State private var showFilter = false
    @State private var stores: [Store] = []
    @State private var isLoading = false
    @State private var errorMessage: String? = nil

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
                    Text("검색 결과 (\(stores.count))")
                        .font(.headlineMD())
                        .foregroundStyle(AppColors.ink)
                        .padding(.top, 8)

                    if isLoading {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                    } else if let errorMessage {
                        Text(errorMessage)
                            .font(.bodyMD())
                            .foregroundStyle(AppColors.danger)
                            .padding(.top, 20)
                    } else if stores.isEmpty {
                        Text("조건에 맞는 매장이 없어요")
                            .font(.bodyMD())
                            .foregroundStyle(AppColors.inkSecondary)
                            .padding(.top, 20)
                    }

                    ForEach(stores) { store in
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
        .task { await loadStores() }
        .onChange(of: appState.lastSearchFilter) { _, _ in
            Task { await loadStores() }
        }
    }

    private func loadStores() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let dtos: [StoreDTO]
            if let filter = appState.lastSearchFilter {
                dtos = try await ConnectAPI.searchStores(
                    bookerId: appState.bookerId,
                    region: filter.region,
                    category: filter.category == "전체" ? nil : filter.category,
                    people: filter.people > 0 ? filter.people : nil,
                    date: APIDateFormat.date.string(from: filter.date),
                    time: (filter.time.isEmpty || filter.time == "상관없음") ? nil : filter.time
                )
            } else {
                dtos = try await ConnectAPI.featuredStores(bookerId: appState.bookerId, region: nil)
            }
            stores = dtos.map { $0.toStore() }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { SearchResultsView() }
        .environment(AppState())
}
