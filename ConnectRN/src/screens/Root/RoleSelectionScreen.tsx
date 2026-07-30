import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';

export default function RoleSelectionScreen() {
  const { goToBookerSignUp, goToOwnerSignUp, goToBookerLogin, goToOwnerLogin } = useAppState();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Connect</Text>
        <Text style={styles.subtitle}>어떤 역할로 시작할까요?</Text>

        <Pressable style={styles.primaryButton} onPress={goToBookerSignUp}>
          <Text style={styles.primaryButtonText}>예약자로 시작하기</Text>
        </Pressable>

        <Pressable style={styles.ghostButton} onPress={goToOwnerSignUp}>
          <Text style={styles.ghostButtonText}>점주로 시작하기</Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginRowText}>이미 계정이 있으신가요?</Text>
          <Pressable onPress={goToBookerLogin} hitSlop={6}>
            <Text style={styles.loginLink}>예약자 로그인</Text>
          </Pressable>
          <Text style={styles.loginRowText}>·</Text>
          <Pressable onPress={goToOwnerLogin} hitSlop={6}>
            <Text style={styles.loginLink}>점주 로그인</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: AppSpacing.s24, gap: AppSpacing.s12 },
  title: { ...Typography.displayHero, color: AppColors.ink, marginBottom: AppSpacing.s4 },
  subtitle: { ...Typography.bodyLG, color: AppColors.inkSecondary, marginBottom: AppSpacing.s24 },
  primaryButton: {
    minHeight: 52,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { ...Typography.titleMD, color: AppColors.ink },
  ghostButton: {
    minHeight: 48,
    borderRadius: AppRadius.lg,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { ...Typography.titleMD, color: AppColors.ink },
  loginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppSpacing.s6,
    marginTop: AppSpacing.s16,
  },
  loginRowText: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  loginLink: { ...Typography.bodyMD, color: AppColors.primaryDeep, fontWeight: '700' },
});
