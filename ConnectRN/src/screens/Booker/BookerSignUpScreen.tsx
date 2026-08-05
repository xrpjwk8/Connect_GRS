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
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { universities } from '../../models/mockData';
import { AppTextField, FormLabel, PickerField } from '../../components/CommonComponents';
import { PrimaryFilledButton } from '../../components/Buttons';
import AgreementSection from '../../components/AgreementSection';
import { confirmVerificationCode, sendVerificationCode, signUpBooker } from '../../api/auth';
import { ApiError } from '../../api/client';

export default function BookerSignUpScreen() {
  const {
    finishBookerSignUp,
    cancelSignUp,
    setBookerId,
    setSchoolName,
    setDepartmentName,
    setPosition,
    setRealName,
    setSchoolEmail,
    setPhoneNumber,
  } = useAppState();

  const [schoolName, setLocalSchoolName] = useState('');
  const [departmentName, setLocalDepartmentName] = useState('');
  const [position, setLocalPosition] = useState('');
  const [realName, setLocalRealName] = useState('');
  const [phoneNumber, setLocalPhoneNumber] = useState('');
  const [schoolEmail, setLocalSchoolEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [allRequiredAgreed, setAllRequiredAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const isEmailValid = schoolEmail.includes('@') && schoolEmail.includes('.');
  const isCodeComplete = verificationCode.length === 6;

  const handleSendCode = async () => {
    if (sendingCode || !isEmailValid) return;
    setSendingCode(true);
    try {
      await sendVerificationCode(schoolEmail);
      setCodeSent(true);
      setEmailVerified(false);
      showAlert('인증번호를 보냈어요', `${schoolEmail}로 발송된 6자리 코드를 입력해주세요.`);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : '네트워크 연결을 확인해주세요.';
      showAlert('인증번호 발송에 실패했어요', message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    if (confirmingCode || !isCodeComplete) return;
    setConfirmingCode(true);
    try {
      await confirmVerificationCode(schoolEmail, verificationCode);
      setEmailVerified(true);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : '네트워크 연결을 확인해주세요.';
      showAlert('인증에 실패했어요', message);
    } finally {
      setConfirmingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const booker = await signUpBooker({
        schoolName,
        departmentName,
        position,
        realName,
        schoolEmail,
        phoneNumber,
      });
      setBookerId(booker.id);
      setSchoolName(schoolName);
      setDepartmentName(departmentName);
      setPosition(position);
      setRealName(realName);
      setSchoolEmail(schoolEmail);
      setPhoneNumber(phoneNumber);
      finishBookerSignUp();
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
        <Text style={styles.topBarTitle}>회원가입</Text>
        <View style={{ width: 18 }} />
      </View>

      <View style={styles.progressBar} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <View style={styles.field}>
            <FormLabel title="학교명" />
            <PickerField
              placeholder="학교를 선택해주세요"
              value={schoolName}
              options={universities}
              onChange={setLocalSchoolName}
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="학과 / 단체명" />
            <AppTextField
              placeholder="예: 경영학과 / 댄스동아리"
              value={departmentName}
              onChangeText={setLocalDepartmentName}
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="직책" />
            <AppTextField placeholder="예: 회장, 과대표" value={position} onChangeText={setLocalPosition} />
          </View>

          <View style={styles.field}>
            <FormLabel title="이름" />
            <AppTextField placeholder="실명을 입력해주세요" value={realName} onChangeText={setLocalRealName} />
          </View>

          <View style={styles.field}>
            <FormLabel title="연락처" />
            <AppTextField
              placeholder="‘-’ 없이 숫자만 입력해주세요"
              value={phoneNumber}
              onChangeText={(text) => setLocalPhoneNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>신원 인증</Text>

          <View style={styles.field}>
            <FormLabel title="학교 메일" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppTextField
                  placeholder="example@university.ac.kr"
                  value={schoolEmail}
                  onChangeText={(text) => {
                    setLocalSchoolEmail(text);
                    setEmailVerified(false);
                    setCodeSent(false);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <Pressable
                disabled={!isEmailValid || sendingCode}
                style={[styles.sideButton, styles.sideButtonNeutral]}
                onPress={handleSendCode}
              >
                <Text style={styles.sideButtonNeutralText}>{sendingCode ? '발송 중...' : codeSent ? '재발송' : '인증 요청'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <FormLabel title="인증번호" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppTextField
                  placeholder="6자리 숫자 입력"
                  value={verificationCode}
                  onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  editable={!emailVerified}
                />
              </View>
              <Pressable
                disabled={!isCodeComplete || confirmingCode || emailVerified}
                style={[styles.sideButton, emailVerified ? styles.sideButtonVerified : styles.sideButtonDark]}
                onPress={handleConfirmCode}
              >
                <Text style={emailVerified ? styles.sideButtonVerifiedText : styles.sideButtonDarkText}>
                  {emailVerified ? '인증완료' : confirmingCode ? '확인 중...' : '확인'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <AgreementSection onRequiredAgreedChange={setAllRequiredAgreed} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <PrimaryFilledButton
          title={submitting ? '가입 처리 중...' : '가입 완료하기'}
          onPress={handleSubmit}
          disabled={!allRequiredAgreed || !phoneNumber || !emailVerified || submitting}
          style={{ opacity: allRequiredAgreed && phoneNumber && emailVerified && !submitting ? 1 : 0.4 }}
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
  progressBar: { height: 3, backgroundColor: AppColors.primary },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s20, gap: AppSpacing.s20 },
  sectionTitle: { ...Typography.headlineMD, color: AppColors.ink },
  field: { gap: AppSpacing.s8 },
  divider: { height: 1, backgroundColor: AppColors.borderStrong, marginVertical: AppSpacing.s6 },
  row: { flexDirection: 'row', gap: AppSpacing.s10, alignItems: 'stretch' },
  sideButton: {
    borderRadius: 14,
    paddingHorizontal: AppSpacing.s16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonNeutral: { backgroundColor: AppColors.surfaceContainerHigh },
  sideButtonNeutralText: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  sideButtonDark: { backgroundColor: AppColors.ink, paddingHorizontal: AppSpacing.s20 },
  sideButtonDarkText: { ...Typography.bodyLG, color: AppColors.white },
  sideButtonVerified: { backgroundColor: AppColors.primary, paddingHorizontal: AppSpacing.s20 },
  sideButtonVerifiedText: { ...Typography.bodyLG, color: AppColors.onPrimary },
  footer: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12 },
});
