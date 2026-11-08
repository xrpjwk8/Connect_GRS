import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState, useTypography } from '../state/AppState';
import { GhostButton } from './Buttons';
import type { MyReservation } from '../models/types';
import { transferStatus } from '../models/transfers';
export default function ReservationTransferActions({ reservation: r }: { reservation: MyReservation }) {
  const { transfers, selectedRole } = useAppState(); const navigation = useNavigation<any>(); const T = useTypography(selectedRole ?? 'booker');
  const t = transfers.find(t => t.reservation_id === r.id && (t.status === 'completed' || transferStatus(t) === 'active'));
  if (t) return <View style={{ gap: 6 }}>
    {t.status === 'completed' && <Text style={T.bodyMD}>양도된 예약 · {t.from_name} → {t.to_name}</Text>}
    <GhostButton title={t.status === 'completed' ? '양도 이력·승계 조건' : t.is_mine ? '양도 중 · 상세/철회' : '양도 중 · 상세'} onPress={() => navigation.navigate('TransferRecord', { transferId: t.id })} />
  </View>;
  if (selectedRole !== 'booker' || r.status !== 'confirmed' || r.isManual || r.chatEpoch || !r.startsAt || Date.parse(r.startsAt) <= Date.now()) return null;
  return <GhostButton title="이 예약 양도하기" onPress={() => navigation.navigate('TransferRegister', { reservationId: r.id })} />;
}
