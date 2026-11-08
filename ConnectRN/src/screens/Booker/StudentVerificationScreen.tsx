import React, { useState } from 'react';
import { Image, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppState, useTypography } from '../../state/AppState';
import { GhostButton, LimeButton } from '../../components/Buttons';
import StudentDocumentPreview from '../../components/StudentDocumentPreview';
import ScreenHeader from '../../components/ScreenHeader';
import { AppSpacing } from '../../theme/spacing';
import { AppRadius } from '../../theme/radius';
import DataStatus from '../../components/DataStatus';
import { useRefreshOnFocus, useServerAction } from '../../hooks/useServer';
import { MAX_STUDENT_CARD_BYTES, verificationLabel } from '../../utils/studentVerification';
import { uploadStudentCard } from '../../services/studentVerification';
import { rpc, errorMessage } from '../../services/backend';
import { showAlert } from '../../utils/alert';
import { AppColors } from '../../theme/colors';

export default function StudentVerificationScreen() {
  const app = useAppState(); const T = useTypography('booker'); const navigation = useNavigation<any>();
  useRefreshOnFocus();
  const action = useServerAction();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [consent, setConsent] = useState(false);
  const [picking, setPicking] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const verification = app.studentVerification;
  const status = verification?.status ?? 'draft';
  const canSubmit = !app.isPreview && !!app.session && (status === 'draft' || status === 'rejected');
  const pick = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], multiple: false, copyToCacheDirectory: true });
      if (result.canceled) return;
      const selected = result.assets[0];
      if ((selected.size ?? 0) > MAX_STUDENT_CARD_BYTES) throw new Error('10MB 이하 파일을 선택해주세요.');
      setPreviewError(false); setConsent(false); setFile(selected);
    } catch (e) { showAlert('파일 선택', errorMessage(e)); }
    finally { setPicking(false); }
  };
  const submit = () => action.run(async () => {
    if (!file || !app.session || !consent) throw new Error('파일과 제출 동의를 확인해주세요.');
    try {
      const response = await fetch(file.uri);
      const bytes = await response.arrayBuffer();
      await uploadStudentCard(bytes, app.session.user.id, verification);
      setFile(null);
    } finally { await app.refresh().catch(() => {}); }
  }, () => showAlert('학생증 제출 완료', '관리자 심사 후 결과를 이 화면에서 확인할 수 있습니다.'));

  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}>
    <ScreenHeader title="학생증 인증" onBack={() => navigation.getState().index > 0 ? navigation.goBack() : navigation.replace('MyPage')} disabled={action.busy} />
    <ScrollView contentContainerStyle={{ padding: AppSpacing.s24, paddingTop: AppSpacing.s8, gap: AppSpacing.s18 }}>
      <View style={{ padding: AppSpacing.s18, gap: AppSpacing.s8, borderRadius: AppRadius.lg, backgroundColor: status === 'rejected' ? AppColors.dangerSoft : AppColors.white }}>
      <Text style={[T.labelMD, { color: AppColors.inkSecondary }]}>인증 진행 상태</Text>
      <Text style={[T.headlineSM, { color: AppColors.primaryDeep }]}>{app.isPreview ? '테스트 미리보기' : verificationLabel[status]}</Text>
      <Text style={T.bodyMD}>{status === 'draft' ? '학생증 제출 → 관리자 심사 → 예약 이용' : status === 'pending' ? '제출 완료 · 심사 결과를 기다려주세요' : status === 'approved' ? '인증 완료 · 예약을 이용할 수 있어요' : '반려 사유를 확인하고 새 파일을 제출해주세요'}</Text>
      </View>
      <Text style={T.bodyLG}>{app.realName || '이름 미입력'} · {app.schoolName || '학교 미입력'}</Text>
      <Text style={T.bodyMD}>학생증의 이름과 학교가 가입 정보와 일치해야 합니다. 학번·생년월일·바코드 등 심사에 불필요한 정보는 가려주세요. 학생 신분 확인이며 회장단 권한을 증명하지는 않습니다.</Text>
      <DataStatus />
      {app.isPreview ? <Text style={T.bodyLG}>테스트 미리보기에서는 학생증을 업로드하지 않습니다. 실제 계정으로 가입·로그인한 뒤 제출해주세요.</Text> : null}
      {status === 'pending' && <Text style={T.bodyLG}>관리자가 확인 중입니다. 승인 전에도 앱을 둘러볼 수 있으며 예약·채팅은 승인 후 이용할 수 있습니다.</Text>}
      {status === 'approved' && <Text style={T.bodyLG}>학생증 인증이 완료되어 예약을 신청할 수 있습니다. 이름이나 학교를 변경하면 재인증이 필요합니다. 채팅은 별도로 준비 중입니다.</Text>}
      {verification?.rejection_reason ? <Text accessibilityRole="alert" style={[T.bodyLG, { color: AppColors.danger }]}>{verification.rejection_reason}</Text> : null}
      {verification && !app.isPreview && <StudentDocumentPreview key={verification.request_id} path={verification.document_path} />}
      {canSubmit && <>
        <Text style={T.bodyMD}>제출 파일은 본인과 관리자만 조회합니다. JPG·PNG·PDF, 최대 10MB.</Text>
        <GhostButton title={picking ? '파일 선택 중…' : file ? '다른 파일로 교체' : '학생증 파일 선택'} onPress={pick} disabled={action.busy || picking} />
        {file && <View style={{ padding: AppSpacing.s16, gap: AppSpacing.s12, borderWidth: 1, borderColor: AppColors.borderStrong, borderRadius: AppRadius.lg, backgroundColor: AppColors.white }}>
          <Text style={T.titleMD}>제출할 파일 미리보기</Text>
          <Text style={T.bodyMD}>{file.name}{file.size != null ? ` · ${Math.max(1, Math.round(file.size / 1024))}KB` : ''}</Text>
          {file.mimeType === 'application/pdf' || /\.pdf$/i.test(file.name)
            ? <Text style={T.bodyMD}>PDF는 이미지 미리보기를 지원하지 않습니다. 선택한 파일명을 확인해주세요.</Text>
            : <>
              <Image key={file.uri} accessibilityLabel="제출 전 선택한 학생증 이미지" source={{ uri: file.uri }}
                style={{ width: '100%', height: 300, borderRadius: AppRadius.md, backgroundColor: AppColors.surfaceContainerLow }} resizeMode="contain" onError={() => setPreviewError(true)} />
              {previewError ? <Text accessibilityRole="alert" style={{ color: AppColors.danger }}>이미지 미리보기를 불러오지 못했습니다. 파일을 다시 선택해주세요.</Text>
                : <Text style={T.bodyMD}>이름·학교가 잘 보이고 불필요한 개인정보가 가려져 있는지 확인해주세요.</Text>}
            </>}
          <Text style={T.bodyMD}>아직 전송되지 않았습니다. 아래 제출 버튼을 눌러야 업로드됩니다.</Text>
          <GhostButton title="선택한 파일 제거" disabled={action.busy || picking} onPress={() => { setFile(null); setConsent(false); setPreviewError(false); }} />
        </View>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Switch accessibilityLabel="학생증 심사 목적 제출 동의" value={consent} onValueChange={setConsent} disabled={action.busy} />
          <Text style={[T.bodyMD, { flex: 1 }]}>학생증을 신분 확인 목적으로 관리자에게 제출하는 데 동의합니다.</Text>
        </View>
        <LimeButton title={action.busy ? '제출 중…' : '학생증 제출하기'} onPress={submit} disabled={action.busy || !file || !consent} />
        {verification?.status === 'draft' && <GhostButton title="이미 업로드한 파일로 제출 재시도" disabled={action.busy || !consent}
          onPress={() => action.run(() => rpc('submit_student_verification', { p_request_id: verification.request_id }))} />}
      </>}
      {status !== 'approved' && <GhostButton title={status === 'pending' ? '심사 기다리며 앱 둘러보기' : '나중에 제출하고 앱 둘러보기'} disabled={action.busy} onPress={() => navigation.getState().index > 0 ? navigation.goBack() : navigation.replace('MyPage')} />}
    </ScrollView>
  </SafeAreaView>;
}
