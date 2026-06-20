import SwiftUI

// _19 — 가게 정보 관리
struct StoreProfileView: View {
    @Environment(AppState.self) private var appState
    @State private var keywords: [String] = ["최대 100석", "신촌역 도보 5분", "음료 서비스", "콘센트 있음"]
    @State private var newKeyword: String = ""
    
    // 1. 카테고리 상태 관리를 위한 변수 추가 (기본값: 전체)
        @State private var selectedCategory: String = "전체"
        private let categories = ["전체", "고기집", "요리주점/포차", "호프/맥주", "한식/전골", "양식", "중식/일식", "치킨"]
    
    @State private var deposit: String = "10000"
    @State private var naverURL: String = "https://naver.me/..."
    @State private var kakaoURL: String = "https://kakaomap.com/..."
    @State private var showBlockSheet = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        HStack {
                            Text("캠퍼스 커넥트 비즈니스")
                                .font(.titleMD())
                                .foregroundStyle(AppColors.primaryDeep)
                            Spacer()
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("가게 정보 관리")
                                .font(.headlineLG())
                                .foregroundStyle(AppColors.ink)
                            Text("학생들에게 보여질 가게의 모습과 기본 설정을 관리하세요.")
                                .font(.bodyLG())
                                .foregroundStyle(AppColors.inkSecondary)
                        }

                        // 가게 사진
                        VStack(alignment: .leading, spacing: 10) {
                            sectionHeader(icon: "photo", title: "가게 사진")
                            ZStack {
                                LinearGradient(colors: [Color(hex: 0xE8E4D8), Color(hex: 0xCBC4B4)],
                                               startPoint: .topLeading, endPoint: .bottomTrailing)
                                    .frame(height: 160)
                                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                                VStack(spacing: 4) {
                                    Image(systemName: "camera.fill").foregroundStyle(AppColors.white)
                                    Text("사진 업로드")
                                        .font(.bodyLG())
                                        .foregroundStyle(AppColors.white)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(.black.opacity(0.4))
                                        .clipShape(Capsule())
                                }
                            }
                            Text("권장 사이즈: 1200 × 600px, 최대 5MB")
                                .font(.labelMD())
                                .foregroundStyle(AppColors.inkSecondary)
                        }
                        .appCard()
                        
