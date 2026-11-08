import BackButton from '../../components/BackButton';
import useNativeBack from '../../navigation/useNativeBack';
import { rpc } from '../../services/backend';
import { useServerAction, useRefreshOnFocus } from '../../hooks/useServer';
import { showAlert } from '../../utils/alert';
import DataStatus from '../../components/DataStatus';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { minuteLabel, serviceDate, slotSelection } from '../../utils/reservation';
import { useAppState, useTypography } from '../../state/AppState';
import { FormLabel, InfoBanner } from '../../components/CommonComponents';
import { parseDateKey } from '../../utils/date';

const WEEKDAY_LETTERS = ['일', '월', '화', '수', '목', '금', '토'];
const MEMO_LIMIT = 30;
const MAX_CONSECUTIVE_SLOTS = 6;


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
  const goBack = useNativeBack();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { myReservations, ownerStore } = useAppState();
  const action = useServerAction();
  useRefreshOnFocus();
  const OPEN_STARTS = Array.from({ length: ((ownerStore?.closingMinute ?? 1470) - (ownerStore?.openingMinute ?? 1020)) / 30 }, (_, i) => minuteLabel((ownerStore?.openingMinute ?? 1020) + i * 30));
  const Typography = useTypography('owner');
  const styles = useMemo(() => makeStyles(Typography), [Typography]);

  const selectedDate = useMemo(
    () => (route.params?.dateKey ? parseDateKey(route.params.dateKey) : new Date()),
    [route.params?.dateKey]
  );
  const selectedDateLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${WEEKDAY_LETTERS[selectedDate.getDay()]})`;

  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [peopleText, setPeopleText] = useState('');
  const [bookerLabel, setBookerLabel] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [memo, setMemo] = useState('');
  const peopleInputRef = useRef<TextInput>(null);

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

  const handleSubmit = () => action.run(async () => {
    if (!ownerStore) throw new Error('매장을 등록해주세요.');
    if (!bookerLabel.trim()) throw new Error('대표 예약자명을 입력해주세요.');
    const payload = { p_store_id: ownerStore.id, p_service_date: serviceDate(selectedDate), ...slotSelection(sortedTimes),
      p_people: Number(peopleText), p_booker_name: bookerLabel.trim(), p_booker_affiliation: affiliation.trim(), p_event_purpose: memo.trim() };
    if (!Number.isInteger(payload.p_people) || payload.p_people < 1) throw new Error('인원을 확인해주세요.');
    await rpc('create_manual_reservation', { ...payload, p_request_id: action.requestId(payload) });
  }, () => navigation.goBack());

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <BackButton onPress={goBack} />
        <Text style={styles.topBarTitle}>새 예약 등록</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <InfoBanner
          title="오프라인 예약 등록"
          message="전화 등 앱 밖에서 받은 예약을 등록하면 캘린더와 시간표에 바로 반영돼요."
          appRole="owner"
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

        <View style={styles.field}>
          <FormLabel title="대표 예약자명" required appRole="owner" />
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={bookerLabel}
              onChangeText={setBookerLabel}
              placeholder="예: 김민준"
              maxLength={80}
              placeholderTextColor={AppColors.neutral}
            />
          </View>
        </View>

        <View style={styles.field}>
          <FormLabel title="소속 / 단체명 (선택)" appRole="owner" />
          <View style={styles.inputBox}>
            <TextInput style={styles.textInput} value={affiliation} onChangeText={setAffiliation}
              maxLength={160} placeholder="예: 경영학과 학생회" placeholderTextColor={AppColors.neutral} />
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
        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={action.busy}>
          <Text style={styles.submitButtonText}>예약 등록하기</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (Typography: Record<string, TextStyle>) =>
  StyleSheet.create({
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
