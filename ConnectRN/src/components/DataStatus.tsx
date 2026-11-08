import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAppState } from '../state/AppState';
import { AppColors } from '../theme/colors';
export default function DataStatus() {
  const { refreshing, loadError, refresh, ownerStore, profile } = useAppState();
  return <View style={{ gap: 8 }}>
    {profile?.role === 'owner' && ownerStore && !ownerStore.approved ? <Text style={{ color: AppColors.primaryDeep }}>매장 승인 대기 중입니다. 승인 후 검색 결과에 공개됩니다.</Text> : null}
    {refreshing ? <ActivityIndicator /> : null}
    {loadError ? <Text accessibilityRole="alert" style={{ color: AppColors.danger }}>{loadError}{'\n'}최신 정보를 불러오지 못했습니다.</Text> : null}
    <Pressable disabled={refreshing} onPress={() => void refresh().catch(() => {})} accessibilityRole="button"><Text style={{ color: AppColors.primaryDeep }}>새로고침</Text></Pressable>
  </View>;
}
