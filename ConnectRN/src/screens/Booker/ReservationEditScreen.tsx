import BackButton from '../../components/BackButton';
import { serviceDate, slotSelection, minuteLabel } from '../../utils/reservation';
import { supabase } from '../../lib/supabase';
import { rpc } from '../../services/backend';
import { useServerAction, useRefreshOnFocus, useServerQuery } from '../../hooks/useServer';
import { showAlert } from '../../utils/alert';
import DataStatus from '../../components/DataStatus';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '../../components/AppDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { GhostButton, LimeButton } from '../../components/Buttons';

const MAX_CONSECUTIVE_SLOTS = 6;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ReservationEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const reservationId: string = route.params.reservationId;
  const { myReservations } = useAppState();
  const action = useServerAction();
  useRefreshOnFocus();

  const currentReservation = useMemo(
    () => myReservations.find((r) => r.id === reservationId),
    [myReservations, reservationId]
  );

  const storeQuery = useServerQuery(currentReservation?.storeId ?? '', async () => {
    if (!currentReservation?.storeId) return null;
    const { data, error } = await supabase.from('stores').select('*').eq('id', currentReservation.storeId).maybeSingle();
    if (error) throw error;
    return data;
  });
  const ALL_TIMES = useMemo(() => {
    const store = storeQuery.data;
    if (!store) return [];
    return Array.from({ length: (store.closing_minute - store.opening_minute) / 30 }, (_, i) => minuteLabel(store.opening_minute + i * 30));
  }, [storeQuery.data]);
  const TIME_ROWS = Array.from({ length: Math.ceil(ALL_TIMES.length / 4) }, (_, i) => ALL_TIMES.slice(i * 4, i * 4 + 4));
  const initialized = useRef<string | null>(null);

  const [date, setDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const peopleInputRef = useRef<TextInput>(null);
  const [peopleText, setPeopleText] = useState('0');
  const [budgetText, setBudgetText] = useState('');
  const [eventPurpose, setEventPurpose] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    if (!currentReservation || initialized.current === reservationId) return;
    initialized.current = reservationId;
    setDate(currentReservation.dateValue ?? new Date());
    setSelectedTimes(currentReservation.timeLabels);
    setPeopleText(String(currentReservation.people));
    setBudgetText(currentReservation.budget != null ? String(currentReservation.budget) : '');
    setEventPurpose(currentReservation.eventPurpose);
    setRequestMessage(currentReservation.requestMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, currentReservation]);

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
    return `${sorted[0]} ~ ${minuteLabel(Number(sorted[sorted.length - 1].split(':')[0]) * 60 + Number(sorted[sorted.length - 1].split(':')[1]) + 30)} (${sorted.length}칸)`;
  }, [selectedTimes, ALL_TIMES]);

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

    showAlert('예약을 수정하시겠습니까?', '수정하면 점주의 재승인이 필요하며, 기존에 확보한 좌석은 해제됩니다.', [
      { text: '아니요', style: 'cancel' },
      { text: '예, 수정합니다', onPress: () => submitSave(peopleNum) },
    ]);
  };

  const submitSave = (peopleNum: number) => action.run(async () => {
    await rpc('edit_reservation', { p_reservation_id: reservationId, p_service_date: serviceDate(date), ...slotSelection(selectedTimes),
      p_people: peopleNum, p_budget_per_person: budgetText ? Number(budgetText) : undefined,
      p_event_purpose: eventPurpose, p_request_message: requestMessage });
  }, () => showAlert('수정 요청 완료', '점주의 재승인을 기다려주세요.', [{ text: '확인', onPress: () => navigation.goBack() }]));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.topBarTitle}>예약 수정</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <DataStatus />
        {storeQuery.loading && <Text>영업시간을 불러오는 중…</Text>}
        {storeQuery.error && <GhostButton title="영업시간 다시 불러오기" onPress={storeQuery.reload} />}
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
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={startOfToday()}
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              onChange={(_event, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
              themeVariant="light"
              accentColor={AppColors.primaryDeep}
            />
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
        <LimeButton title="변경 저장" style={{ flex: 1, borderRadius: AppRadius.lg }} onPress={handleSave} disabled={action.busy || !storeQuery.data || !currentReservation} />
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
