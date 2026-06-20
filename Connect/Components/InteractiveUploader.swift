import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

/// 점선 박스 업로더 — 누르면 사진 보관함 / 파일 앱에서 선택할 수 있어요.
///
/// 파라미터:
/// - `icon`, `title`, `subtitle`: 초기 안내 텍스트
/// - `fileTypes`: 비어있지 않으면 "파일 앱" 옵션 활성화 (예: `[.image, .pdf]`)
///   비어있으면 사진 보관함만 사용
struct InteractiveUploader: View {
    let icon: String
    let title: String
    let subtitle: String
    var fileTypes: [UTType] = []

    @State private var showSourceDialog: Bool = false
    @State private var showPhotosPicker: Bool = false
    @State private var showFilesPicker: Bool = false
    @State private var photoItem: PhotosPickerItem? = nil
    @State private var pickedLabel: String? = nil
    @State private var pickedData: Data? = nil

    private var allowsFiles: Bool { !fileTypes.isEmpty }

    var body: some View {
        Button {
            // 옵션이 하나 뿐이면 다이얼로그 생략하고 바로 PhotosPicker 호출
            if allowsFiles {
                showSourceDialog = true
            } else {
                showPhotosPicker = true
            }
        } label: {
            uploaderLabel
        }
        .buttonStyle(.plain)
        .confirmationDialog("업로드 방법 선택",
                            isPresented: $showSourceDialog,
                            titleVisibility: .visible) {
            Button("사진 보관함") { showPhotosPicker = true }
            if allowsFiles {
                Button("파일 앱") { showFilesPicker = true }
            }
            Button("취소", role: .cancel) { }
        }
        .photosPicker(isPresented: $showPhotosPicker,
                      selection: $photoItem,
                      matching: .images,
                      photoLibrary: .shared())
        .onChange(of: photoItem) { _, newItem in
            Task { await loadPhoto(newItem) }
        }
        .fileImporter(
            isPresented: $showFilesPicker,
            allowedContentTypes: fileTypes.isEmpty ? [.image] : fileTypes,
            allowsMultipleSelection: false
        ) { result in
            handleFileImport(result)
        }
    }

    // MARK: - 라벨 UI
    @ViewBuilder
    private var uploaderLabel: some View {
        VStack(spacing: 8) {
            Image(systemName: pickedLabel == nil ? icon : "checkmark.circle.fill")
                .font(.system(size: 28))
                .foregroundStyle(pickedLabel == nil ? AppColors.inkSecondary : AppColors.primaryDeep)
            Text(pickedLabel ?? title)
                .font(.titleMD())
                .foregroundStyle(pickedLabel == nil ? AppColors.primaryDeep : AppColors.ink)
                .multilineTextAlignment(.center)
            Text(pickedLabel == nil ? subtitle : "다시 누르면 변경할 수 있어요")
                .font(.bodyMD())
                .foregroundStyle(AppColors.neutral)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .padding(.horizontal, 16)
        .background(AppColors.surfaceContainerLow)
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                .foregroundStyle(AppColors.outlineVariant)
        )
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
    }

    // MARK: - 사진 로딩
    private func loadPhoto(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        if let data = try? await item.loadTransferable(type: Data.self) {
            pickedData = data
            pickedLabel = "사진 업로드 완료"
        }
    }

    // MARK: - 파일 로딩
    private func handleFileImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            // 보안 스코프 접근 시작/종료
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            if let data = try? Data(contentsOf: url) {
                pickedData = data
            }
            pickedLabel = url.lastPathComponent
        case .failure:
            break
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        InteractiveUploader(icon: "person.text.rectangle",
                            title: "학생증 또는 에브리타임 캡처본 업로드",
                            subtitle: "JPG, PNG (최대 10MB)")

        InteractiveUploader(icon: "doc.badge.arrow.up",
                            title: "사진 또는 PDF 파일 업로드",
                            subtitle: "JPG, PNG, PDF (최대 10MB)",
                            fileTypes: [.image, .pdf])
    }
    .padding()
}
