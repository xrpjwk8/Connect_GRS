import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { AppTextField, FormLabel } from '../../components/CommonComponents';
import { LimeButton } from '../../components/Buttons';
import { lookupOwnerByContact } from '../../api/auth';
import { getStore } from '../../api/stores';
import { ApiError } from '../../api/client';

export default function OwnerLoginScreen() {
  const { finishOwnerSignUp, cancelSignUp, setOwnerId, setOwnerStoreInfo } = useAppState();

  const [contact, setContact] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isContactValid = contact.length >= 10;
  const isCodeComplete = verificationCode.length === 6;

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const owner = await lookupOwnerByContact(contact);
      setOwnerId(owner.id);
      setOwnerStoreInfo(await getStore(owner.storeId));
      finishOwnerSignUp();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        Alert.alert('가입 정보를 찾을 수 없어요', '해당 연락처로 가입된 매장이 없어요. 회원가입을 먼저 진행해주세요.');
      } else {
        Alert.alert('로그인에 실패했어요', '네트워크 연결을 확인해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={cancelSignUp} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>로그인</Text>
        <View style={{ width: 18 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.introBlock}>
            <Text style={styles.introTitle}>사장님 로그인</Text>
            <Text style={styles.introSubtitle}>연락처로 받은 인증코드로 간편하게 로그인해요.</Text>
          </View>

          <View style={styles.field}>
            <FormLabel title="연락처" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppTextField
                  placeholder="‘-’ 없이 숫자만 입력해주세요"
                  value={contact}
                  onChangeText={(text) => setContact(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
              <Pressable
                disabled={!isContactValid}
                style={[styles.sideButton, styles.sideButtonNeutral]}
                onPress={() => setCodeSent(true)}
              >
                <Text style={styles.sideButtonNeutralText}>인증 요청</Text>
              </Pressable>
            </View>
            {codeSent && <Text style={styles.hintText}>인증코드를 보냈어요 (데모: 아무 6자리 숫자 입력)</Text>}
          </View>

          <View style={styles.field}>
            <FormLabel title="인증번호" />
            <AppTextField
              placeholder="6자리 숫자 입력"
              value={verificationCode}
              onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <LimeButton
          title={submitting ? '로그인 중...' : '로그인하기'}
          onPress={handleLogin}
          disabled={!isCodeComplete || submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s14,
  },
  topBarTitle: { ...Typography.titleMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s24 },
  introBlock: { gap: AppSpacing.s6, paddingTop: AppSpacing.s10 },
  introTitle: { ...Typography.headlineLG, color: AppColors.ink },
  introSubtitle: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  field: { gap: AppSpacing.s8 },
  row: { flexDirection: 'row', gap: AppSpacing.s10, alignItems: 'stretch' },
  sideButton: { borderRadius: 14, paddingHorizontal: AppSpacing.s16, alignItems: 'center', justifyContent: 'center' },
  sideButtonNeutral: { backgroundColor: AppColors.surfaceContainerHigh },
  sideButtonNeutralText: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  hintText: { ...Typography.labelMD, color: AppColors.primaryDeep },
  footer: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12 },
});
