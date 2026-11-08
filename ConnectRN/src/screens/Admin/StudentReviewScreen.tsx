import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useTypography } from '../../state/AppState';
import { supabase } from '../../lib/supabase';
import { rpc, errorMessage } from '../../services/backend';
import { GhostButton, LimeButton } from '../../components/Buttons';
import { AppTextField } from '../../components/CommonComponents';
import ScreenHeader from '../../components/ScreenHeader';
import { AppSpacing } from '../../theme/spacing';
import { AppRadius } from '../../theme/radius';
import StudentDocumentPreview from '../../components/StudentDocumentPreview';
import { useServerAction } from '../../hooks/useServer';
import { verificationLabel, type StudentVerification } from '../../utils/studentVerification';
import { showAlert } from '../../utils/alert';
import { AppColors } from '../../theme/colors';

export default function StudentReviewScreen() {
  const app = useAppState(); const T = useTypography('owner');
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [rows, setRows] = useState<StudentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setRows([]); setLoading(true); setError('');
    if (!app.isAdmin || app.isPreview) { setLoading(false); return; }
    void supabase.from('student_verifications').select('*').eq('status', status)
      .order('submitted_at', { ascending: true }).order('user_id').range(page * 20, page * 20 + 19)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(errorMessage(error)); else setRows(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [app.isAdmin, app.isPreview, app.session?.user.id, page, status, version]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}>
    <ScreenHeader title="학생증 심사" appRole="owner" backLabel={app.profile ? '닫기' : '로그아웃'} onBack={() => { if (app.profile) app.setAdminPanelOpen(false); else void app.logout(); }} />
    <ScrollView automaticallyAdjustKeyboardInsets style={{ flex: 1 }} contentContainerStyle={{ padding: AppSpacing.s24, paddingTop: AppSpacing.s8, gap: AppSpacing.s18 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      <Text style={T.bodyMD}>이름·학교와 제출 파일을 대조해 심사하세요. 본인 신청은 승인할 수 없습니다.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['pending','approved','rejected'].map(value =>
        <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: status === value }} onPress={() => { setStatus(value); setPage(0); }}
          style={{ minHeight: 44, paddingHorizontal: AppSpacing.s16, paddingVertical: AppSpacing.s12, borderRadius: AppRadius.pill, backgroundColor: status === value ? AppColors.primary : AppColors.white }}>
          <Text style={[T.bodyLG, { color: AppColors.ink }]}>{verificationLabel[value]}</Text>
        </Pressable>)}</View>
      <GhostButton appRole="owner" title="목록 새로고침" onPress={() => setVersion(v => v + 1)} />
      {loading && <ActivityIndicator />}
      {error ? <Text accessibilityRole="alert" style={{ color: AppColors.danger }}>{error}</Text> : null}
      {!loading && !error && rows.length === 0 && <Text style={T.bodyLG}>해당 상태의 신청이 없습니다.</Text>}
      {rows.map(row => <ReviewCard key={row.request_id} row={row} onSaved={() => setVersion(v => v + 1)} />)}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <GhostButton appRole="owner" title="이전 목록" disabled={page === 0 || loading} onPress={() => setPage(p => p - 1)} />
        <GhostButton appRole="owner" title="다음 목록" disabled={rows.length < 20 || loading} onPress={() => setPage(p => p + 1)} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function ReviewCard({ row, onSaved }: { row: StudentVerification; onSaved: () => void }) {
  const app = useAppState(); const T = useTypography('owner'); const action = useServerAction();
  const [reason, setReason] = useState('');
  const own = row.user_id === app.session?.user.id;
  const decide = (approve: boolean) => showAlert(approve ? '학생증 승인' : row.status === 'approved' ? '승인 취소' : '학생증 반려',
    approve ? `${row.real_name}님의 학생증 인증을 승인하시겠습니까?` : `${row.real_name}님에게 사유와 함께 결과가 표시됩니다.`, [
      { text: '돌아가기', style: 'cancel' },
      { text: '확인', onPress: () => { void action.run(() => rpc('review_student_verification', {
        p_user_id: row.user_id, p_request_id: row.request_id, p_approve: approve, p_reason: reason.trim(),
      }), onSaved); } },
    ]);
  return <View style={{ padding: AppSpacing.s18, gap: AppSpacing.s12, borderRadius: AppRadius.lg, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.borderStrong }}>
    <Text style={T.titleMD}>{row.real_name} · {row.school_name}</Text>
    <Text style={T.bodyMD}>{verificationLabel[row.status]} · {row.submitted_at ? new Date(row.submitted_at).toLocaleString('ko-KR') : '미제출'}</Text>
    <StudentDocumentPreview path={row.document_path} appRole="owner" />
    {row.rejection_reason ? <Text style={T.bodyLG}>{row.rejection_reason}</Text> : null}
    {own ? <Text style={T.bodyMD}>본인 신청은 다른 관리자가 심사해야 합니다.</Text> : row.status !== 'rejected' && <>
      <AppTextField accessibilityLabel="반려 또는 승인 취소 사유" placeholder="반려 또는 승인 취소 사유 (필수)" appRole="owner" value={reason} onChangeText={setReason} maxLength={1000} editable={!action.busy} multiline />
      {row.status === 'pending' && <LimeButton title="승인" appRole="owner" disabled={action.busy} onPress={() => decide(true)} />}
      <GhostButton title={row.status === 'approved' ? '승인 취소' : '반려'} appRole="owner" disabled={action.busy || !reason.trim()} onPress={() => decide(false)} />
    </>}
  </View>;
}
