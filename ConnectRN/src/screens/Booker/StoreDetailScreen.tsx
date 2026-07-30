import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { InfoBanner, TagLabel } from '../../components/CommonComponents';
import { isSameDay } from '../../utils/date';
import type { Store } from '../../models/types';

const TIME_ROWS: string[][] = [
  ['17:00', '17:30', '18:00', '18:30'],
  ['19:00', '19:30', '20:00', '20:30'],
  ['21:00', '21:30', '22:00', '22:30'],
  ['23:00', '23:30', '24:00', ''],
];
const PAST_TIMES = new Set(['17:00', '17:30']);
const MAX_CONSECUTIVE_SLOTS = 6;
const ALL_TIMES = TIME_ROWS.flat().filter((t) => t !== '');
const WEEKDAY_LETTERS = ['일', '월', '화', '수', '목', '금', '토'];

function addThirtyMinutes(timeString: string): string {
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeString;
  const totalMinutes = hour * 60 + minute + 30;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
}

export default function StoreDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const store: Store = route.params.store;
  const {
    selectedSearchDate,
    myReservations,
    setMyReservations,
    setSelectedBookerTab,
    realName,
    schoolName,
    departmentName,
    capacityOverbookingEnabled,
  } = useAppState();

  const [isFavorite, setIsFavorite] = useState(store.isFavorite);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const peopleInputRef = useRef<TextInput>(null);
  const [peopleText, setPeopleText] = useState('18');
  const [budget, setBudget] = useState('25000');
  const [eventPurpose, setEventPurpose] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const anchor = selectedSearchDate ?? new Date();
  const selectedDateLabel = `${anchor.getMonth() + 1}월 ${anchor.getDate()}일 (${WEEKDAY_LETTERS[anchor.getDay()]})`;

  const toggleTime = (t: string) => {
    const idx = ALL_TIMES.indexOf(t);
    if (idx === -1) return;

    if (selectedTimes.includes(t)) {
      setSelectedTimes(selectedTimes.filter((s) => ALL_TIMES.indexOf(s) < idx));
      return;
    }

    const selectedIdx = selectedTimes.map((s) => ALL_TIMES.indexOf(s)).sort((a, b) => a - b);
    if (selectedIdx.length === 0) {
      setSelectedTimes([...selectedTimes, t]);
      return;
    }

    if (selectedTimes.length >= MAX_CONSECUTIVE_SLOTS) return;

    const first = selectedIdx[0];
    const last = selectedIdx[selectedIdx.length - 1];
    if (idx === first - 1 || idx === last + 1) {
      setSelectedTimes([...selectedTimes, t]);
    }
  };

  const selectedTimeRangeLabel = useMemo(() => {
    const sorted = [...selectedTimes].sort((a, b) => ALL_TIMES.indexOf(a) - ALL_TIMES.indexOf(b));
    if (sorted.length === 0) return '';
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return `${first} ~ ${addThirtyMinutes(last)} (${sorted.length}칸)`;
  }, [selectedTimes]);

  const handleSubmit = () => {
    if (selectedTimes.length === 0) {
      Alert.alert('입력을 확인해주세요', '예약 시간을 선택해주세요.');
      return;
    }
    const peopleNum = Number(peopleText) || 0;
    if (peopleNum < 1) {
      Alert.alert('입력을 확인해주세요', '인원을 1명 이상 입력해주세요.');
      return;
    }

    const sortedTimes = [...selectedTimes].sort((a, b) => ALL_TIMES.indexOf(a) - ALL_TIMES.indexOf(b));
    const timeLabel = sortedTimes.length === 1 ? sortedTimes[0] : `${sortedTimes[0]} ~ ${sortedTimes[sortedTimes.length - 1]}`;
    const dateLabel = `${selectedDateLabel} ${timeLabel}`;

    const dateValue = new Date(anchor);

    const bookedPeopleAt = (time: string) =>
      myReservations
        .filter(
          (r) =>
            r.storeId === store.id &&
            r.status === 'confirmed' &&
            r.dateValue &&
            isSameDay(r.dateValue, dateValue) &&
            r.timeLabels.includes(time)
        )
        .reduce((sum, r) => sum + r.people, 0);

    const overCapacity = sortedTimes.some((t) => {
      const booked = bookedPeopleAt(t);
      if (!capacityOverbookingEnabled) return booked > 0;
      return booked + peopleNum > store.maxCapacity;
    });
    if (overCapacity) {
      Alert.alert(
        '예약 불가',
        capacityOverbookingEnabled
          ? '선택하신 시간대는 매장 정원이 가득 찼어요. 인원을 줄이거나 다른 시간을 선택해주세요.'
          : '선택하신 시간대는 이미 다른 예약으로 차단되어 있어요. 다른 시간을 선택해주세요.'
      );
      return;
    }

    setMyReservations([
      {
        id: `res-${Date.now()}`,
        storeId: store.id,
        storeName: store.name,
        imageSymbol: store.imageName,
        status: 'pending',
        dateLabel,
        people: peopleNum,
        budget: Number(budget) || undefined,
        bookerName: realName.trim() || '예약자',
        bookerAffiliation: schoolName.trim()
          ? `${schoolName.trim()}${departmentName.trim() ? ` · ${departmentName.trim()}` : ''}`
          : '학교 정보 미입력',
        dateValue,
        timeLabels: sortedTimes,
        eventPurpose,
        requestMessage,
      },
      ...myReservations,
    ]);

    Alert.alert('예약 신청 완료', '점주님께 예약 요청을 보냈어요.\n‘내 예약’ 탭에서 진행 상황을 확인할 수 있어요.', [
      {
        text: '내 예약 보기',
        onPress: () => {
          setSelectedBookerTab(2);
          navigation.goBack();
        },
      },
      { text: '닫기', style: 'cancel', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerImage}>
          <Ionicons name={store.imageName as any} size={48} color="rgba(255,255,255,0.45)" />
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBadge} onPress={() => setIsFavorite(!isFavorite)}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? AppColors.danger : AppColors.white}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tagRow}>
            <TagLabel text="일식 펍" color={AppColors.ink} textColor={AppColors.white} />
            <TagLabel text="오마카세" />
          </View>

          <Text style={styles.storeName}>{store.name}</Text>

          <View style={styles.kpiRow}>
            <Kpi icon="star" label="별점" value={store.rating.toFixed(1)} sub={`(${store.reviewCount})`} />
            <Kpi icon="people-outline" label="단체수용인원" value={`최대 ${store.maxCapacity}명`} />
          </View>
          <View style={styles.kpiRow}>
            <Kpi icon="cash-outline" label="1인당 평균가" value={`₩${store.pricePerPerson.toLocaleString()}`} />
            <Kpi
              icon="checkmark-circle"
              label="예약 수락률"
              value={`${store.acceptanceRate}%`}
              sub="우수"
              bg="rgba(214,255,61,0.25)"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.reservationHeaderRow}>
          <Ionicons name="calendar-outline" size={18} color={AppColors.ink} />
          <Text style={styles.reservationHeaderText}>예약 정보 입력</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldTitle}>날짜</Text>
          <View style={styles.selectedDateBox}>
            <Ionicons name="calendar-outline" size={18} color={AppColors.ink} />
            <Text style={styles.selectedDateText}>{selectedDateLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.timeSelectorHeader}>
            <Text style={styles.fieldTitle}>시간 선택</Text>
            <Text style={styles.timeSelectorHint}>(연속된 시간, 최대 6칸)</Text>
            <View style={{ flex: 1 }} />
            {selectedTimes.length > 0 && <Text style={styles.timeRangeLabel}>{selectedTimeRangeLabel}</Text>}
          </View>
          <View style={{ gap: 8 }}>
            {TIME_ROWS.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.timeRow}>
                {row.map((t, colIdx) =>
                  t === '' ? (
                    <View key={colIdx} style={{ flex: 1 }} />
                  ) : (
                    <TimeCell key={t} time={t} selected={selectedTimes.includes(t)} onPress={() => toggleTime(t)} />
                  )
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldTitle}>인원</Text>
          <Pressable style={styles.inputBox} onPress={() => peopleInputRef.current?.focus()}>
            <Ionicons name="people" size={18} color={AppColors.inkSecondary} />
            <TextInput
              ref={peopleInputRef}
              style={styles.peopleInput}
              value={peopleText}
              onChangeText={(text) => setPeopleText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
            />
            <View style={{ flex: 1 }} />
            <Text style={styles.inputSuffix}>명</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBaseline}>
            <Text style={styles.fieldTitle}>예산</Text>
            <Text style={styles.fieldHint}>(1인당)</Text>
          </View>
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>₩</Text>
            <TextInput
              style={styles.budgetInput}
              value={budget}
              onChangeText={(text) => setBudget(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="25000"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldTitle}>행사 목적</Text>
          <View style={styles.textAreaBox}>
            <TextInput
              style={styles.textAreaSmall}
              value={eventPurpose}
              onChangeText={(text) => setEventPurpose(text.slice(0, 15))}
              placeholder="예: 종강파티, 대동제 뒷풀이 등"
              placeholderTextColor={AppColors.neutral}
              multiline
              maxLength={15}
            />
          </View>
          <Text style={[styles.counterText, eventPurpose.length >= 15 && { color: AppColors.danger }]}>
            {eventPurpose.length} / 15
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldTitle}>요청 사항</Text>
          <View style={styles.textAreaBox}>
            <TextInput
              style={styles.textAreaLarge}
              value={requestMessage}
              onChangeText={(text) => setRequestMessage(text.slice(0, 100))}
              placeholder="점주님께 전달할 요청 사항을 입력해주세요. (예: 생일 케이크 반입 가능할까요?)"
              placeholderTextColor={AppColors.neutral}
              multiline
              maxLength={100}
            />
          </View>
          <Text style={[styles.counterText, requestMessage.length >= 100 && { color: AppColors.danger }]}>
            {requestMessage.length} / 100
          </Text>
        </View>

        <InfoBanner
          title="예약 안내"
          message="단체 예약은 확정 전 점주님의 확인이 필요할 수 있습니다. 입력하신 예산에 맞춰 메뉴를 추천해 드릴 수 있습니다."
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <BlurView intensity={40} tint="light" style={styles.bottomCTA}>
        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>예약 신청하기</Text>
          <Ionicons name="arrow-forward" size={18} color={AppColors.ink} />
        </Pressable>
      </BlurView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  bg = AppColors.surfaceContainerLow,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  sub?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.kpi, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={AppColors.primaryDeep} />
      <View style={{ flex: 1 }}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <View style={styles.kpiValueRow}>
          <Text style={styles.kpiValue}>{value}</Text>
          {sub && <Text style={styles.kpiSub}>{sub}</Text>}
        </View>
      </View>
    </View>
  );
}

