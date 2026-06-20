import SwiftUI

// MARK: - 상단 헤더 (홈 화면용)
struct ConnectHomeHeader: View {
    var body: some View {
        HStack {
            Image(systemName: "mappin.and.ellipse")
                .foregroundStyle(AppColors.primaryDeep)
                .font(.system(size: 18, weight: .bold))
            Spacer()
            Text("Connect")
                .font(.headlineLG())
                .foregroundStyle(AppColors.primaryDeep)
            Spacer()
            Image(systemName: "bell")
                .foregroundStyle(AppColors.ink)
                .font(.system(size: 18, weight: .regular))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
    }
}

// MARK: - 칩 (카테고리, 키워드)
struct ChipButton: View {
    let title: String
    let isSelected: Bool
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.bodyLG())
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .foregroundStyle(isSelected ? AppColors.ink : AppColors.inkSecondary)
                .background(isSelected ? AppColors.primary : AppColors.white)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous)
                        .stroke(isSelected ? AppColors.primaryDim : AppColors.borderStrong, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 단순 태그 (안내성)
struct TagLabel: View {
    let text: String
    var color: Color = AppColors.chipBG
    var textColor: Color = AppColors.inkSecondary

    var body: some View {
        Text(text)
            .font(.labelMD())
            .foregroundStyle(textColor)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color)
            .clipShape(Capsule())
    }
}

// MARK: - 별점
struct RatingView: View {
    let rating: Double
    let count: Int?

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(AppColors.primaryDeep)
            Text(String(format: "%.1f", rating))
                .font(.bodyLG())
                .foregroundStyle(AppColors.ink)
            if let count {
                Text("(\(count))")
                    .font(.bodyMD())
                    .foregroundStyle(AppColors.neutral)
            }
        }
    }
}

// MARK: - 가게 카드 (검색결과/홈)
struct StoreCard: View {
    let store: Store

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack(alignment: .topTrailing) {
                Rectangle()
                    .fill(LinearGradient(colors: [Color(hex: 0x3D3D3D), Color(hex: 0x1B1C1C)],
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(height: 140)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md))
                    .overlay(
                        Image(systemName: store.imageName)
                            .font(.system(size: 36))
                            .foregroundStyle(.white.opacity(0.6))
                    )
                HStack(spacing: 4) {
                    Image(systemName: store.isFavorite ? "heart.fill" : "heart")
                        .foregroundStyle(store.isFavorite ? AppColors.danger : .white)
                }
                .padding(10)
                .background(.black.opacity(0.35))
                .clipShape(Circle())
                .padding(10)
            }

            HStack {
                Text(store.name)
                    .font(.headlineSM())
                    .foregroundStyle(AppColors.ink)
                Spacer()
                RatingView(rating: store.rating, count: store.reviewCount)
            }

            HStack(spacing: 6) {
                Image(systemName: "person.2")
                    .font(.system(size: 11))
                    .foregroundStyle(AppColors.inkSecondary)
                Text("최대 \(store.maxCapacity)석")
                    .font(.bodyMD())
                    .foregroundStyle(AppColors.inkSecondary)

                Spacer()

                Text("₩\(store.pricePerPerson.formatted())~")
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.ink)
            }

            // 키워드 한 줄
            HStack(spacing: 6) {
                ForEach(store.keywords.prefix(3), id: \.self) { keyword in
                    TagLabel(text: keyword)
                }
                Spacer()
                TagLabel(text: "수락률 \(store.acceptanceRate)%",
                         color: AppColors.primary,
                         textColor: AppColors.ink)
            }
        }
        .appCard()
    }
}

// MARK: - 폼 라벨
struct FormLabel: View {
    let title: String
    var required: Bool = false
    var body: some View {
        HStack(spacing: 4) {
            Text(title)
                .font(.titleMD())
                .foregroundStyle(AppColors.ink)
            if required {
                Text("*")
                    .foregroundStyle(AppColors.danger)
                    .font(.titleMD())
            }
        }
    }
}

// MARK: - 입력 텍스트필드 컨테이너
struct AppTextField: View {
    let placeholder: String
    @Binding var text: String

    var body: some View {
        TextField(placeholder, text: $text)
            .font(.body)
            .padding(.horizontal, 14)
            .padding(.vertical, 14)
            .background(AppColors.chipBG)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(AppColors.borderSubtle, lineWidth: 1)
            )
    }
}

// MARK: - 정보 안내 박스
struct InfoBanner: View {
    let title: String
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "info.circle")
                .foregroundStyle(AppColors.inkSecondary)
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.titleMD())
                    .foregroundStyle(AppColors.ink)
                Text(message)
                    .font(.bodyMD())
                    .foregroundStyle(AppColors.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(AppColors.chipBG)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - 점선 박스 (업로더용)
struct DashedUploader: View {
    let icon: String
    let title: String
    let subtitle: String
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 28))
                .foregroundStyle(AppColors.inkSecondary)
            Text(title)
                .font(.titleMD())
                .foregroundStyle(AppColors.primaryDeep)
            Text(subtitle)
                .font(.bodyMD())
                .foregroundStyle(AppColors.neutral)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .background(AppColors.surfaceContainerLow)
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                .foregroundStyle(AppColors.outlineVariant)
        )
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
    }
}
