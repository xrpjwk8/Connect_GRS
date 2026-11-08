import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/colors';
import { LimeButton, GhostButton } from '../../components/Buttons';
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

        <LimeButton title="예약자 로그인" onPress={goToBookerLogin} />
        <GhostButton title="점주 로그인" onPress={goToOwnerLogin} />

        <View style={styles.loginRow}>
          <Text style={styles.loginRowText}>아직 계정이 없으신가요?</Text>
          <Pressable onPress={goToBookerSignUp} hitSlop={6}>
            <Text style={styles.loginLink}>예약자 가입</Text>
          </Pressable>
          <Text style={styles.loginRowText}>·</Text>
          <Pressable onPress={goToOwnerSignUp} hitSlop={6}>
            <Text style={styles.loginLink}>점주 가입</Text>
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
