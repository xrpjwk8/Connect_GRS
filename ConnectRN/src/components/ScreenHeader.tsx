import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from './BackButton';
import { useTypography } from '../state/AppState';
import { AppColors } from '../theme/colors';
import { AppSpacing } from '../theme/spacing';
import type { AppRole } from '../theme/typography';

export default function ScreenHeader({ title, onBack, backLabel = '뒤로', disabled = false, appRole = 'booker' }: {
  title: string; onBack: () => void; backLabel?: string; disabled?: boolean; appRole?: AppRole;
}) {
  const T = useTypography(appRole);
  return <View style={styles.container}>
    <BackButton appRole={appRole} onPress={onBack} disabled={disabled} label={backLabel === '뒤로' ? '뒤로가기' : backLabel}
      showLabel={backLabel !== '뒤로'} />
    <Text accessibilityRole="header" style={[T.headlineLG, styles.title]}>{title}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: AppSpacing.s24, paddingBottom: AppSpacing.s16, backgroundColor: AppColors.surface },
  title: { color: AppColors.ink, marginTop: AppSpacing.s4 },
});
