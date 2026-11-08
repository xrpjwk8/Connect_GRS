import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { GhostButton, LimeButton } from '../../components/Buttons';
import { TransferCheck } from './TransferRegisterScreen';
import { useServerAction, useServerQuery } from '../../hooks/useServer';
import { useAppState, useTypography } from '../../state/AppState';
import useNativeBack from '../../navigation/useNativeBack';
import { claimTransfer, getTransfer, withdrawTransfer } from '../../services/transfers';
import { transferLabels, transferStatus } from '../../models/transfers';
import { minuteLabel } from '../../utils/reservation';
import { showAlert } from '../../utils/alert';
import { AppColors } from '../../theme/colors';

export default function TransferDetailScreen() {
  const route = useRoute<any>(); const navigation = useNavigation<any>();
  const { session, canBook, isPreview, realName, schoolName, departmentName, selectedRole } = useAppState();
  const T = useTypography(selectedRole ?? 'booker'); const action = useServerAction(); const goBack = useNativeBack(action.busy);
  const query = useServerQuery(`transfer:${route.params.transferId}:${session?.user.id}:${isPreview}`, () => getTransfer(route.params.transferId));
  const [agreed, setAgreed] = useState(false); const [now, setNow] = useState(Date.now());
  const [completed, setCompleted] = useState(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  const t = query.data; const status = t ? transferStatus(t, now) : 'expired';
  const take = () => showAlert('이 예약을 양도받을까요?', '확정하면 별도 승인 없이 예약자가 변경되며 점주에게 통보됩니다.', [
    { text: '돌아가기', style: 'cancel' }, { text: '확인하고 양도받기', onPress: () => {
      void action.run(async () => {
        try { await claimTransfer(t!.id, action.requestId({ transferId: t!.id })); }
        catch (error) {
          // A definite state/permission rejection refreshes stale cards; unknown network outcomes retain the retry UUID.
          if (/^(22|42)/.test((error as { code?: string }).code ?? '')) query.reload();
          throw error;
        }
      }, () => { setCompleted(true); query.reload(); });
    } },
  ]);
  const withdraw = () => showAlert('양도를 철회할까요?', '양도 게시만 종료되며 원래 예약은 유지됩니다.', [
    { text: '돌아가기', style: 'cancel' }, { text: '양도 철회', onPress: () => { void action.run(() => withdrawTransfer(t!.id), query.reload); } },
  ]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }} edges={['top']}>
    <ScreenHeader title="예약 양도" onBack={goBack} disabled={action.busy} appRole={selectedRole ?? 'booker'} />
    <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
      {completed && <Text accessibilityRole="alert" style={T.titleMD}>양도가 완료되었습니다. 내 예약에서 확인할 수 있어요.</Text>}
      {query.loading && <ActivityIndicator />}
      {query.error && <><Text accessibilityRole="alert">{query.error}</Text><GhostButton title="다시 불러오기" onPress={query.reload} /></>}
      {t && <>
        <Text style={[T.labelMD, { color: AppColors.primaryDeep }]}>{transferLabels[status]}</Text>
        <Text style={T.headlineLG}>{t.service_date.replaceAll('-', '.')} · {minuteLabel(t.start_minute)}–{minuteLabel(t.start_minute + t.slot_count * 30)}</Text>
        <Text style={T.headlineLG}>{t.people}명</Text><Text style={T.titleMD}>{t.store_name}</Text><Text style={T.bodyMD}>{t.region}</Text>
        <View style={{ backgroundColor: AppColors.white, padding: 18, borderRadius: 16, gap: 10 }}>
          <Text style={T.titleMD}>승계 조건</Text><Text style={T.bodyLG}>{t.terms}</Text>
          <Text style={[T.labelMD, { color: AppColors.inkSecondary }]}>등록자가 제공한 정보 · 예약금 없음 확인</Text>
        </View>
        {!!t.memo && <View style={{ backgroundColor: AppColors.white, padding: 14, borderRadius: 12, gap: 8 }}>
          <Text style={[T.bodyMD, { fontWeight: '400' }]}>양도자가 남긴 메모</Text>
          <Text style={[T.bodyLG, { fontWeight: '400' }]}>{t.memo}</Text>
        </View>}
        <Text style={T.bodyMD}>이용 시작 전까지 양도받을 수 있습니다. 일시·인원·합의 조건을 그대로 승계하며, 인수 후 재양도는 불가능합니다.</Text>
        {status === 'completed' && <>
          <Text style={T.titleMD}>예약자 변경 완료</Text>
          {t.from_name && <Text style={T.bodyLG}>{t.from_name} · {t.from_affiliation}{'\n'}→ {t.to_name} · {t.to_affiliation}</Text>}
          {t.completed_at && <Text style={T.bodyMD}>{new Date(t.completed_at).toLocaleString('ko-KR')}</Text>}
          {t.reservation_id && (t.is_recipient || t.is_owner) && <GhostButton title="현재 예약 보기" onPress={() => navigation.navigate('NotificationReservation', { reservationId: t.reservation_id })} />}
          {t.reservation_id && (t.is_mine || t.is_owner) && <GhostButton title="양도 전 대화 기록" onPress={() => navigation.navigate('NotificationChat', { reservationId: t.reservation_id, chatEpoch: 0, readOnly: true })} />}
          {t.is_mine && <Text style={T.bodyMD}>이 예약의 관리 권한은 새 예약자에게 이전되었습니다.</Text>}
        </>}
        {status === 'active' && t.is_mine && <GhostButton title="양도 철회" disabled={action.busy} onPress={withdraw} />}
        {status === 'active' && !t.is_mine && !t.is_owner && !completed && <>
          <Text style={T.titleMD}>인수할 예약자</Text><Text style={T.bodyLG}>{realName || '실제 계정으로 로그인해주세요'} · {schoolName} {departmentName}</Text>
          <TransferCheck checked={agreed} onPress={() => !action.busy && setAgreed(v => !v)} label="위 일시·인원·합의 조건을 그대로 승계하고, 즉시 예약자가 변경되는 것에 동의합니다." />
          {(!canBook || isPreview) && <Text style={T.bodyMD}>{isPreview ? '테스트 미리보기에서는 실제 양도받기를 할 수 없습니다.' : '학생증 인증 승인 후 양도받을 수 있습니다.'}</Text>}
          <LimeButton title="양도받기" loading={action.busy} disabled={!agreed || !canBook || isPreview} onPress={take} />
        </>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
