import useNativeBack from '../../navigation/useNativeBack';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppState, useTypography } from '../../state/AppState';
import { AppTextField, FormLabel } from '../../components/CommonComponents';
import { LimeButton, GhostButton } from '../../components/Buttons';
import { useServerAction } from '../../hooks/useServer';
import { minuteLabel, timeMinute } from '../../utils/reservation';
import { rpc } from '../../services/backend';
import StorePhotoPicker from '../../components/StorePhotoPicker';
import { saveStorePhoto } from '../../services/storePhotos';
import type { UploadFile } from '../../utils/prepareUpload';
import { showAlert } from '../../utils/alert';
import { AppColors } from '../../theme/colors';
export default function StoreInfoEditScreen() {
  const goBack = useNativeBack();
  const { ownerStoreRow, session } = useAppState(); const T = useTypography('owner');
  const navigation = useNavigation<any>(); const action = useServerAction();
  const [capacity, setCapacity] = useState(String(ownerStoreRow?.capacity ?? ''));
  const [shared, setShared] = useState(ownerStoreRow?.allow_shared ?? true);
  const [opening, setOpening] = useState(minuteLabel(ownerStoreRow?.opening_minute ?? 1020));
  const [closing, setClosing] = useState(minuteLabel(ownerStoreRow?.closing_minute ?? 1470));
  const [photo, setPhoto] = useState<UploadFile | null | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const save = () => action.run(async () => {
    if (picking) throw new Error('사진 압축이 끝난 뒤 저장해주세요.');
    if (!session) throw new Error('로그인이 필요합니다.');
    if (!ownerStoreRow) throw new Error('매장을 찾을 수 없습니다.');
    if (!/^\d+$/.test(capacity) || Number(capacity) < 1) throw new Error('정원을 확인해주세요.');
    await rpc('update_store_capacity', { p_store_id: ownerStoreRow.id, p_capacity: Number(capacity),
      p_allow_shared: shared, p_opening_minute: timeMinute(opening), p_closing_minute: timeMinute(closing) });
    if (photo !== undefined) {
      const result = await saveStorePhoto(ownerStoreRow.id, session.user.id, photo);
      setPhoto(undefined);
      if (result.cleanupPending) showAlert('사진 저장 완료', '새 사진은 저장됐지만 이전 파일 정리를 완료하지 못했습니다.');
    }
  }, () => navigation.goBack());
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}><ScrollView contentContainerStyle={{ padding: 22, gap: 20 }} keyboardShouldPersistTaps="handled">
    <GhostButton title="뒤로" onPress={goBack} appRole="owner" />
    <Text style={T.headlineLG}>{ownerStoreRow?.name} · 예약 설정</Text>
    <Text style={T.bodyLG}>기존 확정 예약을 수용할 수 있는 범위에서 정원과 영업시간을 변경할 수 있습니다.</Text>
    {([['최대 정원', capacity, setCapacity], ['영업 시작 (예: 17:00)', opening, setOpening], ['영업 종료 (예: 24:30)', closing, setClosing]] as const).map(([label, value, change]) =>
      <View key={label} style={{ gap: 8 }}><FormLabel title={label} appRole="owner" /><AppTextField value={value} onChangeText={change} editable={!action.busy} appRole="owner" /></View>)}
    <Text style={T.bodyMD}>시간은 30분 단위입니다. 다음 날 00:30은 24:30으로 입력해주세요.</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={T.bodyLG}>잔여 좌석만큼 여러 단체 예약 허용</Text><Switch value={shared} onValueChange={setShared} disabled={action.busy} /></View>
    <StorePhotoPicker value={photo} currentPath={ownerStoreRow?.photo_path} onChange={setPhoto} disabled={action.busy} onBusyChange={setPicking} />
    <Text style={T.bodyMD}>상세 소개·지도 링크 편집은 준비 중입니다.</Text>
    <LimeButton title={action.busy ? '저장 중…' : '변경사항 저장'} onPress={save} disabled={action.busy || picking} appRole="owner" />
  </ScrollView></SafeAreaView>;
}
