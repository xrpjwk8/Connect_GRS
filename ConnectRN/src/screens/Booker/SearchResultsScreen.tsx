import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { ownerStore, searchResults } from '../../models/mockData';
import { StoreCard } from '../../components/CommonComponents';
import type { SearchFilter, Store } from '../../models/types';

function formatFilterSummary(filter: SearchFilter | null): string {
  if (!filter) return '검색 조건이 설정되지 않았어요';

  const dateStr = `${filter.date.getMonth() + 1}월 ${filter.date.getDate()}일`;
  const parts: string[] = [];
  if (filter.region) parts.push(filter.region);
  parts.push(dateStr);
  parts.push(`${filter.people}명`);
  if (filter.time !== '상관없음' && filter.time) parts.push(filter.time);
  return parts.join(' · ');
}

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const { lastSearchFilter, setLastSearchFilter, setSelectedSearchDate, storePhotoWideUri } = useAppState();

  const handleOpenFilter = () => {
    navigation.navigate('SearchFilter', {
      onApply: (filter: SearchFilter) => {
        setLastSearchFilter(filter);
        setSelectedSearchDate(filter.date);
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="search-outline" size={14} color={AppColors.inkSecondary} />
          <Text style={styles.headerText} numberOfLines={1}>
            {formatFilterSummary(lastSearchFilter)}
          </Text>
        </View>
        <Pressable onPress={handleOpenFilter} hitSlop={8}>
          <Ionicons name="options-outline" size={18} color={AppColors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.resultsTitle}>검색 결과 ({searchResults.length})</Text>
        {searchResults.map((store: Store) => (
          <Pressable key={store.id} onPress={() => navigation.navigate('StoreDetail', { store })}>
            <StoreCard store={store} photoUri={store.id === ownerStore.id ? storePhotoWideUri : undefined} />
          </Pressable>
        ))}
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
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderStrong,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6, flex: 1, marginRight: AppSpacing.s12 },
  headerText: { ...Typography.bodyLG, color: AppColors.ink, flexShrink: 1 },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s12 },
  resultsTitle: { ...Typography.headlineMD, color: AppColors.ink, paddingTop: AppSpacing.s8 },
});
