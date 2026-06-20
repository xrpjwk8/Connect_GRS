import SwiftUI

// _6 — 영업 시간표 관리 (원터치 타임 블락)
struct TimeBlockView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedDay: Int = 18
    @State private var slots: [TimeSlot] = MockData.defaultTimeSlots

    private let weekDays: [(day: Int, label: String)] = [
        (16, "월"), (17, "화"), (18, "수"), (19, "목"), (20, "금"), (21, "토")
    ]

    var body: some View {
//        VStack(spacing: 0) {
        ZStack {
//            ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text("2026년 10월")
                        .font(.headlineMD())
                        .foregroundStyle(AppColors.ink)
                    Spacer()
//                    HStack(spacing: 6) {
//                        Image(systemName: "calendar")
//                        Text("달력보기").font(.bodyLG())
//                    }
//                    .foregroundStyle(AppColors.inkSecondary)
                }
                
                // 주간 일자 (가로 스크롤)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(weekDays, id: \.day) { d in
                            Button { selectedDay = d.day } label: {
                                VStack(spacing: 6) {
                                    Text(d.label).font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                                    Text("\(d.day)").font(.headlineSM())
                                        .foregroundStyle(d.day == selectedDay ? AppColors.ink : AppColors.ink)
                                }
                                .frame(width: 56, height: 60)
                                .background(d.day == selectedDay ? AppColors.primary : AppColors.white)
                                .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                                        .stroke(AppColors.borderStrong, lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                InfoBanner(
                    title: "원터치 차단",
                    message: "버튼을 터치하여 실시간으로 예약을 차단하거나 해제할 수 있습니다. 차단된 시간은 고객 앱에서 예약 불가로 표시됩니다."
                )
                
                HStack {
                    Text("10월 \(selectedDay)일 (수) 타임라인")
                        .font(.headlineSM())
                        .foregroundStyle(AppColors.ink)
                    Spacer()
                    HStack(spacing: 14) {
                        HStack(spacing: 4) {
                            Circle().fill(AppColors.white)
                                .frame(width: 10, height: 10)
                                .overlay(Circle().stroke(AppColors.borderStrong, lineWidth: 1))
                            Text("예약 가능").font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                        }
                        HStack(spacing: 4) {
                            Circle().fill(AppColors.danger).frame(width: 10, height: 10)
                            Text("차단됨").font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                        }
                    }
                }
                
                ScrollView {
                    let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10),
                                GridItem(.flexible(), spacing: 10),
                                GridItem(.flexible(), spacing: 10)]
                    LazyVGrid(columns: cols, spacing: 10) {
                        ForEach(slots.indices, id: \.self) { i in
                            timeSlotCell(slots[i]) {
                                toggle(at: i)
                            }
                        }
                    }
                }
            }
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
//            }

            Button { dismiss() } label: {
                HStack(spacing: 8) {
                    Image(systemName: "tray.and.arrow.down")
                    Text("변경사항 저장")
                }
                .font(.titleMD())
                .foregroundStyle(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(AppColors.primaryDeep)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous))
            }
            .buttonStyle(.plain)
            .offset(x: 100, y: 280)
            .shadow(color: AppColors.primaryDeep.opacity(0.5), radius: 3, x: 0, y: 2)
            
        }
        .background(AppColors.surface.ignoresSafeArea())
        .navigationTitle("영업 시간표 관리")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func toggle(at index: Int) {
        var s = slots[index]
        switch s.state {
        case .available: s.state = .blocked
        case .blocked:   s.state = .available
        case .reserved, .closed: break
        }
        slots[index] = s
    }

    @ViewBuilder
    private func timeSlotCell(_ slot: TimeSlot, onTap: @escaping () -> Void) -> some View {
        let isClosed = slot.state == .closed
        let isBlocked = slot.state == .blocked

        Button(action: { if !isClosed { onTap() } }) {
            VStack(alignment: .leading, spacing: 6) {
                Text(slot.label)
                    .font(.headlineSM())
                    .foregroundStyle(isClosed ? AppColors.neutral : (isBlocked ? .white : AppColors.ink))
//                HStack(spacing: 4) {
//                    if isClosed {
//                        Text("영업 전")
//                            .font(.labelMD())
//                            .foregroundStyle(AppColors.neutral)
//                            .padding(.horizontal, 5)
//                            .padding(.vertical, 3)
//                            .background(AppColors.surfaceContainer)
//                            .clipShape(Capsule())
//                    } else if isBlocked {
//                        Image(systemName: "lock.fill").foregroundStyle(.white)
//                        Text("차단됨").font(.labelMD()).foregroundStyle(.white)
//                    } else {
//                        Text("예약 가능")
//                            .font(.labelMD())
//                            .foregroundStyle(AppColors.ink)
//                            .padding(.horizontal, 5)
//                            .padding(.vertical, 3)
//                            .background(AppColors.primary)
//                            .clipShape(Capsule())
//                    }
//                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isClosed ? AppColors.surfaceContainerLow
                       : (isBlocked ? AppColors.danger : AppColors.white))
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .stroke(isBlocked ? AppColors.danger : AppColors.borderStrong, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(isClosed)
    }
}

#Preview {
    NavigationStack { TimeBlockView() }
}
