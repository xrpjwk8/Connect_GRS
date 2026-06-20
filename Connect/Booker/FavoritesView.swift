import SwiftUI

// _23 — 찜한 가게
struct FavoritesView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundStyle(AppColors.inkSecondary)
                    Text("최대 3곳까지 찜 가능해요. 가장 마음에 드는 가게를 골라보세요.")
                        .font(.bodyMD())
                        .foregroundStyle(AppColors.inkSecondary)
                }
                .padding(.vertical, 6)

                ForEach(MockData.favorites) { store in
                    favoriteCard(store)
                }

//                Button { } label: {
//                    HStack(spacing: 8) {
//                        Image(systemName: "plus")
//                        Text("새로운 가게를 함께해요")
//                    }
//                    .font(.titleMD())
//                    .foregroundStyle(AppColors.inkSecondary)
//                    .frame(maxWidth: .infinity)
//                    .padding(.vertical, 16)
//                    .background(AppColors.surfaceContainerLow)
//                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
//                }
//                .buttonStyle(.plain)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 18)
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationTitle("찜한 가게")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func favoriteCard(_ store: Store) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack(alignment: .topTrailing) {
                LinearGradient(colors: [Color(hex: 0x4D4030), Color(hex: 0x2A2017)],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
                    .frame(height: 140)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md))
                    .overlay(
                        Image(systemName: store.imageName)
                            .font(.system(size: 36))
                            .foregroundStyle(.white.opacity(0.55))
                    )
                Image(systemName: "heart.fill")
                    .foregroundStyle(AppColors.primary)
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
                RatingView(rating: store.rating, count: nil)
            }

            HStack(spacing: 8) {
                Image(systemName: "person.2")
                    .foregroundStyle(AppColors.inkSecondary)
                Text("최대 \(store.maxCapacity)명")
                    .font(.bodyMD())
                    .foregroundStyle(AppColors.inkSecondary)
                Spacer()
                Button { } label: {
                    Text("예약하기")
                        .font(.bodyLG())
                        .foregroundStyle(AppColors.ink)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(AppColors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .appCard()
    }
}

#Preview {
    NavigationStack { FavoritesView() }
}
