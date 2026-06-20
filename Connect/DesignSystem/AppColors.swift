import SwiftUI

// MARK: - Connect Design System Colors
// 디자인 토큰은 connect_design_system/DESIGN.md 를 따름
enum AppColors {
    // Surface / background
    static let surface = Color(hex: 0xFAF9F9)
    static let canvasDeep = Color(hex: 0xECECE8)
    static let white = Color.white
    static let surfaceContainer = Color(hex: 0xEFEDED)
    static let surfaceContainerLow = Color(hex: 0xF5F3F3)
    static let surfaceContainerHigh = Color(hex: 0xE9E8E8)
    static let chipBG = Color(hex: 0xF4F4F2)

    // Ink / text
    static let ink = Color(hex: 0x0F0F0F)
    static let inkSecondary = Color(hex: 0x3D3D3D)
    static let onSurface = Color(hex: 0x1B1C1C)
    static let onSurfaceVariant = Color(hex: 0x454934)

    // Primary (Lime)
    static let primary = Color(hex: 0xD6FF3D)
    static let primaryDeep = Color(hex: 0x526600)
    static let onPrimary = Color(hex: 0x171E00)
    static let primaryDim = Color(hex: 0xAFD500)

    // Outlines / borders
    static let outline = Color(hex: 0x757962)
    static let outlineVariant = Color(hex: 0xC5C9AE)
    static let borderStrong = Color(hex: 0xECECEC)
    static let borderSubtle = Color(hex: 0xF4F4F4)

    // Semantic
    static let success = Color(hex: 0x16A34A)
    static let danger = Color(hex: 0xEF4444)
    static let dangerSoft = Color(hex: 0xFFE9E7)
    static let warn = Color(hex: 0xEAB308)

    // Misc
    static let neutral = Color(hex: 0x8A8A8A)
    static let neutralLight = Color(hex: 0xF5F5F3)
}

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
