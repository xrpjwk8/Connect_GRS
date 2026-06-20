import SwiftUI

// 매출 현황 — 디자인 시안에 별도 정밀 화면이 없어 디자인 시스템에 맞춘 placeholder
struct SalesView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        Text("매출 현황")
                            .font(.headlineLG())
                            .foregroundStyle(AppColors.ink)
                        Spacer()
                        Image(systemName: "calendar")
                            .foregroundStyle(AppColors.inkSecondary)
                    }

                    // 이번 달
                    VStack(alignment: .leading, spacing: 8) {
                        Text("이번 달 매출").font(.bodyLG()).foregroundStyle(AppColors.inkSecondary)
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("1,820")
                                .font(.system(size: 42, weight: .heavy))
                            Text("만원").font(.titleMD()).foregroundStyle(AppColors.inkSecondary)
                        }
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.up.right")
                            Text("+22% vs 지난달")
                        }
                        .font(.labelMD())
                        .foregroundStyle(AppColors.primaryDeep)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(18)
                    .background(AppColors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))

                    HStack(spacing: 12) {
                        kpi("총 단체 예약", "32건")
                        kpi("평균 객단가", "₩28,000")
                    }
                    HStack(spacing: 12) {
                        kpi("노쇼율", "1.2%", positive: false)
                        kpi("재방문율", "37%")
                    }

                    Text("주간 매출 추이")
                        .font(.headlineSM())
                        .foregroundStyle(AppColors.ink)
                        .padding(.top, 6)

                    weeklyBarChart()
                        .appCard()
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 14)
            }
            .background(AppColors.surface.ignoresSafeArea())
        }
    }

    private func kpi(_ title: String, _ value: String, positive: Bool = true) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
            Text(value).font(.headlineSM()).foregroundStyle(AppColors.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
    }

    private func weeklyBarChart() -> some View {
        let values: [(String, CGFloat)] = [
            ("월", 0.4), ("화", 0.6), ("수", 0.5), ("목", 0.7),
            ("금", 0.95), ("토", 0.85), ("일", 0.55)
        ]
        return HStack(alignment: .bottom, spacing: 10) {
            ForEach(values, id: \.0) { v in
                VStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(v.1 > 0.85 ? AppColors.primary : AppColors.surfaceContainerHigh)
                        .frame(height: 100 * v.1)
                    Text(v.0).font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(height: 140)
    }
}

#Preview {
    SalesView()
}
