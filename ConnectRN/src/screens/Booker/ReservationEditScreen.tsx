import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppDatePicker from '../../components/AppDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { GhostButton, LimeButton } from '../../components/Buttons';
import { updateReservation } from '../../api/reservations';

const TIME_ROWS: string[][] = [
  ['17:00', '17:30', '18:00', '18:30'],
  ['19:00', '19:30', '20:00', '20:30'],
  ['21:00', '21:30', '22:00', '22:30'],
  ['23:00', '23:30', '24:00', ''],
];
const MAX_CONSECUTIVE_SLOTS = 6;
const ALL_TIMES = TIME_ROWS.flat().filter((t) => t !== '');

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

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ReservationEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const reservationId: string = route.params.reservationId;
  const { myReservations, refreshReservations } = useAppState();

  const currentReservation = useMemo(
    () => myReservations.find((r) => r.id === reservationId),
    [myReservations, reservationId]
  );

  const [date, setDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const peopleInputRef = useRef<TextInput>(null);
  const [peopleText, setPeopleText] = useState('0');
  const [budgetText, setBudgetText] = useState('');
  const [eventPurpose, setEventPurpose] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentReservation) return;
    setDate(currentReservation.dateValue ?? new Date());
    setSelectedTimes(currentReservation.timeLabels);
    setPeopleText(String(currentReservation.people));
    setBudgetText(currentReservation.budget != null ? String(currentReservation.budget) : '');
    setEventPurpose(currentReservation.eventPurpose);
    setRequestMessage(currentReservation.requestMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

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
    return `${sorted[0]} ~ ${addThirtyMinutes(sorted[sorted.length - 1])} (${sorted.length}칸)`;
  }, [selectedTimes]);

  const handleSave = () => {
    const peopleNum = Number(peopleText) || 0;
    if (peopleNum < 1) {
      showAlert('입력을 확인해주세요', '인원을 1명 이상 입력해주세요.');
      return;
    }
    if (selectedTimes.length === 0) {
      showAlert('입력을 확인해주세요', '예약 시간을 선택해주세요.');
      return;
    }
    if (!currentReservation) {
      navigation.goBack();
      return;
    }

    showAlert('예약을 수정하시겠습니까?', '변경한 내용으로 예약 정보가 저장돼요.', [
      { text: '아니요', style: 'cancel' },
      { text: '예, 수정합니다', onPress: () => submitSave(peopleNum) },
    ]);
  };

  const submitSave = async (peopleNum: number) => {
    const sorted = [...selectedTimes].sort((a, b) => ALL_TIMES.indexOf(a) - ALL_TIMES.indexOf(b));
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;

    setSaving(true);
    try {
      await updateReservation(reservationId, {
        date: isoDate,
        timeSlots: sorted.map((t) => `${t}:00`),
        people: peopleNum,
        budgetPerPerson: budgetText ? Number(budgetText) : undefined,
        eventPurpose,
        requestMessage,
      });
      await refreshReservations();
      showAlert('변경 사항이 저장되었습니다', "'내 예약' 목록에서 변경된 정보를 확인할 수 있어요.", [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      showAlert('저장에 실패했어요', '네트워크 연결을 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={20} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>예약 수정</Text>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.storeHeaderRow}>
          <View style={styles.storeThumb}>
            <Ionicons name={(currentReservation?.imageSymbol as any) ?? 'restaurant-outline'} size={22} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={styles.storeName}>{currentReservation?.storeName ?? ''}</Text>
            <Text style={styles.storeDateLabel}>{currentReservation?.dateLabel ?? ''}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.fieldTitle}>날짜</Text>
          <View style={styles.datePickerBox}>
            <AppDatePicker value={date} minimumDate={startOfToday()} onChange={setDate} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.timeSelectorHeader}>
            <Text style={styles.fieldTitle}>시간</Text>
            <Text style={styles.timeSelectorHint}>(연속, 최대 6칸)</Text>
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
                    <Pressable
                      key={t}
                      onPress={() => toggleTime(t)}
                      style={[
                        styles.timeCell,
                        { backgroundColor: selectedTimes.includes(t) ? AppColors.primary : AppColors.white },
                        { borderColor: selectedTimes.includes(t) ? AppColors.primaryDim : AppColors.borderStrong },
                      ]}
                    >
                      <Text style={styles.timeCellText}>{t}</Text>
                    </Pressable>
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
              value={budgetText}
              onChangeText={(text) => setBudgetText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
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
              placeholder="점주님께 전달할 요청 사항을 입력해주세요."
              placeholderTextColor={AppColors.neutral}
              multiline
              maxLength={100}
            />
          </View>
          <Text style={[styles.counterText, requestMessage.length >= 100 && { color: AppColors.danger }]}>
            {requestMessage.length} / 100
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <GhostButton title="취소" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
        <LimeButton
          title={saving ? '저장 중...' : '변경 저장'}
          style={{ flex: 1, borderRadius: AppRadius.lg }}
          onPress={handleSave}
          disabled={saving}
        />
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
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s18, gap: AppSpacing.s18 },
  storeHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s12 },
  storeThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { ...Typography.headlineSM, color: AppColors.ink },
  storeDateLabel: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  divider: { height: 1, backgroundColor: AppColors.borderStrong },
  section: { gap: AppSpacing.s10 },
  fieldTitle: { ...Typography.titleMD, color: AppColors.ink },
  fieldHint: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  rowBaseline: { flexDirection: 'row', alignItems: 'baseline', gap: AppSpacing.s6 },
  datePickerBox: {
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    paddingVertical: AppSpacing.s8,
    paddingHorizontal: AppSpacing.s8,
    alignItems: 'center',
  },
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
  bottomBar: {
    flexDirection: 'row',
    gap: AppSpacing.s10,
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s12,
    backgroundColor: AppColors.white,
  },
});
