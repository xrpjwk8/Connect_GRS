import SwiftUI

// _21 — 예약 관리 캘린더
struct ReservationCalendarView: View {
    @State private var selectedDay: Int = 16
    @State private var goTimeBlock = false

    private let weekdays = ["일", "월", "화", "수", "목", "금", "토"]
    private let monthDates: [Int?] = [
        nil, nil, 1, 2, 3, 4, 5,
        6, 7, 8, 9, 10, 11, 12,
        13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26,
        27, 28, 29, 30, 31, nil, nil
    ]
    // 점주의 마커 위치 (예약/차단)
    private let reservationDots: Set<Int> = [3, 8, 12, 16, 24]
    private let blockedDots: Set<Int> = [12]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    // 헤더
                    HStack {
                        ZStack {
                            Circle().fill(AppColors.surfaceContainer).frame(width: 36, height: 36)
                            Image(systemName: "storefront")
                                .foregroundStyle(AppColors.primaryDeep)
                        }
                        Text("캠퍼스 커넥트 비즈니스")
                            .font(.titleMD())
                            .foregroundStyle(AppColors.primaryDeep)
                        Spacer()
                        Image(systemName: "bell")
                            .foregroundStyle(AppColors.ink)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("예약 관리 캘린더")
                            .font(.headlineLG())
                            .foregroundStyle(AppColors.ink)
                        Text("매장의 예약 현황과 예약 가능 여부를 관리하세요.")
                            .font(.bodyLG())
                            .foregroundStyle(AppColors.inkSecondary)
                    }

                    Button { } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "plus")
                            Text("새 예약 등록")
                        }
                    }
                    .buttonStyle(PrimaryFilledButtonStyle())

                    // 캘린더
                    VStack(spacing: 14) {
                        HStack {
                            Text("2024년 10월")
                                .font(.headlineMD())
                                .foregroundStyle(AppColors.ink)
                            Spacer()
                            HStack(spacing: 14) {
                                Image(systemName: "chevron.left")
                                Image(systemName: "chevron.right")
                            }
                            .foregroundStyle(AppColors.inkSecondary)
                        }

                        // 요일
                        HStack {
                            ForEach(weekdays.indices, id: \.self) { i in
                                Text(weekdays[i])
                                    .font(.labelMD())
                                    .foregroundStyle(i == 0 ? AppColors.danger
                                                     : (i == 6 ? AppColors.primaryDeep : AppColors.inkSecondary))
                                    .frame(maxWidth: .infinity)
                            }
                        }

                        // 일자
                        let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
                        LazyVGrid(columns: columns, spacing: 8) {
                            ForEach(monthDates.indices, id: \.self) { idx in
                                if let day = monthDates[idx] {
                                    dayCell(day: day, weekdayIndex: idx % 7)
                                } else {
                                    Color.clear.frame(height: 44)
                                }
                            }
                        }

                        HStack(spacing: 18) {
                            HStack(spacing: 6) {
                                Circle().fill(AppColors.primary).frame(width: 8, height: 8)
                                Text("예약").font(.bodyMD()).foregroundStyle(AppColors.inkSecondary)
                            }
                            HStack(spacing: 6) {
                                Circle().fill(AppColors.danger).frame(width: 8, height: 8)
                                Text("차단됨").font(.bodyMD()).foregroundStyle(AppColors.inkSecondary)
                            }
                            Spacer()
                        }
                        .padding(.top, 6)
                    }
                    .appCard(padding: 14)

                    // 선택 날짜 & 빠른 차단
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("선택한 날짜").font(.labelMD()).foregroundStyle(AppColors.inkSecondary)
                            Text("10월 \(selectedDay)일 (수)").font(.headlineSM()).foregroundStyle(AppColors.ink)
                        }
                        Spacer()
                        NavigationLink {
                            TimeBlockView()
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "nosign")
                                Text("빠른 차단")
                            }
                            .font(.bodyLG())
                            .foregroundStyle(AppColors.danger)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppRadius.pill, style: .continuous)
                                    .stroke(AppColors.danger, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(14)
                    .background(AppColors.white)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                            .stroke(AppColors.borderStrong, lineWidth: 1)
                    )

                    Text("예약 \(MockData.ownerReservations.count)건")
                        .font(.labelMD())
                        .foregroundStyle(AppColors.inkSecondary)

                    ForEach(MockData.ownerReservations) { r in
                        ownerReservationCard(r)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 8)
            }
            .background(AppColors.surface.ignoresSafeArea())
        }
    }

    @ViewBuilder
    private func dayCell(day: Int, weekdayIndex: Int) -> some View {
        let isSelected = selectedDay == day
        let isReserved = reservationDots.contains(day)
        let isBlocked = blockedDots.contains(day)
        let weekdayColor: Color = (weekdayIndex == 0) ? AppColors.danger
                                : (weekdayIndex == 6 ? AppColors.primaryDeep : AppColors.ink)

        Button { selectedDay = day } label: {
            VStack(spacing: 4) {
                Text("\(day)")
                    .font(.titleMD())
                    .foregroundStyle(isSelected ? AppColors.ink : weekdayColor)
                HStack(spacing: 3) {
                    if isReserved {
                        Circle().fill(AppColors.primaryDeep).frame(width: 5, height: 5)
                    }
                    if isBlocked {
                        Circle().fill(AppColors.danger).frame(width: 5, height: 5)
                    }
                }
                .frame(height: 6)
            }
            .frame(maxWidth: .infinity, minHeight: 44)
            .background(isSelected ? AppColors.primary : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func ownerReservationCard(_ r: OwnerReservation) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(r.group).font(.headlineSM()).foregroundStyle(AppColors.ink)
                    Text(r.event).font(.bodyMD()).foregroundStyle(AppColors.inkSecondary)
                }
                Spacer()
                if r.confirmed {
                    Text("확정됨")
                        .font(.labelMD())
                        .foregroundStyle(AppColors.ink)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(AppColors.primary)
                        .clipShape(Capsule())
                } else {
                    Text("대기 중")
                        .font(.labelMD())
                        .foregroundStyle(AppColors.inkSecondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(AppColors.chipBG)
                        .clipShape(Capsule())
                }
            }
            HStack {
                Label(r.timeRange, systemImage: "clock")
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.ink)
                Spacer()
                Label("\(r.people)명", systemImage: "person.2")
                    .font(.bodyLG())
                    .foregroundStyle(AppColors.ink)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(AppColors.chipBG)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .appCard(padding: 14)
    }
}

#Preview {
    ReservationCalendarView()
}
