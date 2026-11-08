import BackButton from '../../components/BackButton';
import { showAlert } from '../../utils/alert';
import useNativeBack from '../../navigation/useNativeBack';
import React from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppState, useTypography } from '../../state/AppState';
import { useRefreshOnFocus, useServerAction } from '../../hooks/useServer';
import { rpc } from '../../services/backend';
import { GhostButton } from '../../components/Buttons';
import DataStatus from '../../components/DataStatus';
import { AppColors } from '../../theme/colors';
export default function NotificationReservationScreen() {
  const goBack = useNativeBack();
  const { myReservations, selectedRole } = useAppState(); const T = useTypography(selectedRole ?? 'booker');
  const navigation = useNavigation<any>(); const route = useRoute<any>(); const action = useServerAction();
  useRefreshOnFocus();
  const reservation = myReservations.find(r => r.id === route.params.reservationId);
  const labels: Record<string,string> = { pending: '수락 대기', confirmed: '예약 확정', rejected: '거절', cancelled: '취소', completed: '완료' };
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}><ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
    <BackButton onPress={goBack} disabled={action.busy} />
    <Text style={T.headlineLG}>예약 상세</Text><DataStatus />
    {reservation ? <>
      <Text style={T.titleMD}>{reservation.storeName} · {labels[reservation.status]}</Text>
      <Text style={T.bodyLG}>{reservation.dateLabel} · {reservation.people}명</Text>
      <Text style={T.bodyLG}>{reservation.bookerName}</Text>
      {selectedRole === 'owner' && reservation.status === 'pending' && <>
        <GhostButton title="예약 수락" disabled={action.busy} onPress={() => action.run(() => rpc('decide_reservation', { p_reservation_id: reservation.id, p_accept: true }))} />
        <GhostButton title="예약 거절" disabled={action.busy} onPress={() => showAlert('거절하시겠습니까?', '예약자에게 거절 알림이 전송됩니다.', [
          { text: '취소', style: 'cancel' },
          { text: '거절', style: 'destructive', onPress: () => { void action.run(() => rpc('decide_reservation', { p_reservation_id: reservation.id, p_accept: false })); } },
        ])} />
      </>}
      {reservation.status === 'confirmed' && <GhostButton title="예약 취소" disabled={action.busy} textStyle={{ color: AppColors.danger }} onPress={() => Alert.alert('예약을 취소할까요?', '취소한 예약은 되돌릴 수 없으며 상대방에게 알림이 전송됩니다.', [
        { text: '돌아가기', style: 'cancel' },
        { text: '예약 취소', style: 'destructive', onPress: () => { void action.run(() => rpc('cancel_reservation', { p_reservation_id: reservation.id })); } },
      ])} />}
      {!reservation.isManual && <GhostButton title="이 예약의 대화 보기" onPress={() => navigation.navigate('NotificationChat', { reservationId: reservation.id })} />}
    </> : <Text style={T.bodyLG}>예약을 불러오는 중이거나 조회 권한이 없습니다.</Text>}
  </ScrollView></SafeAreaView>;
}
