import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { defaultTimeSlots } from '../../models/mockData';
import { useAppState } from '../../state/AppState';
import { InfoBanner } from '../../components/CommonComponents';
import { parseDateKey } from '../../utils/date';

const WEEKDAY_LETTERS = ['일', '월', '화', '수', '목', '금', '토'];
const MEMO_LIMIT = 30;
const MAX_CONSECUTIVE_SLOTS = 6;
const OPEN_STARTS = defaultTimeSlots.filter((s) => s.state !== 'closed').map((s) => s.label.split(' ~ ')[0]);

function toKoreanTime(time: string): string {
  const [hour, minute] = time.split(':');
  return `${Number(hour)}시 ${minute}분`;
}

function addThirtyMinutes(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const totalMinutes = Number(hourStr) * 60 + Number(minuteStr) + 30;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
}

export default function ManualReservationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { myReservations, setMyReservations, ownerStoreInfo } = useAppState();

  const selectedDate = useMemo(
    () => (route.params?.dateKey ? parseDateKey(route.params.dateKey) : new Date()),
    [route.params?.dateKey]
  );
  const selectedDateLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${WEEKDAY_LETTERS[selectedDate.getDay()]})`;

  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [peopleText, setPeopleText] = useState('');
  const [bookerLabel, setBookerLabel] = useState('');
  const [memo, setMemo] = useState('');

  const toggleTime = (t: string) => {
    const idx = OPEN_STARTS.indexOf(t);
    if (idx === -1) return;

    if (selectedTimes.includes(t)) {
      setSelectedTimes(selectedTimes.filter((s) => OPEN_STARTS.indexOf(s) < idx));
      return;
    }

    const selectedIdx = selectedTimes.map((s) => OPEN_STARTS.indexOf(s)).sort((a, b) => a - b);
    if (selectedIdx.length === 0) {
      setSelectedTimes([t]);
      return;
    }
    if (selectedTimes.length >= MAX_CONSECUTIVE_SLOTS) return;

    const first = selectedIdx[0];
    const last = selectedIdx[selectedIdx.length - 1];
    if (idx === first - 1 || idx === last + 1) {
      setSelectedTimes([...selectedTimes, t]);
    }
  };

  const sortedTimes = [...selectedTimes].sort((a, b) => OPEN_STARTS.indexOf(a) - OPEN_STARTS.indexOf(b));
  const selectedTimeRangeLabel =
    sortedTimes.length > 0
      ? `${toKoreanTime(sortedTimes[0])} ~ ${toKoreanTime(addThirtyMinutes(sortedTimes[sortedTimes.length - 1]))}`
      : '';

  const handleSubmit = () => {
    if (sortedTimes.length === 0) {
      showAlert('입력을 확인해주세요', '예약 시간대를 선택해주세요.');
      return;
    }
    const peopleNum = Number(peopleText) || 0;
    if (peopleNum < 1) {
      showAlert('입력을 확인해주세요', '인원을 1명 이상 입력해주세요.');
      return;
    }

    const timeLabel =
      sortedTimes.length === 1 ? sortedTimes[0] : `${sortedTimes[0]} ~ ${sortedTimes[sortedTimes.length - 1]}`;
    const dateLabel = `${selectedDateLabel} ${timeLabel}`;

    setMyReservations([
      {
        id: `manual-${Date.now()}`,
        storeId: ownerStoreInfo?.id,
        storeName: ownerStoreInfo?.name ?? '',
        imageSymbol: ownerStoreInfo?.imageName ?? 'storefront-outline',
        status: 'confirmed',
        dateLabel,
        people: peopleNum,
        bookerName: bookerLabel.trim() || '전화 예약',
        dateValue: selectedDate,
        timeLabels: sortedTimes,
        eventPurpose: memo.trim(),
        requestMessage: '점주가 직접 등록한 오프라인(전화) 예약입니다.',
        isManual: true,
      },
      ...myReservations,
    ]);

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>새 예약 등록</Text>
        <View style={{ width: 18 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <InfoBanner
          title="오프라인 예약 등록"
          message="전화 등 앱 밖에서 받은 예약을 등록하면 캘린더와 시간표에 바로 반영돼요."
        />

        <View style={styles.field}>
          <Text style={styles.fieldTitle}>날짜</Text>
          <View style={styles.selectedDateBox}>
            <Ionicons name="calendar-outline" size={18} color={AppColors.ink} />
            <Text style={styles.selectedDateText}>{selectedDateLabel}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.timeSelectorHeader}>
            <Text style={styles.fieldTitle}>시간대 선택</Text>
            <Text style={styles.timeSelectorHint}>(연속된 시간, 최대 6칸)</Text>
          </View>
          {selectedTimeRangeLabel ? <Text style={styles.timeRangeLabel}>{selectedTimeRangeLabel}</Text> : null}
          <View style={styles.timeGrid}>
            {OPEN_STARTS.map((t) => {
              const selected = selectedTimes.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTime(t)}
                  style={[
                    styles.timeCell,
                    { backgroundColor: selected ? AppColors.primary : AppColors.white },
                    { borderColor: selected ? AppColors.primaryDim : AppColors.borderStrong },
                  ]}
                >
                  <Text style={styles.timeCellText}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldTitle}>인원</Text>
          <View style={styles.inputBox}>
            <Ionicons name="people" size={18} color={AppColors.inkSecondary} />
            <TextInput
              style={styles.peopleInput}
              value={peopleText}
              onChangeText={(text) => setPeopleText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
            />
            <View style={{ flex: 1 }} />
            <Text style={styles.inputSuffix}>명</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldTitle}>예약자 / 단체명 (선택)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={bookerLabel}
              onChangeText={setBookerLabel}
              placeholder="예: 경영학과 학생회"
              placeholderTextColor={AppColors.neutral}
            />
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.keywordHeaderRow}>
            <Text style={styles.fieldTitle}>메모 (선택)</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.memoCountText}>{memo.length}/{MEMO_LIMIT}</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={memo}
              onChangeText={(text) => setMemo(text.slice(0, MEMO_LIMIT))}
              placeholder="예: 2학기 종강파티"
              placeholderTextColor={AppColors.neutral}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>예약 등록하기</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s20 },
  field: { gap: AppSpacing.s10 },
  fieldTitle: { ...Typography.titleMD, color: AppColors.ink },
  selectedDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s8,
    padding: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  selectedDateText: { ...Typography.headlineSM, color: AppColors.ink },
  timeSelectorHeader: { flexDirection: 'row', alignItems: 'baseline', gap: AppSpacing.s6 },
  timeSelectorHint: { ...Typography.labelMD, color: AppColors.inkSecondary },
  timeRangeLabel: { ...Typography.labelMD, color: AppColors.primaryDeep },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: AppSpacing.s8 },
  timeCell: {
    width: '31%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  timeCellText: { ...Typography.bodyLG, color: AppColors.ink },
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
  textInput: { ...Typography.bodyLG, color: AppColors.ink, flex: 1 },
  keywordHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  memoCountText: { ...Typography.labelMD, color: AppColors.inkSecondary },
  footer: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12 },
  submitButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.pill,
  },
  submitButtonText: { ...Typography.titleMD, color: AppColors.ink },
});
