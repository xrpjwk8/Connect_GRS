import SwiftUI

// 검색 탭의 진입 화면 — 필터를 모달로 띄움
struct BookerSearchView: View {
    @State private var showFilter: Bool = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("어디로 떠나실까요?")
                    .font(.headlineLG())
                    .foregroundStyle(AppColors.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Button {
                    showFilter = true
                } label: {
                    HStack {
                        Image(systemName: "slider.horizontal.3")
                            .foregroundStyle(AppColors.ink)
                        Text("필터로 단체석 찾기")
                            .font(.titleMD())
                            .foregroundStyle(AppColors.ink)
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

                Text("최근 검색")
                    .font(.headlineSM())
                    .foregroundStyle(AppColors.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 12)

                ForEach(["신촌 · 25명 · 19:00", "건대 · 12명 · 20:00", "혜화 · 30명 · 18:00"], id: \.self) { recent in
                    HStack {
                        Image(systemName: "clock.arrow.circlepath")
                            .foregroundStyle(AppColors.inkSecondary)
                        Text(recent)
                            .font(.bodyLG())
                            .foregroundStyle(AppColors.ink)
                        Spacer()
                        Image(systemName: "xmark")
                            .foregroundStyle(AppColors.neutral)
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal, 14)
                    .background(AppColors.white)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                }

                Spacer()
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .background(AppColors.surface.ignoresSafeArea())
            .sheet(isPresented: $showFilter) {
                SearchFilterView()
                    .presentationDetents([.large])
            }
        }
    }
}

#Preview {
    BookerSearchView()
}
