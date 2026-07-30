import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, TextStyle } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { Typography } from '../theme/typography';

interface AppButtonProps extends PressableProps {
  title: string;
  textStyle?: TextStyle;
}

export function PrimaryFilledButton({ title, style, ...props }: AppButtonProps) {
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
      <Text style={[styles.label, { color: AppColors.white }]}>{title}</Text>
    </Pressable>
  );
}

export function LimeButton({ title, style, ...props }: AppButtonProps) {
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
      <Text style={[styles.label, { color: AppColors.ink }]}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, style, textStyle, ...props }: AppButtonProps) {
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
      <Text style={[styles.label, { color: AppColors.ink }, textStyle]}>{title}</Text>
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
  label: { ...Typography.titleMD },
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
