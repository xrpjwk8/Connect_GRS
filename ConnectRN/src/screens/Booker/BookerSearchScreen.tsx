import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

const RECENT_SEARCHES = ['신촌 · 25명 · 19:00', '건대 · 12명 · 20:00', '혜화 · 30명 · 18:00'];

export default function BookerSearchScreen() {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>어디로 떠나실까요?</Text>

        <Pressable style={styles.filterButton} onPress={() => setShowFilter(true)}>
          <Ionicons name="options-outline" size={18} color={AppColors.ink} />
          <Text style={styles.filterButtonText}>필터로 단체석 찾기</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={18} color={AppColors.inkSecondary} />
        </Pressable>

        <Text style={styles.sectionTitle}>최근 검색</Text>

        {RECENT_SEARCHES.map((recent) => (
          <View key={recent} style={styles.recentRow}>
            <Ionicons name="time-outline" size={16} color={AppColors.inkSecondary} />
            <Text style={styles.recentText}>{recent}</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="close" size={16} color={AppColors.neutral} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  scrollContent: {
    paddingHorizontal: AppSpacing.s18,
    paddingTop: AppSpacing.s8,
    paddingBottom: AppSpacing.s18,
    gap: AppSpacing.s16,
  },
  title: { ...Typography.headlineLG, color: AppColors.ink },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s10,
    padding: AppSpacing.s16,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  filterButtonText: { ...Typography.titleMD, color: AppColors.ink },
  sectionTitle: { ...Typography.headlineSM, color: AppColors.ink, marginTop: AppSpacing.s12 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s10,
    paddingVertical: AppSpacing.s10,
    paddingHorizontal: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.md,
  },
  recentText: { ...Typography.bodyLG, color: AppColors.ink },
});
