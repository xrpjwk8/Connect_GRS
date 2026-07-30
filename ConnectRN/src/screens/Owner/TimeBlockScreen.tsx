import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { defaultTimeSlots, ownerStore } from '../../models/mockData';
import { useAppState } from '../../state/AppState';
import { InfoBanner } from '../../components/CommonComponents';
import { dateKey, isSameDay, parseDateKey } from '../../utils/date';
import type { TimeSlot, TimeSlotState } from '../../models/types';

const WEEKDAY_LETTERS = ['일', '월', '화', '수', '목', '금', '토'];

function buildWeekDays(start: Date): Date[] {
  const base = new Date(start);
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function TimeBlockScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { myReservations, capacityOverbookingEnabled, blockedSlotsByDate, setBlockedSlotsByDate } = useAppState();

  const requestedStart: string | undefined = route.params?.dateKey;
  const weekDays = useMemo(() => buildWeekDays(requestedStart ? parseDateKey(requestedStart) : new Date()), [requestedStart]);
  const [selectedDate, setSelectedDate] = useState(weekDays[0]);

  // 확정된 예약이 그 시간대 정원을 얼마나 채웠는지 (시작 시각별 합산 인원)
  const bookedPeopleByStart = useMemo(() => {
    const map = new Map<string, number>();
    myReservations.forEach((r) => {
      if (r.storeId !== ownerStore.id || r.status !== 'confirmed' || !r.dateValue) return;
      if (!isSameDay(r.dateValue, selectedDate)) return;
      r.timeLabels.forEach((t) => map.set(t, (map.get(t) ?? 0) + r.people));
    });
    return map;
  }, [myReservations, selectedDate]);

  const blockedStarts = new Set(blockedSlotsByDate[dateKey(selectedDate)] ?? []);

  const slots: (TimeSlot & { booked: number })[] = useMemo(
    () =>
      defaultTimeSlots.map((slot) => {
        const start = slot.label.split(' ~ ')[0];
        const booked = bookedPeopleByStart.get(start) ?? 0;
        if (slot.state === 'closed') return { ...slot, booked };
        const isFull = capacityOverbookingEnabled ? booked >= ownerStore.maxCapacity : booked > 0;
        let state: TimeSlotState = 'available';
        if (isFull) state = 'reserved';
        else if (blockedStarts.has(start)) state = 'blocked';
        return { ...slot, state, booked };
      }),
    [bookedPeopleByStart, blockedStarts, capacityOverbookingEnabled]
  );

  const toggle = (slot: TimeSlot) => {
    if (slot.state === 'closed' || slot.state === 'reserved') return;
    const start = slot.label.split(' ~ ')[0];
    const key = dateKey(selectedDate);
    const current = new Set(blockedSlotsByDate[key] ?? []);
    if (current.has(start)) current.delete(start);
    else current.add(start);
    setBlockedSlotsByDate({ ...blockedSlotsByDate, [key]: Array.from(current) });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>영업 시간표 관리</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.monthTitle}>{`${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
          {weekDays.map((d) => {
            const selected = isSameDay(d, selectedDate);
            return (
              <Pressable
                key={dateKey(d)}
                onPress={() => setSelectedDate(d)}
                style={[styles.dayCell, { backgroundColor: selected ? AppColors.primary : AppColors.white }]}
              >
                <Text style={styles.dayCellLabel}>{WEEKDAY_LETTERS[d.getDay()]}</Text>
                <Text style={styles.dayCellNumber}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <InfoBanner
          title="원터치 차단"
          message={
            capacityOverbookingEnabled
              ? '버튼을 터치하여 실시간으로 예약을 차단하거나 해제할 수 있습니다. 매장 정원이 가득 찬 시간대는 자동으로 차단되고, 자리가 남아있으면 계속 예약을 받을 수 있어요.'
              : '버튼을 터치하여 실시간으로 예약을 차단하거나 해제할 수 있습니다. 확정된 예약이 있는 시간대는 자동으로 차단되어 고객 앱에서 예약 불가로 표시됩니다.'
          }
        />

        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineTitle}>
            {`${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${WEEKDAY_LETTERS[selectedDate.getDay()]}) 타임라인`}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotAvailable} />
              <Text style={styles.legendText}>예약 가능</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.danger }]} />
              <Text style={styles.legendText}>차단됨</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.primaryDeep }]} />
              <Text style={styles.legendText}>정원 마감</Text>
            </View>
          </View>
        </View>

        <View style={styles.slotGrid}>
          {slots.map((slot) => (
            <TimeSlotCell key={slot.id} slot={slot} onPress={() => toggle(slot)} />
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.saveButton} onPress={() => navigation.goBack()}>
        <Ionicons name="download-outline" size={18} color={AppColors.white} />
        <Text style={styles.saveButtonText}>변경사항 저장</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function TimeSlotCell({ slot, onPress }: { slot: TimeSlot & { booked: number }; onPress: () => void }) {
  const isClosed = slot.state === 'closed';
  const isBlocked = slot.state === 'blocked';
  const isReserved = slot.state === 'reserved';
  const backgroundColor = isClosed
    ? AppColors.surfaceContainerLow
    : isBlocked
    ? AppColors.danger
    : isReserved
    ? AppColors.primaryDeep
    : AppColors.white;
  const borderColor = isBlocked ? AppColors.danger : isReserved ? AppColors.primaryDeep : AppColors.borderStrong;
  const textColor = isClosed ? AppColors.neutral : isBlocked || isReserved ? AppColors.white : AppColors.ink;

  const subLabel = isReserved
    ? `정원 마감 ${slot.booked}/${ownerStore.maxCapacity}명`
    : slot.booked > 0
    ? `${slot.booked}/${ownerStore.maxCapacity}명 예약됨`
    : null;

  return (
    <Pressable
      disabled={isClosed || isReserved}
      onPress={onPress}
      style={[styles.slotCell, { backgroundColor }, { borderColor }]}
    >
      <Text style={[styles.slotLabel, { color: textColor }]}>{slot.label}</Text>
      {subLabel && <Text style={[styles.slotSubLabel, { color: isReserved || isBlocked ? AppColors.white : AppColors.inkSecondary }]}>{subLabel}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s14,
  },
  topBarTitle: { ...Typography.titleMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s18, gap: AppSpacing.s18, paddingBottom: 100 },
  monthTitle: { ...Typography.headlineMD, color: AppColors.ink },
  weekRow: { gap: AppSpacing.s8 },
  dayCell: {
    width: 56,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.s6,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  dayCellLabel: { ...Typography.labelMD, color: AppColors.inkSecondary },
  dayCellNumber: { ...Typography.headlineSM, color: AppColors.ink },
  timelineHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: AppSpacing.s10 },
  timelineTitle: { ...Typography.headlineSM, color: AppColors.ink },
  legendRow: { flexDirection: 'row', gap: AppSpacing.s14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDotAvailable: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  legendText: { ...Typography.labelMD, color: AppColors.inkSecondary },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: AppSpacing.s10 },
  slotCell: {
    width: '47%',
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s14,
    borderRadius: AppRadius.md,
    borderWidth: 1,
  },
  slotLabel: { ...Typography.headlineSM },
  slotSubLabel: { ...Typography.labelSM, marginTop: AppSpacing.s2 },
  saveButton: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s8,
    paddingHorizontal: AppSpacing.s20,
    paddingVertical: AppSpacing.s14,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.primaryDeep,
    shadowColor: AppColors.primaryDeep,
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  saveButtonText: { ...Typography.titleMD, color: AppColors.white },
});
