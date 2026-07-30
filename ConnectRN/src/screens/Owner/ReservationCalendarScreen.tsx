import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { ownerStore } from '../../models/mockData';
import { useAppState } from '../../state/AppState';
import { PrimaryFilledButton } from '../../components/Buttons';
import Card from '../../components/Card';
import { dateKey, isSameDay } from '../../utils/date';
import type { MyReservation } from '../../models/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthGrid(viewMonth: Date): (number | null)[] {
  const firstWeekday = startOfMonth(viewMonth).getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) grid.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function ReservationCalendarScreen() {
  const navigation = useNavigation<any>();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const { myReservations, blockedSlotsByDate } = useAppState();

  const storeReservations = useMemo(
    () =>
      myReservations.filter(
        (r) => r.storeId === ownerStore.id && (r.status === 'confirmed' || r.status === 'pending')
      ),
    [myReservations]
  );

  const monthReservations = useMemo(
    () =>
      storeReservations
        .filter(
          (r) =>
            r.dateValue &&
            r.dateValue.getFullYear() === viewMonth.getFullYear() &&
            r.dateValue.getMonth() === viewMonth.getMonth()
        )
        .sort((a, b) => (a.dateValue?.getTime() ?? 0) - (b.dateValue?.getTime() ?? 0)),
    [storeReservations, viewMonth]
  );

  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.storeIconBadge}>
            <Ionicons name="storefront-outline" size={16} color={AppColors.primaryDeep} />
          </View>
          <Text style={styles.headerTitle}>캠퍼스 커넥트 비즈니스</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="notifications-outline" size={18} color={AppColors.ink} />
        </View>

        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>예약 관리 캘린더</Text>
          <Text style={styles.introSubtitle}>매장의 예약 현황과 예약 가능 여부를 관리하세요.</Text>
        </View>

        <Card padding={14} style={{ gap: 14 }}>
          <View style={styles.calendarHeaderRow}>
            <Text style={styles.calendarTitle}>{`${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`}</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.calendarNavRow}>
              <Pressable
                hitSlop={8}
                onPress={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              >
                <Ionicons name="chevron-back" size={16} color={AppColors.inkSecondary} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={16} color={AppColors.inkSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, i) => (
              <Text
                key={w}
                style={[
                  styles.weekdayText,
                  { color: i === 0 ? AppColors.danger : i === 6 ? AppColors.primaryDeep : AppColors.inkSecondary },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthGrid.map((day, idx) => {
              if (day == null) return <View key={idx} style={styles.dayCellEmpty} />;
              const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const weekdayIndex = idx % 7;
              const isPast = cellDate.getTime() < today.getTime();
              const isSelected = isSameDay(cellDate, selectedDate);
              const isReserved = storeReservations.some((r) => r.dateValue && isSameDay(r.dateValue, cellDate));
              const isBlocked = (blockedSlotsByDate[dateKey(cellDate)]?.length ?? 0) > 0;
              const weekdayColor = isPast
                ? AppColors.neutral
                : weekdayIndex === 0
                ? AppColors.danger
                : weekdayIndex === 6
                ? AppColors.primaryDeep
                : AppColors.ink;
              return (
                <Pressable
                  key={idx}
                  disabled={isPast}
                  onPress={() => setSelectedDate(cellDate)}
                  style={[styles.dayCell, { backgroundColor: isSelected ? AppColors.primary : 'transparent' }]}
                >
                  <Text style={[styles.dayCellText, { color: isSelected ? AppColors.ink : weekdayColor }]}>{day}</Text>
                  <View style={styles.dayCellDots}>
                    {isReserved && <View style={[styles.dot, { backgroundColor: AppColors.primaryDeep }]} />}
                    {isBlocked && <View style={[styles.dot, { backgroundColor: AppColors.danger }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: AppColors.primary }]} />
              <Text style={styles.legendText}>예약</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: AppColors.danger }]} />
              <Text style={styles.legendText}>차단됨</Text>
            </View>
          </View>
        </Card>

        <View style={styles.quickBlockRow}>
          <View>
            <Text style={styles.quickBlockLabel}>선택한 날짜</Text>
            <Text style={styles.quickBlockValue}>
              {`${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${WEEKDAYS[selectedDate.getDay()]})`}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable
            style={styles.quickBlockButton}
            onPress={() => navigation.navigate('TimeBlock', { dateKey: dateKey(selectedDate) })}
          >
            <Ionicons name="ban-outline" size={16} color={AppColors.danger} />
            <Text style={styles.quickBlockButtonText}>빠른 차단</Text>
          </Pressable>
        </View>

        <PrimaryFilledButton
          title="+ 새 예약 등록"
          onPress={() => navigation.navigate('ManualReservation', { dateKey: dateKey(selectedDate) })}
        />

        <Text style={styles.reservationCount}>
          {`${viewMonth.getMonth() + 1}월 예약 ${monthReservations.length}건`}
        </Text>

        {monthReservations.length === 0 ? (
          <Text style={styles.emptyText}>이번 달 예약이 없어요.</Text>
        ) : (
          monthReservations.map((r) => <OwnerReservationCard key={r.id} r={r} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OwnerReservationCard({ r }: { r: MyReservation }) {
  const confirmed = r.status === 'confirmed';
  return (
    <Card padding={14} style={{ gap: 10 }}>
      <View style={styles.reservationTopRow}>
        <View style={{ gap: 2 }}>
          <View style={styles.reservationNameRow}>
            <Text style={styles.reservationName}>{r.bookerName || '예약자'}</Text>
            {r.bookerAffiliation && <Text style={styles.reservationAffiliation}>{r.bookerAffiliation}</Text>}
            {r.isManual && <Text style={styles.reservationManualTag}>(외부 예약)</Text>}
          </View>
          <Text style={styles.reservationEvent}>{r.eventPurpose || '단체 예약'}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.statusPill, { backgroundColor: confirmed ? AppColors.primary : AppColors.chipBG }]}>
          <Text style={[styles.statusPillText, { color: confirmed ? AppColors.ink : AppColors.inkSecondary }]}>
            {confirmed ? '확정됨' : '대기 중'}
          </Text>
        </View>
      </View>
      <View style={styles.reservationMetaBox}>
        <View style={styles.reservationMetaItem}>
          <Ionicons name="time-outline" size={16} color={AppColors.ink} />
          <Text style={styles.reservationMetaText}>{r.dateLabel}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.reservationMetaItem}>
          <Ionicons name="people-outline" size={16} color={AppColors.ink} />
          <Text style={styles.reservationMetaText}>{r.people}명</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s10 },
  storeIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.titleMD, color: AppColors.primaryDeep },
  introBlock: { gap: AppSpacing.s6 },
  introTitle: { ...Typography.headlineLG, color: AppColors.ink },
  introSubtitle: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  calendarHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  calendarTitle: { ...Typography.headlineMD, color: AppColors.ink },
  calendarNavRow: { flexDirection: 'row', gap: AppSpacing.s14 },
  weekdayRow: { flexDirection: 'row' },
  weekdayText: { ...Typography.labelMD, flex: 1, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: `${100 / 7}%`, height: 44 },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.s4,
    borderRadius: 10,
  },
  dayCellText: { ...Typography.titleMD },
  dayCellDots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  legendRow: { flexDirection: 'row', gap: AppSpacing.s18, paddingTop: AppSpacing.s6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  legendText: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  quickBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  quickBlockLabel: { ...Typography.labelMD, color: AppColors.inkSecondary },
  quickBlockValue: { ...Typography.headlineSM, color: AppColors.ink },
  quickBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s6,
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s10,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  quickBlockButtonText: { ...Typography.bodyLG, color: AppColors.danger },
  reservationCount: { ...Typography.labelMD, color: AppColors.inkSecondary },
  emptyText: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  reservationTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  reservationNameRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: AppSpacing.s6 },
  reservationName: { ...Typography.headlineSM, color: AppColors.ink },
  reservationAffiliation: { ...Typography.labelMD, color: AppColors.inkSecondary },
  reservationManualTag: { ...Typography.labelMD, color: AppColors.neutral },
  reservationEvent: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  statusPill: { paddingHorizontal: AppSpacing.s10, paddingVertical: AppSpacing.s4, borderRadius: AppRadius.pill },
  statusPillText: { ...Typography.labelMD },
  reservationMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.s12,
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.chipBG,
    borderRadius: 10,
  },
  reservationMetaItem: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  reservationMetaText: { ...Typography.bodyLG, color: AppColors.ink },
});
