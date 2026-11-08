import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppState, useTypography } from '../../state/AppState';
import { GhostButton, LimeButton } from '../../components/Buttons';
import StudentDocumentPreview from '../../components/StudentDocumentPreview';
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
      setFile(selected);
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
    <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
      <GhostButton title="뒤로" onPress={() => navigation.goBack()} disabled={action.busy} />
      <Text style={T.headlineLG}>학생증 인증</Text>
      <Text style={[T.titleMD, { color: AppColors.primaryDeep }]}>{verificationLabel[status]}</Text>
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
        <GhostButton title={picking ? '파일 선택 중…' : '학생증 파일 선택'} onPress={pick} disabled={action.busy || picking} />
        {file && <Text style={T.bodyMD}>{file.name}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Switch accessibilityLabel="학생증 심사 목적 제출 동의" value={consent} onValueChange={setConsent} disabled={action.busy} />
          <Text style={[T.bodyMD, { flex: 1 }]}>학생증을 신분 확인 목적으로 관리자에게 제출하는 데 동의합니다.</Text>
        </View>
        <LimeButton title={action.busy ? '제출 중…' : '학생증 제출하기'} onPress={submit} disabled={action.busy || !file || !consent} />
        {verification?.status === 'draft' && <GhostButton title="이미 업로드한 파일로 제출 재시도" disabled={action.busy || !consent}
          onPress={() => action.run(() => rpc('submit_student_verification', { p_request_id: verification.request_id }))} />}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
