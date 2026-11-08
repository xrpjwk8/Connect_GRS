import { transferMemoError } from '../../utils/transferMemo';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { LimeButton } from '../../components/Buttons';
import { useAppState, useTypography } from '../../state/AppState';
import { useRefreshOnFocus, useServerAction } from '../../hooks/useServer';
import useNativeBack from '../../navigation/useNativeBack';
import { createTransfer } from '../../services/transfers';
import { AppColors } from '../../theme/colors';

export function TransferCheck({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  const T = useTypography('booker');
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={{ flexDirection: 'row', gap: 10, paddingVertical: 12 }}>
    <Text style={[T.titleMD, { color: AppColors.primaryDeep }]}>{checked ? '☑' : '□'}</Text><Text style={[T.bodyMD, { flex: 1, color: AppColors.ink }]}>{label}</Text>
  </Pressable>;
}
export default function TransferRegisterScreen() {
  const { myReservations, canBook, isPreview } = useAppState(); const route = useRoute<any>(); const navigation = useNavigation<any>();
  const action = useServerAction(); const goBack = useNativeBack(action.busy); const T = useTypography('booker'); useRefreshOnFocus();
  const reservation = myReservations.find(r => r.id === route.params.reservationId);
  const [memo, setMemo] = useState('');
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  // Replace only after the busy render has released usePreventRemove.
  useEffect(() => {
    if (registeredId && !action.busy) navigation.replace('TransferRecord', { transferId: registeredId });
  }, [registeredId, action.busy, navigation]);
  const memoError = transferMemoError(memo);
  const [terms, setTerms] = useState(''); const [noDeposit, setNoDeposit] = useState(false); const [agreed, setAgreed] = useState(false);
  const valid = reservation?.status === 'confirmed' && !reservation.isManual && !reservation.chatEpoch && !!reservation.startsAt && Date.parse(reservation.startsAt) > Date.now();
  const submit = () => { let id = ''; void action.run(async () => { id = await createTransfer(reservation!.id, terms.trim(), noDeposit, memo); }, () => setRegisteredId(id)); };
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }} edges={['top']}>
    <ScreenHeader title="예약 양도하기" onBack={goBack} disabled={action.busy} />
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 22, gap: 16 }}>
      {reservation ? <>
        <Text style={T.titleMD}>{reservation.storeName}</Text><Text style={T.bodyLG}>{reservation.dateLabel} · {reservation.people}명</Text>
        <Text style={T.bodyMD}>일시·인원은 변경할 수 없습니다. 다른 예약자가 인수하면 점주에게 변경 사실이 통보됩니다.</Text>
        <Text style={T.titleMD}>그대로 승계할 조건</Text>
        <Text style={T.bodyMD}>매장과 합의한 메뉴·금액·공간 사용 조건을 빠짐없이 적어주세요. 추가 조건이 없다면 “추가 합의 조건 없음”으로 입력해주세요. 이름·연락처·계좌번호는 적지 마세요.</Text>
        <TextInput accessibilityLabel="승계 조건" multiline maxLength={1000} value={terms} onChangeText={setTerms} editable={!action.busy}
          placeholder="예: 1인 메뉴 25,000원, 2층 단독 사용 / 추가 합의 조건 없음"
          style={[T.bodyLG, { minHeight: 140, textAlignVertical: 'top', padding: 16, backgroundColor: AppColors.white, borderRadius: 16, color: AppColors.ink }]} />
        <Text style={T.labelMD}>{terms.length}/1,000자 · 등록자가 제공한 조건으로 표시됩니다.</Text>
        <Text style={T.titleMD}>양도받는 분에게 남길 메모 · 선택</Text>
        <TextInput accessibilityLabel="양도 메모" value={memo} onChangeText={setMemo} editable={!action.busy} maxLength={100}
          placeholder="예: 좋은 모임 되시길 바랍니다."
          style={[T.bodyMD, { padding: 12, backgroundColor: AppColors.white, borderRadius: 12, color: AppColors.ink }]} />
        <Text style={[T.labelMD, { color: memoError ? AppColors.danger : AppColors.inkSecondary }]}>{Array.from(memo).length}/50자 · 이모지 사용 불가</Text>
        {memoError && <Text accessibilityRole="alert" style={[T.bodyMD, { color: AppColors.danger }]}>{memoError}</Text>}
        <Text style={T.bodyMD}>양도 완료 후 양도자와 인수자만 확인할 수 있습니다.</Text>
        <TransferCheck checked={noDeposit} onPress={() => !action.busy && setNoDeposit(v => !v)} label="이 예약과 관련해 주고받은 예약금이 없습니다. 예약금이 있으면 양도할 수 없습니다." />
        <TransferCheck checked={agreed} onPress={() => !action.busy && setAgreed(v => !v)} label="합의 조건을 모두 기재했으며, 인수자가 동의하면 별도 승인 없이 즉시 양도되는 것에 동의합니다." />
        {!canBook && <Text style={T.bodyMD}>학생증 인증 승인 후 양도할 수 있습니다.</Text>}
        {!valid && <Text style={T.bodyMD}>시작 전 확정된 앱 예약만 1회 양도할 수 있습니다.</Text>}
        <LimeButton title="양도 등록하기" loading={action.busy} disabled={!valid || !canBook || isPreview || !noDeposit || !agreed || !terms.trim() || !!memoError} onPress={submit} />
      </> : <Text style={T.bodyLG}>예약을 조회할 수 없습니다.</Text>}
    </ScrollView>
  </SafeAreaView>;
}
