import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTypography } from '../state/AppState';
import { AppColors } from '../theme/colors';
import { AppSpacing } from '../theme/spacing';
import type { AppRole } from '../theme/typography';

export default function ScreenHeader({ title, onBack, backLabel = '뒤로', disabled = false, appRole = 'booker' }: {
  title: string; onBack: () => void; backLabel?: string; disabled?: boolean; appRole?: AppRole;
}) {
  const T = useTypography(appRole);
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel={backLabel} accessibilityState={{ disabled }}
      disabled={disabled} onPress={onBack} style={({ pressed }) => [styles.back, { opacity: disabled ? 0.45 : pressed ? 0.6 : 1 }]}>
      <Ionicons name="chevron-back" size={22} color={AppColors.ink} />
      <Text style={[T.bodyLG, { color: AppColors.inkSecondary }]}>{backLabel}</Text>
    </Pressable>
    <Text accessibilityRole="header" style={[T.headlineLG, styles.title]}>{title}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: AppSpacing.s24, paddingBottom: AppSpacing.s16, backgroundColor: AppColors.surface },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s4, minHeight: 44, paddingRight: AppSpacing.s12 },
  title: { color: AppColors.ink, marginTop: AppSpacing.s4 },
});
