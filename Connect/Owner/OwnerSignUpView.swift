import SwiftUI
import UniformTypeIdentifiers

// _11 — 점주 회원가입 (비즈니스 인증, 2/2 단계)
struct OwnerSignUpView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var storeName: String = ""
    @State private var contact: String = ""
    @State private var businessNumber: String = ""

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(AppColors.ink)
                }
                Spacer()
                Text("점주 회원가입")
                    .font(.headlineMD())
                    .foregroundStyle(AppColors.primaryDeep)
                Spacer()
                Spacer().frame(width: 18)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)

            // 진행 바 2/2
            HStack(spacing: 6) {
                Rectangle().fill(AppColors.primary).frame(height: 6)
                Rectangle().fill(AppColors.primaryDim).frame(height: 6)
                Rectangle().fill(AppColors.surfaceContainerHigh).frame(height: 6)
                    .frame(maxWidth: 60)
                Text("2/2")
                    .font(.labelMD())
                    .foregroundStyle(AppColors.inkSecondary)
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 16)

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("비즈니스 인증")
                            .font(.headlineLG())
                            .foregroundStyle(AppColors.ink)
                        Text("가게 정보를 정확하게 입력해주세요.")
                            .font(.bodyLG())
                            .foregroundStyle(AppColors.inkSecondary)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        FormLabel(title: "가게명")
                        AppTextField(placeholder: "가게 이름을 입력해주세요", text: $storeName)
                            .onChange(of: storeName) { newValue in
                                        if newValue.count > 20 {
                                            storeName = String(newValue.prefix(20))
                                        }
                                    }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        FormLabel(title: "연락처")
                        AppTextField(placeholder: "‘-’ 없이 숫자만 입력해주세요", text: $contact)
                        // 키보드 타입을 숫자 패드로 지정
                            .keyboardType(.numberPad)
                        // 값이 바뀔 때마다 숫자만 남기도록 필터링
                            .onChange(of: contact) { newValue in
                                let filtered = newValue.filter { $0.isNumber }
                                if filtered != newValue {
                                    contact = filtered
                                }
                            }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        FormLabel(title: "사업자 등록 번호")
                        AppTextField(placeholder: "사업자 등록 번호 10자리를 입력해주세요", text: $businessNumber)
                            .keyboardType(.numberPad)
                            .onChange(of: businessNumber) { newValue in
                                let filtered = newValue.filter { $0.isNumber } // 숫자만 필터링, 이후 10자 제한 적용
                                if filtered.count > 10 {
                                            businessNumber = String(newValue.prefix(10))
                                } else {
                                    businessNumber = filtered
                                }
                            }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        FormLabel(title: "사업자등록증")
                        InteractiveUploader(
                            icon: "doc.badge.arrow.up",
                            title: "사진 또는 PDF 파일 업로드",
                            subtitle: "JPG, PNG, PDF (최대 10MB)",
                            fileTypes: [.image, .pdf]
                        )
                    }

                    InfoBanner(
                        title: "가입 승인 안내",
                        message: "사업자 정보 확인 후 관리자 승인을 거쳐 서비스 이용이 가능합니다. 승인 완료까지 영업일 기준 1~2일이 소요될 수 있습니다."
                    )
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 8)
            }

            Button { appState.finishOwnerSignUp() } label: {
                Text("가입 신청하기")
                    .foregroundStyle(AppColors.inkSecondary)
            }
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(AppColors.surfaceContainerHigh)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationBarHidden(true)
    }
}

#Preview {
    OwnerSignUpView()
        .environment(AppState())
}
