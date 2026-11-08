import BackButton from '../../components/BackButton';
import StorePhoto from '../../components/StorePhoto';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { useRefreshOnFocus } from '../../hooks/useServer';
import DataStatus from '../../components/DataStatus';
import { RatingView } from '../../components/CommonComponents';
import Card from '../../components/Card';
import type { Store } from '../../models/types';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { favorites } = useAppState();
  useRefreshOnFocus();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.titleText}>찜한 가게</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DataStatus /><View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color={AppColors.inkSecondary} />
          <Text style={styles.infoText}>마음에 드는 가게를 저장하고 다시 찾아보세요.</Text>
        </View>

        {favorites.map((store) => (
          <FavoriteCard key={store.id} store={store} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FavoriteCard({ store }: { store: Store }) {
  const navigation = useNavigation<any>();
  return (
    <Card padding={0} style={styles.card}>
      <View style={styles.cardImageWrap}>
        <StorePhoto path={store.photoPath} style={StyleSheet.absoluteFill} />
        <View style={styles.heartBadge}>
          <Ionicons name="heart" size={16} color={AppColors.primary} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.metricsAvailable !== false ? <RatingView rating={store.rating} count={null} /> : null}
        </View>

        <View style={styles.cardMetaRow}>
          <Ionicons name="people-outline" size={14} color={AppColors.inkSecondary} />
          <Text style={styles.cardMetaText}>최대 {store.maxCapacity}명</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.reserveButton} onPress={() => navigation.navigate('StoreDetail', { store })}>
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
