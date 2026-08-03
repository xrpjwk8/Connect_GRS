import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { AppTextField, FormLabel, InfoBanner } from '../../components/CommonComponents';
import InteractiveUploader from '../../components/InteractiveUploader';
import AgreementSection from '../../components/AgreementSection';
import { signUpOwner } from '../../api/auth';
import { getStore } from '../../api/stores';
import { ApiError } from '../../api/client';

export default function OwnerSignUpScreen() {
  const { finishOwnerSignUp, cancelSignUp, setOwnerId, setOwnerStoreInfo } = useAppState();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [allRequiredAgreed, setAllRequiredAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const owner = await signUpOwner({ storeName, ownerName, contact, businessNumber });
      setOwnerId(owner.id);
      setOwnerStoreInfo(await getStore(owner.storeId));
      finishOwnerSignUp();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : '네트워크 연결을 확인해주세요.';
      showAlert('가입에 실패했어요', message);
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
        <Text style={styles.topBarTitle}>점주 회원가입</Text>
        <View style={{ width: 18 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.introBlock}>
            <Text style={styles.introTitle}>비즈니스 인증</Text>
            <Text style={styles.introSubtitle}>가게 정보를 정확하게 입력해주세요.</Text>
          </View>

          <View style={styles.field}>
            <FormLabel title="가게명" />
            <AppTextField
              placeholder="가게 이름을 입력해주세요"
              value={storeName}
              onChangeText={(text) => setStoreName(text.slice(0, 20))}
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="대표자명" />
            <AppTextField placeholder="대표자 성함을 입력해주세요" value={ownerName} onChangeText={setOwnerName} />
          </View>

          <View style={styles.field}>
            <FormLabel title="연락처" />
            <AppTextField
              placeholder="‘-’ 없이 숫자만 입력해주세요"
              value={contact}
              onChangeText={(text) => setContact(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="사업자 등록 번호" />
            <AppTextField
              placeholder="사업자 등록 번호 10자리를 입력해주세요"
              value={businessNumber}
              onChangeText={(text) => setBusinessNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="사업자등록증" />
            <InteractiveUploader
              icon="document-attach-outline"
              title="사진 또는 PDF 파일 업로드"
              subtitle="JPG, PNG, PDF (최대 10MB)"
              allowsFiles
            />
          </View>

          <InfoBanner
            title="가입 승인 안내"
            message="사업자 정보 확인 후 관리자 승인을 거쳐 서비스 이용이 가능합니다. 승인 완료까지 영업일 기준 1~2일이 소요될 수 있습니다."
          />

          <AgreementSection onRequiredAgreedChange={setAllRequiredAgreed} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitButton, (!allRequiredAgreed || !ownerName || submitting) && { opacity: 0.4 }]}
          disabled={!allRequiredAgreed || !ownerName || submitting}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{submitting ? '가입 처리 중...' : '가입 신청하기'}</Text>
        </Pressable>
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
  footer: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12 },
  submitButton: {
    minHeight: 52,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { ...Typography.titleMD, color: AppColors.inkSecondary },
});
