import SwiftUI

// MARK: - Typography
// Noto Sans KR (headings) / Inter (data, body) 가 디자인 의도이지만,
// 외부 폰트 의존 없이 동작하도록 시스템 폰트로 fallback 합니다.
extension Font {
    static func displayHero() -> Font { .system(size: 32, weight: .heavy, design: .default) }
    static func headlineLG() -> Font { .system(size: 22, weight: .heavy, design: .default) }
    static func headlineMD() -> Font { .system(size: 20, weight: .heavy, design: .default) }
    static func headlineSM() -> Font { .system(size: 18, weight: .bold, design: .default) }
    static func titleMD() -> Font { .system(size: 16, weight: .bold, design: .default) }
    static func bodyLG() -> Font { .system(size: 14, weight: .semibold, design: .default) }
    static func bodyMD() -> Font { .system(size: 13, weight: .medium, design: .default) }
    static func labelMD() -> Font { .system(size: 12, weight: .semibold, design: .default) }
    static func labelSM() -> Font { .system(size: 11, weight: .bold, design: .default) }
}

// MARK: - Shape tokens
enum AppRadius {
    static let sm: CGFloat = 6
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let pill: CGFloat = 999
}

// MARK: - Common modifiers
struct CardStyle: ViewModifier {
    var padding: CGFloat = 16
    var radius: CGFloat = AppRadius.lg
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
    }
}

extension View {
    func appCard(padding: CGFloat = 16, radius: CGFloat = AppRadius.lg) -> some View {
        modifier(CardStyle(padding: padding, radius: radius))
    }
}

// MARK: - Buttons
struct PrimaryFilledButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity, minHeight: 52)
            .font(.titleMD())
            .foregroundStyle(AppColors.white)
            .background(AppColors.ink)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

struct LimeButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity, minHeight: 52)
            .font(.titleMD())
            .foregroundStyle(AppColors.ink)
            .background(AppColors.primary)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity, minHeight: 48)
            .font(.titleMD())
            .foregroundStyle(AppColors.ink)
            .background(AppColors.white)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                    .stroke(AppColors.borderStrong, lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}
