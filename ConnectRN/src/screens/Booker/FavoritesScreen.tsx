import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { getFavorites } from '../../api/stores';
import { RatingView } from '../../components/CommonComponents';
import Card from '../../components/Card';
import type { Store } from '../../models/types';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { bookerId } = useAppState();
  const [favorites, setFavorites] = useState<Store[]>([]);

  useEffect(() => {
    if (!bookerId) return;
    getFavorites(bookerId)
      .then(setFavorites)
      .catch((e) => console.warn('Failed to load favorites', e));
  }, [bookerId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.titleText}>찜한 가게</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color={AppColors.inkSecondary} />
          <Text style={styles.infoText}>최대 3곳까지 찜 가능해요. 가장 마음에 드는 가게를 골라보세요.</Text>
        </View>

        {favorites.map((store) => (
          <FavoriteCard key={store.id} store={store} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FavoriteCard({ store }: { store: Store }) {
  return (
    <Card padding={0} style={styles.card}>
      <View style={styles.cardImageWrap}>
        <Ionicons name={store.imageName as any} size={36} color="rgba(255,255,255,0.55)" />
        <View style={styles.heartBadge}>
          <Ionicons name="heart" size={16} color={AppColors.primary} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.storeName}>{store.name}</Text>
          <RatingView rating={store.rating} count={null} />
        </View>

        <View style={styles.cardMetaRow}>
          <Ionicons name="people-outline" size={14} color={AppColors.inkSecondary} />
          <Text style={styles.cardMetaText}>최대 {store.maxCapacity}명</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.reserveButton}>
            <Text style={styles.reserveButtonText}>예약하기</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s12,
  },
  backButton: { width: 22 },
  titleText: { ...Typography.titleMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s18, gap: AppSpacing.s14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s8, paddingVertical: AppSpacing.s6 },
  infoText: { ...Typography.bodyMD, color: AppColors.inkSecondary, flex: 1 },
  card: { overflow: 'hidden' },
  cardImageWrap: {
    height: 140,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: AppSpacing.s10,
    borderRadius: AppRadius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardBody: { padding: AppSpacing.s16, gap: AppSpacing.s10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeName: { ...Typography.headlineSM, color: AppColors.ink },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s8 },
  cardMetaText: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  reserveButton: {
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s8,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.primary,
  },
  reserveButtonText: { ...Typography.bodyLG, color: AppColors.ink },
});
