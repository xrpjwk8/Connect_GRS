import SwiftUI

// _12 — 예약자 홈
struct BookerHomeView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedCategory: String = "전체"
    @State private var showFilter: Bool = false
    @State private var navigateToResults: Bool = false

    /// 헤더 좌상단 위치 라벨. 가입 시 고른 학교가 있으면 "서울 · {학교}"로
    private var locationLabel: String {
        let school = appState.schoolName.trimmingCharacters(in: .whitespaces)
        return school.isEmpty ? "서울" : "서울 · \(school)"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // 헤더
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundStyle(AppColors.primaryDeep)
                        Text(locationLabel)
                            .font(.titleMD())
                            .foregroundStyle(AppColors.ink)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(AppColors.inkSecondary)
                    }
                    Spacer()
                    Image(systemName: "bell")
                        .foregroundStyle(AppColors.ink)
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 12)

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // 검색바 — 누르면 필터페이지가 시트로 열림
                        Button {
                            showFilter = true
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "magnifyingglass")
                                    .foregroundStyle(AppColors.inkSecondary)
                                Text("어떤 단체석을 찾고 계세요?")
                                    .font(.bodyLG())
                                    .foregroundStyle(AppColors.neutral)
                                Spacer()
                                Image(systemName: "slider.horizontal.3")
                                    .foregroundStyle(AppColors.inkSecondary)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 14)
                            .background(AppColors.chipBG)
                            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .navigationDestination(isPresented: $navigateToResults) {
                            SearchResultsView()
                        }

                        // 카테고리 칩
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(MockData.categories, id: \.self) { c in
                                    ChipButton(title: c, isSelected: c == selectedCategory) {
                                        selectedCategory = c
                                    }
                                }
                            }
                        }

                        // ───────────────────────────────────────────
                        // (요청에 따라 이번주 추천 배너 / 가까운 단체석 섹션 제거)
                        // ───────────────────────────────────────────

                        // 비어 있는 영역의 가벼운 안내 (UX상 휑함 방지)
                        VStack(spacing: 8) {
                            Image(systemName: "magnifyingglass.circle")
                                .font(.system(size: 36))
                                .foregroundStyle(AppColors.inkSecondary)
                            Text("위 검색창을 눌러\n조건에 맞는 단체석을 찾아보세요")
                                .font(.bodyLG())
                                .foregroundStyle(AppColors.inkSecondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 8)
                }
            }
            .background(AppColors.surface.ignoresSafeArea())
            .sheet(isPresented: $showFilter) {
                SearchFilterView { filter in
                    // 필터 전체를 전역 상태에 저장 → 결과 화면 헤더 + 가게 상세 ±1일 기준
                    appState.lastSearchFilter = filter
                    appState.selectedSearchDate = filter.date
                    showFilter = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        navigateToResults = true
                    }
                }
                .presentationDetents([.large])
            }
        }
    }
}

#Preview {
    BookerHomeView()
        .environment(AppState())
}