                        // 2. [신규 추가] 가게 카테고리 선택 섹션 (위치: 키워드와 예약금 설정 사이)
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader(icon: "list.bullet.indent", title: "가게 업종 카테고리")
                            Text("가게의 주요 업종을 하나 선택해 주세요. 검색 및 필터링에 활용됩니다.")
                                .font(.bodyMD())
                                .foregroundStyle(AppColors.inkSecondary)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(categories, id: \.self) { category in
                                    let isSelected = selectedCategory == category
                                    Button {
                                        selectedCategory = category
                                    } label: {
                                        Text(category)
                                            .font(.bodyLG())
                                            .foregroundStyle(isSelected ? AppColors.ink : AppColors.inkSecondary)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(isSelected ? AppColors.primary : AppColors.chipBG)
                                            .clipShape(Capsule())
                                            .overlay(
                                                Capsule()
                                                    .stroke(isSelected ? AppColors.primaryDim : Color.clear, lineWidth: 1)
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .appCard()

                        // 가게 키워드
                        VStack(alignment: .leading, spacing: 10) {
                            sectionHeader(icon: "tag", title: "가게 키워드")
                            HStack(spacing: 8) {
                                TextField("태그 추가 (예: 조용한 분위기)", text: $newKeyword)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 10)
                                    .background(AppColors.chipBG)
                                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                    .onChange(of: newKeyword) { value in
                                        if value.count > 15 { newKeyword = String(value.prefix(15)) }
                                    }
                                Button {
                                    let k = newKeyword.trimmingCharacters(in: .whitespaces)
                                    if !k.isEmpty && k.count <= 15 { keywords.append(k); newKeyword = "" }
                                } label: {
                                    Text("추가")
                                        .font(.bodyLG())
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 10)
                                        .background(AppColors.ink)
                                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                }
                                .buttonStyle(.plain)
                            }
                            FlowLayout(spacing: 6) {
                                ForEach(keywords, id: \.self) { kw in
                                    HStack(spacing: 6) {
                                        Text(kw).font(.bodyLG()).foregroundStyle(AppColors.ink)
                                        Button {
                                            keywords.removeAll { $0 == kw }
                                        } label: {
                                            Image(systemName: "xmark")
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundStyle(AppColors.inkSecondary)
                                        }
                                    }
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(AppColors.primary)
                                    .clipShape(Capsule())
                                }
                            }
                        }
                        .appCard()
                        

                        // 예약금 설정
                        VStack(alignment: .leading, spacing: 10) {
                            sectionHeader(icon: "wonsign.circle", title: "예약금 설정")
                            Text("악성노쇼 방지를 위한 예약금을 책정하여 노쇼를 방지하세요.")
                                .font(.bodyMD())
                                .foregroundStyle(AppColors.inkSecondary)
                            HStack {
                                TextField("0", text: $deposit)
                                    .keyboardType(.numberPad)
                                Spacer()
                                Text("KRW").font(.bodyLG()).foregroundStyle(AppColors.inkSecondary)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(AppColors.chipBG)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                            InfoBanner(title: "안내",
                                       message: "이 금액은 예약 정책에 따라 최종 결제 금액에서 차감되거나 방문 후 환불됩니다.")
                        }
                        .appCard()

                        // 외부 지도 링크
                        VStack(alignment: .leading, spacing: 10) {
                            sectionHeader(icon: "map", title: "외부 지도 링크")
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text("네이버 지도 URL")
                                        .font(.titleMD())
                                        .foregroundStyle(AppColors.ink)
                                    TagLabel(text: "필수", color: AppColors.dangerSoft, textColor: AppColors.danger)
                                }
                                AppTextField(placeholder: "https://naver.me/...", text: $naverURL)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text("카카오 지도 URL")
                                    .font(.titleMD())
                                    .foregroundStyle(AppColors.ink)
                                AppTextField(placeholder: "https://kakaomap.com/...", text: $kakaoURL)
                            }
                        }
                        .appCard()

                        Button { appState.logout() } label: {
                            Text("로그아웃")
                                .foregroundStyle(AppColors.danger)
                        }
                        .buttonStyle(GhostButtonStyle())
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 14)
                }

                HStack(spacing: 10) {
                    Button { } label: { Text("취소") }
                        .buttonStyle(GhostButtonStyle())
                    Button { } label: {
                        Text("변경사항 저장").foregroundStyle(AppColors.ink)
                    }
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(AppColors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
                .background(AppColors.white)
            }
            .background(AppColors.surface.ignoresSafeArea())
        }
    }

    private func sectionHeader(icon: String, title: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon).foregroundStyle(AppColors.ink)
            Text(title).font(.headlineSM()).foregroundStyle(AppColors.ink)
        }
    }
}

// MARK: - 간단한 Flow Layout (iOS 16+ Layout 사용)
struct FlowLayout: Layout {
    var spacing: CGFloat = 6
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var lineWidth: CGFloat = 0
        var totalHeight: CGFloat = 0
        var lineHeight: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if lineWidth + s.width > width, lineWidth > 0 {
                totalHeight += lineHeight + spacing
                lineWidth = s.width + spacing
                lineHeight = s.height
            } else {
                lineWidth += s.width + spacing
                lineHeight = max(lineHeight, s.height)
            }
        }
        totalHeight += lineHeight
        return CGSize(width: width, height: totalHeight)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = bounds.minX
        var y: CGFloat = bounds.minY
        var lineHeight: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x + s.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += lineHeight + spacing
                lineHeight = 0
            }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(width: s.width, height: s.height))
            x += s.width + spacing
            lineHeight = max(lineHeight, s.height)
        }
    }
}

#Preview {
    StoreProfileView()
        .environment(AppState())
}
