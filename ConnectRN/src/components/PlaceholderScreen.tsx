import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppSpacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

export default function PlaceholderScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>구현 예정</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: AppSpacing.s8 },
  title: { ...Typography.headlineMD, color: AppColors.ink },
  subtitle: { ...Typography.bodyMD, color: AppColors.neutral },
});
