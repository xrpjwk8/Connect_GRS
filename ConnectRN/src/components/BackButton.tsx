import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTypography } from '../state/AppState';
import type { AppRole } from '../theme/typography';
import { AppColors } from '../theme/colors';

/** Shared iOS-style back control; the screen owns the navigation action. */
export default function BackButton({ onPress, disabled = false, label = '뒤로가기', showLabel = false, overlay = false, style, appRole = 'booker' }: {
  appRole?: AppRole;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  showLabel?: boolean;
  overlay?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const T = useTypography(appRole);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    onPress={onPress} disabled={disabled} hitSlop={4}
    style={({ pressed }) => [styles.button, showLabel && styles.withLabel, overlay && styles.overlay, style,
      { opacity: disabled ? 0.45 : pressed ? 0.6 : 1 }]}>
    <Ionicons name="chevron-back" size={24} color={overlay ? AppColors.white : AppColors.ink} />
    {showLabel && <Text style={[T.bodyLG, styles.label]}>{label}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 22, alignSelf: 'flex-start', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.white,
    borderWidth: StyleSheet.hairlineWidth, borderColor: AppColors.borderStrong },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.45)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  withLabel: { width: 'auto', minWidth: 44, paddingHorizontal: 12, gap: 4 },
  label: { color: AppColors.ink },
});
