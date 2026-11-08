import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useServerQuery } from '../hooks/useServer';
import { listTransfers } from '../services/transfers';
import { useAppState, useTypography } from '../state/AppState';
import TransferCard from './TransferCard';
import { GhostButton } from './Buttons';
import { AppColors } from '../theme/colors';
export default function TransferHomeSection() {
  const navigation = useNavigation<any>(); const T = useTypography('booker');
  const { session, isPreview } = useAppState();
  const query = useServerQuery(`latest-transfers:${session?.user.id}:${isPreview}`, () => listTransfers({}, 3));
  return <View style={{ gap: 8, paddingBottom: 20 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text style={[T.titleMD, { color: AppColors.ink, flex: 1 }]}>양도 가능한 단체예약</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="전체 양도 보드 보기" hitSlop={12} onPress={() => navigation.navigate('TransferBoard')}><Text style={[T.labelMD, { color: AppColors.primaryDeep }]}>전체 보기 ›</Text></Pressable>
    </View>
    <Text style={[T.bodyMD, { color: AppColors.inkSecondary }]}>확정된 예약을 같은 조건으로 이어받으세요.{isPreview ? ' · 예시' : ''}</Text>
    {query.loading && <ActivityIndicator />}
    {query.error && <><Text accessibilityRole="alert">{query.error}</Text><GhostButton title="다시 불러오기" onPress={query.reload} /></>}
    {query.data?.map(t => <TransferCard key={t.id} transfer={t} onPress={() => navigation.navigate('TransferDetail', { transferId: t.id })} />)}
    {query.data?.length === 0 && <Text style={T.bodyMD}>지금은 양도 가능한 예약이 없어요.</Text>}
  </View>;
}
