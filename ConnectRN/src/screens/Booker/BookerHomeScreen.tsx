import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { useFilterMetadata } from '../../hooks/useFilterMetadata';
import { ChipButton } from '../../components/CommonComponents';
import type { SearchFilter } from '../../models/types';

export default function BookerHomeScreen() {
  const navigation = useNavigation<any>();
  const { schoolName, setLastSearchFilter, setSelectedSearchDate } = useAppState();
  const { categories } = useFilterMetadata();
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const locationLabel = schoolName.trim() ? `신촌 · ${schoolName.trim()}` : '신촌';

  const handleApplyFilter = (filter: SearchFilter) => {
    setLastSearchFilter(filter);
    setSelectedSearchDate(filter.date);
    setTimeout(() => navigation.navigate('SearchResults'), 250);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location-outline" size={16} color={AppColors.primaryDeep} />
          <Text style={styles.headerLocation}>{locationLabel}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.favoritesButton} onPress={() => navigation.navigate('Favorites')}>
            <Ionicons name="heart-outline" size={14} color={AppColors.ink} />
            <Text style={styles.favoritesButtonText}>찜목록</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          style={styles.searchBar}
          onPress={() => navigation.navigate('SearchFilter', { onApply: handleApplyFilter })}
        >
          <Ionicons name="search-outline" size={18} color={AppColors.inkSecondary} />
          <Text style={styles.searchPlaceholder}>어떤 단체석을 찾고 계세요?</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="options-outline" size={18} color={AppColors.inkSecondary} />
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((c) => (
            <ChipButton key={c} title={c} isSelected={c === selectedCategory} onPress={() => setSelectedCategory(c)} />
          ))}
        </ScrollView>

        <View style={styles.emptyState}>
          <Ionicons name="search-circle-outline" size={36} color={AppColors.inkSecondary} />
          <Text style={styles.emptyStateText}>위 검색창을 눌러{'\n'}조건에 맞는 단체석을 찾아보세요</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  headerLocation: { ...Typography.titleMD, color: AppColors.ink },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s12 },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s4,
    paddingHorizontal: AppSpacing.s10,
    paddingVertical: AppSpacing.s6,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.chipBG,
  },
  favoritesButtonText: { ...Typography.labelMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s24 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s8,
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s14,
    backgroundColor: AppColors.chipBG,
    borderRadius: AppRadius.lg,
  },
  searchPlaceholder: { ...Typography.bodyLG, color: AppColors.neutral },
  chipRow: { gap: AppSpacing.s8 },
  emptyState: { alignItems: 'center', gap: AppSpacing.s8, paddingVertical: AppSpacing.s40 },
  emptyStateText: { ...Typography.bodyLG, color: AppColors.inkSecondary, textAlign: 'center' },
});