function TimeCell({ time, selected, onPress }: { time: string; selected: boolean; onPress: () => void }) {
  const isPast = PAST_TIMES.has(time);
  return (
    <Pressable
      disabled={isPast}
      onPress={onPress}
      style={[
        styles.timeCell,
        { backgroundColor: selected ? AppColors.primary : isPast ? AppColors.surfaceContainerLow : AppColors.white },
        { borderColor: selected ? AppColors.primaryDim : AppColors.borderStrong },
      ]}
    >
      <Text
        style={[
          styles.timeCellText,
          { color: isPast ? AppColors.neutral : AppColors.ink },
          isPast && { textDecorationLine: 'line-through' },
        ]}
      >
        {time}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  scrollContent: { paddingHorizontal: AppSpacing.s18, gap: AppSpacing.s18 },
  headerImage: {
    height: 220,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: AppSpacing.s10,
  },
  iconBadge: {
    padding: AppSpacing.s10,
    borderRadius: AppRadius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  section: { gap: AppSpacing.s14 },
  tagRow: { flexDirection: 'row', gap: AppSpacing.s8 },
  storeName: { ...Typography.displayHero, color: AppColors.ink },
  kpiRow: { flexDirection: 'row', gap: AppSpacing.s10 },
  kpi: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s10, padding: AppSpacing.s12, borderRadius: AppRadius.md },
  kpiLabel: { ...Typography.labelMD, color: AppColors.inkSecondary },
  kpiValueRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s4 },
  kpiValue: { ...Typography.titleMD, color: AppColors.ink },
  kpiSub: { ...Typography.labelMD, color: AppColors.primaryDeep },
  divider: { height: 1, backgroundColor: AppColors.borderStrong },
  reservationHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  reservationHeaderText: { ...Typography.headlineSM, color: AppColors.ink },
  fieldTitle: { ...Typography.titleMD, color: AppColors.ink },
  fieldHint: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  rowBaseline: { flexDirection: 'row', alignItems: 'baseline', gap: AppSpacing.s6 },
  selectedDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s8,
    padding: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  selectedDateText: { ...Typography.headlineSM, color: AppColors.ink },
  timeSelectorHeader: { flexDirection: 'row', alignItems: 'baseline', gap: AppSpacing.s6 },
  timeSelectorHint: { ...Typography.labelMD, color: AppColors.inkSecondary },
  timeRangeLabel: { ...Typography.labelMD, color: AppColors.primaryDeep },
  timeRow: { flexDirection: 'row', gap: AppSpacing.s8 },
  timeCell: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  timeCellText: { ...Typography.bodyLG },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s8,
    padding: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  peopleInput: { ...Typography.headlineSM, color: AppColors.ink, flexShrink: 0, minWidth: 40 },
  inputSuffix: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  inputPrefix: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  budgetInput: { ...Typography.bodyLG, color: AppColors.ink, flex: 1 },
  textAreaBox: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    padding: AppSpacing.s8,
  },
  textAreaSmall: { ...Typography.bodyLG, color: AppColors.ink, minHeight: 60, padding: AppSpacing.s6, textAlignVertical: 'top' },
  textAreaLarge: { ...Typography.bodyMD, color: AppColors.ink, minHeight: 80, padding: AppSpacing.s6, textAlignVertical: 'top' },
  counterText: { ...Typography.labelMD, color: AppColors.neutral, textAlign: 'right' },
  bottomCTA: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12 },
  submitButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.s8,
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.pill,
  },
  submitButtonText: { ...Typography.titleMD, color: AppColors.ink },
});
