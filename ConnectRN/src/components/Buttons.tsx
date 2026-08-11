import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, TextStyle } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { getTypography, type AppRole } from '../theme/typography';

interface AppButtonProps extends PressableProps {
  title: string;
  textStyle?: TextStyle;
  appRole?: AppRole;
}

export function PrimaryFilledButton({ title, style, appRole = 'booker', ...props }: AppButtonProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.base,
        styles.primaryFilled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[getTypography(appRole).titleMD, { color: AppColors.white }]}>{title}</Text>
    </Pressable>
  );
}

export function LimeButton({ title, style, appRole = 'booker', ...props }: AppButtonProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.base,
        styles.lime,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[getTypography(appRole).titleMD, { color: AppColors.ink }]}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, style, textStyle, appRole = 'booker', ...props }: AppButtonProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.base,
        styles.ghost,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[getTypography(appRole).titleMD, { color: AppColors.ink }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.85 },
  primaryFilled: {
    backgroundColor: AppColors.ink,
    borderRadius: AppRadius.pill,
  },
  lime: {
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.pill,
  },
  ghost: {
    minHeight: 48,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
});
