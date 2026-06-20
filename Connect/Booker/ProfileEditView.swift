import SwiftUI
import PhotosUI

// 예약자 개인정보 수정
struct ProfileEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    // 진입 시 AppState 값으로 초기화
    @State private var schoolName: String = ""
    @State private var departmentName: String = ""
    @State private var position: String = ""
    @State private var realName: String = ""
    @State private var schoolEmail: String = ""
    @State private var phoneNumber: String = ""

    // 프로필 사진
    @State private var photoItem: PhotosPickerItem? = nil
    @State private var pendingImageData: Data? = nil   // 저장 누를 때 확정

    @State private var showSavedAlert: Bool = false

    private var displayImageData: Data? {
        pendingImageData ?? appState.profileImageData
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    avatarSection
                    basicInfoSection
                    contactSection
                    infoBanner
                    dangerActions
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
            }
            bottomBar
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationTitle("개인정보 수정")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { loadFromAppState() }
        .onChange(of: photoItem) { _, newItem in
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self) {
                    pendingImageData = data
                }
            }
        }
        .alert("저장되었습니다", isPresented: $showSavedAlert) {
            Button("확인") { dismiss() }
        } message: {
            Text("프로필 정보가 업데이트되었습니다.")
        }
    }

    // MARK: - Sections

    private var avatarSection: some View {
        VStack(spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                avatarView
                    .frame(width: 96, height: 96)
                    .clipShape(Circle())

                PhotosPicker(selection: $photoItem,
                             matching: .images,
                             photoLibrary: .shared()) {
                    Image(systemName: "camera.fill")
                        .foregroundStyle(Color.white)
                        .padding(8)
                        .background(AppColors.ink)
                        .clipShape(Circle())
                }
            }
            Text("프로필 사진 변경")
                .font(.bodyMD())
                .foregroundStyle(AppColors.inkSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    @ViewBuilder
    private var avatarView: some View {
        if let data = displayImageData, let uiImg = UIImage(data: data) {
            Image(uiImage: uiImg)
                .resizable()
                .scaledToFill()
        } else {
            ZStack {
                Circle().fill(AppColors.primary)
                Text(realName.isEmpty ? "?" : String(realName.prefix(1)))
                    .font(.system(size: 36, weight: .heavy))
                    .foregroundStyle(AppColors.ink)
            }
        }
    }

    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("기본 정보")
                .font(.headlineSM())
                .foregroundStyle(AppColors.ink)

            VStack(alignment: .leading, spacing: 6) {
                FormLabel(title: "학교명")
                schoolMenu
            }

            VStack(alignment: .leading, spacing: 6) {
                FormLabel(title: "학과 / 단체명")
                AppTextField(placeholder: "예: 경영학과", text: $departmentName)
            }

            VStack(alignment: .leading, spacing: 6) {
                FormLabel(title: "직책")
                AppTextField(placeholder: "예: 회장, 과대표", text: $position)
            }

            VStack(alignment: .leading, spacing: 6) {
                FormLabel(title: "이름")
                AppTextField(placeholder: "실명", text: $realName)
            }
        }
        .padding(16)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
    }

    private var schoolMenu: some View {
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
    }

    private var contactSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("연락처")
                .font(.headlineSM())
                .foregroundStyle(AppColors.ink)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    FormLabel(title: "학교 메일")
                    Spacer()
                    TagLabel(text: "인증 완료",
                             color: AppColors.primary,
                             textColor: AppColors.ink)
                }
                AppTextField(placeholder: "example@university.ac.kr", text: $schoolEmail)
            }

            VStack(alignment: .leading, spacing: 6) {
                FormLabel(title: "휴대폰 번호")
                AppTextField(placeholder: "‘-’ 없이 숫자만 입력", text: $phoneNumber)
            }
        }
        .padding(16)
        .background(AppColors.white)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.borderStrong, lineWidth: 1)
        )
    }

    private var infoBanner: some View {
        InfoBanner(
            title: "정보 수정 안내",
            message: "학교 정보를 변경하면 신원 재인증이 필요할 수 있습니다. 학교 메일 변경 시 인증번호가 새로 발송됩니다."
        )
    }

    private var dangerActions: some View {
        VStack(spacing: 10) {
            Button { } label: {
                HStack {
                    Image(systemName: "lock.rotation")
                    Text("비밀번호 변경")
                }
            }
            .buttonStyle(GhostButtonStyle())

            Button { } label: {
                Text("계정 탈퇴")
                    .foregroundStyle(AppColors.danger)
            }
            .frame(maxWidth: .infinity, minHeight: 48)
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Text("취소")
            }
            .buttonStyle(GhostButtonStyle())

            Button {
                save()
                showSavedAlert = true
            } label: {
                Text("저장하기")
            }
            .buttonStyle(LimeButtonStyle())
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(AppColors.white)
    }

    // MARK: - Helpers

    private func loadFromAppState() {
        schoolName     = appState.schoolName.isEmpty     ? "연세대학교"           : appState.schoolName
        departmentName = appState.departmentName.isEmpty ? "경영학과"             : appState.departmentName
        position       = appState.position.isEmpty       ? "부회장"                : appState.position
        realName       = appState.realName.isEmpty       ? "김재원"                : appState.realName
        schoolEmail    = appState.schoolEmail.isEmpty    ? "jaewon@yonsei.ac.kr" : appState.schoolEmail
        phoneNumber    = appState.phoneNumber.isEmpty    ? "01012345678"         : appState.phoneNumber
    }

    private func save() {
        appState.schoolName = schoolName
        appState.departmentName = departmentName
        appState.position = position
        appState.realName = realName
        appState.schoolEmail = schoolEmail
        appState.phoneNumber = phoneNumber
        if let data = pendingImageData {
            appState.profileImageData = data
        }
    }
}

#Preview {
    NavigationStack { ProfileEditView() }
        .environment(AppState())
}
