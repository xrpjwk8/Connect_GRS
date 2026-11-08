import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';
import { minuteLabel } from '../utils/reservation';
import { transferLabels, transferStatus, type ReservationTransfer } from '../models/transfers';
export default function TransferCard({ transfer: t, onPress }: { transfer: ReservationTransfer; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && { opacity: .7 }]}>
    <View style={styles.row}>
      <Text style={styles.badge}>{transferLabels[transferStatus(t)]}{t.is_mine ? ' · 내 예약' : ''}</Text>
      <Ionicons name="chevron-forward" size={14} color={AppColors.inkSecondary} />
    </View>
    <Text style={styles.schedule}>
      <Text style={styles.date}>{t.service_date.replaceAll('-', '.')}</Text>
      {' · '}{minuteLabel(t.start_minute)}–{minuteLabel(t.start_minute + t.slot_count * 30)}
    </Text>
    <Text style={styles.meta}>{t.people}명 · {t.store_name} · {t.region}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: AppColors.white, borderRadius: 12, borderWidth: 1, borderColor: AppColors.borderStrong, paddingHorizontal: 12, paddingVertical: 10, gap: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 11, lineHeight: 15, fontWeight: '400', color: AppColors.primaryDeep },
  schedule: { fontSize: 13, lineHeight: 19, fontWeight: '400', color: AppColors.ink },
  date: { fontWeight: '700' },
  meta: { fontSize: 12, lineHeight: 18, fontWeight: '400', color: AppColors.inkSecondary },
});
