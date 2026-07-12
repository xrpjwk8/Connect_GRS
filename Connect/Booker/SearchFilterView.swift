import SwiftUI

// 필터 적용 시 부모에게 전달할 결과
struct SearchFilter: Equatable {
    var region: String
    var category: String
    var date: Date
    var people: Int
    var time: String
}

// _7, _13 + 첨부 HTML — 검색 조건 필터 모달
struct SearchFilterView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var region: String = "신촌"
    @State private var category: String = "전체"
    @State private var date: Date = Date()
    @State private var peopleText: String = "25"
    @State private var time: String = "상관없음"

    // 백엔드 /api/meta/filters 로 채워짐 (실패 시 MockData 값으로 폴백)
    @State private var regionOptions: [String] = MockData.regions
    @State private var categoryOptions: [String] = MockData.categories
    @State private var timeOptions: [String] = MockData.timeOptions

    /// 부모로 결과 전달 콜백 (옵션)
    var onApply: ((SearchFilter) -> Void)? = nil

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        // 1) 지역 선택 - 4 column grid (첨부 HTML과 동일)
                        VStack(alignment: .leading, spacing: 14) {
                            Text("지역 선택")
                                .font(.headlineSM())
                                .foregroundStyle(AppColors.ink)

                            let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 4)
                            LazyVGrid(columns: cols, spacing: 8) {
                                ForEach(regionOptions, id: \.self) { r in
                                    Button { region = r } label: {
                                        Text(r)
                                            .font(.bodyMD())
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .foregroundStyle(region == r ? AppColors.onPrimary : AppColors.ink)
                                            .background(region == r ? AppColors.primary : AppColors.white)
                                            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                                                    .stroke(region == r ? AppColors.primary : AppColors.borderStrong,
                                                            lineWidth: 1)
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }

                        Divider()

                        // 1-1) 카테고리 선택
                        VStack(alignment: .leading, spacing: 14) {
                            Text("카테고리")
                                .font(.headlineSM())
                                .foregroundStyle(AppColors.ink)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(categoryOptions, id: \.self) { c in
                                        ChipButton(title: c, isSelected: c == category) {
                                            category = c
                                        }
                                    }
                                }
                            }
                        }

                        Divider()

                        // 2) 날짜 - 오늘 이후만 선택 가능
                        VStack(alignment: .leading, spacing: 14) {
                            Text("날짜")
                                .font(.headlineSM())
                                .foregroundStyle(AppColors.ink)
                            DatePicker(
                                "",
                                selection: $date,
                                in: startOfToday()...,
                                displayedComponents: [.date]
                            )
                            .datePickerStyle(.graphical)
                            .tint(AppColors.primaryDeep)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 8)
                            .background(AppColors.white)
                            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                                    .stroke(AppColors.borderStrong, lineWidth: 1)
                            )
                        }

                        Divider()

                        // 3) 인원 - 직접 숫자 입력 (stepper 제거)
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Text("인원")
                                    .font(.headlineSM())
                                    .foregroundStyle(AppColors.ink)
                                Spacer()
                                Text("단체 예약 (10명 이상)")
                                    .font(.bodyMD())
                                    .foregroundStyle(AppColors.primaryDeep)
                            }
                            HStack(spacing: 4) {
                                Spacer()
                                TextField("0", text: $peopleText)
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.trailing)
                                    .font(.system(size: 26, weight: .heavy))
                                    .foregroundStyle(AppColors.ink)
                                    .frame(width: 90)
                                    .onChange(of: peopleText) { _, new in
                                        // 숫자만 남기기
                                        let filtered = new.filter { $0.isNumber }
                                        if filtered != new { peopleText = filtered }
                                    }
                                Text("명")
                                    .font(.bodyLG())
                                    .foregroundStyle(AppColors.inkSecondary)
                                    .padding(.bottom, 2)
                                Spacer()
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 18)
                            .background(AppColors.white)
                            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                                    .stroke(AppColors.borderStrong, lineWidth: 1)
                            )
                        }

                        Divider()

                        // 4) 시간 (선택)
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Text("시간")
                                    .font(.headlineSM())
                                    .foregroundStyle(AppColors.ink)
                                Text("(선택)")
                                    .font(.bodyMD())
                                    .foregroundStyle(AppColors.inkSecondary)
                            }
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    ForEach(timeOptions, id: \.self) { t in
                                        Button {
                                            time = t
                                        } label: {
                                            Text(t)
                                                .font(.bodyMD())
                                                .padding(.horizontal, 18)
                                                .padding(.vertical, 10)
                                                .foregroundStyle(time == t ? AppColors.white : AppColors.ink)
                                                .background(time == t ? AppColors.ink : AppColors.white)
                                                .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous)
                                                        .stroke(time == t ? AppColors.ink : AppColors.borderStrong,
                                                                lineWidth: 1)
                                                )
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 18)
                }

                Button {
                    let result = SearchFilter(
                        region: region,
                        category: category,
                        date: date,
                        people: Int(peopleText) ?? 0,
                        time: time
                    )
                    onApply?(result)
                    dismiss()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                        Text("필터 적용하기")
                    }
                }
                .buttonStyle(LimeButtonStyle())
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
            }
            .background(AppColors.surface.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .foregroundStyle(AppColors.ink)
                    }
                }
                ToolbarItem(placement: .principal) {
                    Text("검색 조건")
                        .font(.titleMD())
                        .foregroundStyle(AppColors.ink)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("초기화") {
                        region = regionOptions.first ?? "신촌"
                        category = categoryOptions.first ?? "전체"
                        date = Date()
                        peopleText = "25"
                        time = timeOptions.first ?? "상관없음"
                    }
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.inkSecondary)
                }
            }
        }
        .task { await loadFilters() }
    }

    private func startOfToday() -> Date {
        Calendar.current.startOfDay(for: Date())
    }

    private func loadFilters() async {
        guard let meta = try? await ConnectAPI.fetchFilters() else { return }
        regionOptions = meta.regions
        categoryOptions = meta.categories
        timeOptions = ["상관없음"] + meta.timeOptions.filter { $0 != "상관없음" }
        if !regionOptions.contains(region), let first = regionOptions.first { region = first }
        if !categoryOptions.contains(category), let first = categoryOptions.first { category = first }
    }
}

#Preview {
    SearchFilterView()
}
