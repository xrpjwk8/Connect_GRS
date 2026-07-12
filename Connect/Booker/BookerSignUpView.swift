import SwiftUI

// _2, _8 — 예약자 회원가입
struct BookerSignUpView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var schoolName: String = ""
    @State private var departmentName: String = ""
    @State private var position: String = ""
    @State private var realName: String = ""
    @State private var schoolEmail: String = ""
    @State private var verificationCode: String = ""
    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String? = nil

    // 버튼 활성화를 위한 유효성 검사 프로퍼티
    private var isEmailValid: Bool {
        schoolEmail.contains("@") && schoolEmail.contains(".")
    }
    
    private var isFormValid: Bool {
        !schoolName.isEmpty && !departmentName.isEmpty && !realName.isEmpty && verificationCode.count == 6
    }
    var body: some View {
        VStack(spacing: 0) {
            // 상단바
            HStack {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(AppColors.ink)
                }
                Spacer()
                Text("회원가입")
                    .font(.headlineMD())
                    .foregroundStyle(AppColors.primaryDeep)
                Spacer()
                Spacer().frame(width: 18)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)

            // 진행 바
            Rectangle()
                .fill(AppColors.primary)
                .frame(height: 3)

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    // 1) 기본 정보
                    Group {
                        Text("기본 정보")
                            .font(.headlineMD())
                            .foregroundStyle(AppColors.ink)

                        VStack(alignment: .leading, spacing: 8) {
                            FormLabel(title: "학교명")
                            Menu {
                                ForEach(MockData.universities, id: \.self) { uni in
                                    Button(uni) { schoolName = uni }
                                }
                            } label: {
                                HStack {
                                    Text(schoolName.isEmpty ? "학교를 선택해주세요" : schoolName)
                                        .foregroundStyle(schoolName.isEmpty ? AppColors.neutral : AppColors.ink)
                                    Spacer()
                                    Image(systemName: "chevron.down")
                                        .foregroundStyle(AppColors.inkSecondary)
                                }
                                .padding(14)
                                .background(AppColors.chipBG)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            }
//                            .buttonStyle(.plain) // 스크롤 간섭 방지
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            FormLabel(title: "학과 / 단체명")
                            AppTextField(placeholder: "예: 경영학과 / 댄스동아리", text: $departmentName)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            FormLabel(title: "직책")
                            AppTextField(placeholder: "예: 회장, 과대표", text: $position)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            FormLabel(title: "이름")
                            AppTextField(placeholder: "실명을 입력해주세요", text: $realName)
                        }
                    }

                    Divider().padding(.vertical, 6)

                    // 2) 신원 인증
                    Group {
                        Text("신원 인증")
                            .font(.headlineMD())
                            .foregroundStyle(AppColors.ink)

                        VStack(alignment: .leading, spacing: 8) {
                            FormLabel(title: "학교 메일")
                            HStack(spacing: 10) {
                                AppTextField(placeholder: "example@university.ac.kr", text: $schoolEmail)
                                Button {
                                    // 인증번호 발송 mock
                                } label: {
                                    Text("인증 요청")
                                        .font(.bodyLG())
                                        .foregroundStyle(AppColors.inkSecondary)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 14)
                                        .background(AppColors.surfaceContainerHigh)
                                    
                                    // 요건 충족 시 버튼 색변화 로직 추가하려면 아래 주석 해제
//                                        .foregroundStyle(isEmailValid ? AppColors.white : AppColors.inkSecondary)
//                                        .padding(.horizontal, 14)
//                                        .padding(.vertical, 14)
//                                        .background(isEmailValid ? AppColors.ink : AppColors.surfaceContainerHigh)
                                    
                                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                }
                                .buttonStyle(.plain)
                                .disabled(!isEmailValid)
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            FormLabel(title: "인증번호")
                            HStack(spacing: 10) {
                                AppTextField(placeholder: "6자리 숫자 입력", text: $verificationCode)
                                    .keyboardType(.numberPad)
                                    .onChange(of: verificationCode) { newValue in
                                        let filtered = newValue.filter { $0.isNumber }
                                        if filtered.count > 6 {
                                            verificationCode = String(filtered.prefix(6))
                                        } else {
                                            verificationCode = filtered
                                        }
                                    }
                                
                                Button {
                                    // 확인 mock
                                } label: {
                                    Text("확인")
                                        .font(.bodyLG())
                                        .foregroundStyle(AppColors.white)
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 14)
                                        .background(AppColors.ink)
                                    
//                                        .foregroundStyle(verificationCode.count == 6 ? AppColors.white : AppColors.inkSecondary)
//                                        .padding(.horizontal, 20)
//                                        .padding(.vertical, 14)
//                                        .background(verificationCode.count == 6 ? AppColors.primary : AppColors.surfaceContainerHigh)
                                    
                                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                }
                                .buttonStyle(.plain)
                                .disabled(verificationCode.count != 6)
                            }
                        }
                    }

                    Divider().padding(.vertical, 6)

                    // 3) 학생증 인증 — 누르면 사진 보관함 열림
//                    Group {
//                        Text("학생증 인증")
//                            .font(.headlineMD())
//                            .foregroundStyle(AppColors.ink)
//                        InteractiveUploader(
//                            icon: "person.text.rectangle",
//                            title: "학생증 또는 에브리타임 캡처본 업로드",
//                            subtitle: "JPG, PNG (최대 10MB)"
//                        )
//                    }
//
//                    InfoBanner(
//                        title: "신원 인증 안내",
//                        message: "안전한 서비스 이용을 위해 신원 인증이 필요합니다. 수집된 정보는 노쇼 방지 및 신뢰할 수 있는 매칭을 위한 목적으로만 사용되며 안전하게 파기됩니다."
//                    )
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.bodyMD())
                    .foregroundStyle(AppColors.danger)
                    .padding(.horizontal, 18)
            }

            Button {
                Task { await submit() }
            } label: {
                Text(isSubmitting ? "가입 처리 중..." : "가입 완료하기")
            }
            .buttonStyle(PrimaryFilledButtonStyle())
            .disabled(isSubmitting)
//            .disabled(!isFormValid) // 유효성 검사 실패 시 비활성화
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationBarHidden(true)
    }

    // MARK: - 백엔드 연동
    private func submit() async {
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        do {
            let body = BookerSignUpRequestBody(
                schoolName: schoolName,
                departmentName: departmentName,
                position: position,
                realName: realName,
                schoolEmail: schoolEmail,
                phoneNumber: "010-0000-0000"
            )
            let profile = try await ConnectAPI.signUpBooker(body)
            appState.bookerId = profile.id
            appState.schoolName = schoolName
            appState.departmentName = departmentName
            appState.position = position
            appState.realName = realName
            appState.schoolEmail = schoolEmail
            appState.finishBookerSignUp()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}

#Preview {
    BookerSignUpView()
        .environment(AppState())
}
