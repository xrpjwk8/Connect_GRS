import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppDatePicker from '../../components/AppDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useFilterMetadata } from '../../hooks/useFilterMetadata';
import type { SearchFilter } from '../../models/types';

const AVAILABLE_REGION = '신촌';
const DEFAULT_REGION = '신촌';
const DEFAULT_PEOPLE = '25';
const DEFAULT_TIME = '상관없음';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SearchFilterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onApply: ((filter: SearchFilter) => void) | undefined = route.params?.onApply;
  const { regions, timeOptions } = useFilterMetadata();

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [date, setDate] = useState(new Date());
  const peopleInputRef = useRef<TextInput>(null);
  const [peopleText, setPeopleText] = useState(DEFAULT_PEOPLE);
  const [time, setTime] = useState(DEFAULT_TIME);

  const handleReset = () => {
    setRegion(DEFAULT_REGION);
    setDate(new Date());
    setPeopleText(DEFAULT_PEOPLE);
    setTime(DEFAULT_TIME);
  };

  const handleApply = () => {
    onApply?.({ region, date, people: Number(peopleText) || 0, time });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={20} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle} pointerEvents="none">
          검색 조건
        </Text>
        <Pressable onPress={handleReset} hitSlop={8}>
          <Text style={styles.resetText}>초기화</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지역 선택</Text>
          <View style={styles.regionGrid}>
            {regions.map((r) => {
              const selected = r === region;
              const available = r === AVAILABLE_REGION;
              return (
                <Pressable
                  key={r}
                  disabled={!available}
                  onPress={() => setRegion(r)}
                  style={[
                    styles.regionCell,
                    { backgroundColor: selected ? AppColors.primary : AppColors.white },
                    { borderColor: selected ? AppColors.primary : AppColors.borderStrong },
                    !available && styles.regionCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.regionCellText,
                      { color: selected ? AppColors.onPrimary : available ? AppColors.ink : AppColors.neutral },
                    ]}
                  >
                    {r}
                  </Text>
                  {!available && <Text style={styles.regionCellHint}>오픈 예정</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>날짜</Text>
          <View style={styles.datePickerBox}>
            <AppDatePicker value={date} minimumDate={startOfToday()} onChange={setDate} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>인원</Text>
            <Text style={styles.groupHint}>단체 예약 (10명 이상)</Text>
          </View>
          <Pressable style={styles.peopleBox} onPress={() => peopleInputRef.current?.focus()}>
            <TextInput
              ref={peopleInputRef}
              style={styles.peopleInput}
              value={peopleText}
              onChangeText={(text) => setPeopleText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              textAlign="center"
            />
            <Text style={styles.peopleUnit}>명</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.rowBaseline}>
            <Text style={styles.sectionTitle}>시간</Text>
            <Text style={styles.optionalHint}>(선택)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
            {timeOptions.map((t) => {
              const selected = t === time;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTime(t)}
                  style={[
                    styles.timeChip,
                    { backgroundColor: selected ? AppColors.ink : AppColors.white },
                    { borderColor: selected ? AppColors.ink : AppColors.borderStrong },
                  ]}
                >
                  <Text style={[styles.timeChipText, { color: selected ? AppColors.white : AppColors.ink }]}>{t}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.applyButton} onPress={handleApply}>
          <Ionicons name="search" size={18} color={AppColors.ink} />
          <Text style={styles.applyButtonText}>필터 적용하기</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  topBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s14,
  },
  topBarTitle: {
    ...Typography.titleMD,
    color: AppColors.ink,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  resetText: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s18, gap: 28 },
  section: { gap: AppSpacing.s14 },
  sectionTitle: { ...Typography.headlineSM, color: AppColors.ink },
  divider: { height: 1, backgroundColor: AppColors.borderStrong },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: AppSpacing.s8 },
  regionCell: {
    width: '23%',
    paddingVertical: AppSpacing.s12,
    alignItems: 'center',
    borderRadius: AppRadius.md,
    borderWidth: 1,
  },
  regionCellText: { ...Typography.bodyMD },
  regionCellDisabled: { opacity: 0.55 },
  regionCellHint: { ...Typography.labelSM, color: AppColors.neutral, marginTop: AppSpacing.s2 },
  datePickerBox: {
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    paddingVertical: AppSpacing.s8,
    paddingHorizontal: AppSpacing.s8,
    alignItems: 'center',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBaseline: { flexDirection: 'row', alignItems: 'baseline', gap: AppSpacing.s6 },
  groupHint: { ...Typography.bodyMD, color: AppColors.primaryDeep },
  optionalHint: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  peopleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.s6,
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s18,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  peopleInput: { fontSize: 20, fontWeight: '800', color: AppColors.ink, minWidth: 36, textAlign: 'center', padding: 0 },
  peopleUnit: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  timeRow: { gap: AppSpacing.s10 },
  timeChip: {
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s10,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  timeChipText: { ...Typography.bodyMD },
  footer: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12 },
  applyButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.s8,
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.pill,
  },
  applyButtonText: { ...Typography.titleMD, color: AppColors.ink },
});
