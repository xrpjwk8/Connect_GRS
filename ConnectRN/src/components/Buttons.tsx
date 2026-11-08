import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, TextStyle } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { AppSpacing } from '../theme/spacing';
import { type AppRole } from '../theme/typography';
import { useTypography } from '../state/AppState';

interface AppButtonProps extends PressableProps {
  title: string;
  textStyle?: TextStyle;
  appRole?: AppRole;
}

export function PrimaryFilledButton({ title, style, appRole = 'booker', ...props }: AppButtonProps) {
  const T = useTypography(appRole);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      {...props}
      style={(state) => [
        styles.base,
        styles.primaryFilled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
        props.disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[T.titleMD, { color: AppColors.white, textAlign: 'center' }]}>{title}</Text>
    </Pressable>
  );
}

export function LimeButton({ title, style, appRole = 'booker', ...props }: AppButtonProps) {
  const T = useTypography(appRole);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      {...props}
      style={(state) => [
        styles.base,
        styles.lime,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
        props.disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[T.titleMD, { color: AppColors.ink, textAlign: 'center' }]}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, style, textStyle, appRole = 'booker', ...props }: AppButtonProps) {
  const T = useTypography(appRole);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      {...props}
      style={(state) => [
        styles.base,
        styles.ghost,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
        props.disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[T.titleMD, { color: AppColors.ink, textAlign: 'center' }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: AppRadius.lg,
    paddingVertical: AppSpacing.s12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.s16,
  },
  pressed: { opacity: 0.85 },
  primaryFilled: {
    backgroundColor: AppColors.ink,

  },
  lime: {
    backgroundColor: AppColors.primary,

  },
  ghost: {
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
});
