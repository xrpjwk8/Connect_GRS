import React, { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GhostButton } from './Buttons';
import StorePhoto from './StorePhoto';
import { prepareUpload, type UploadFile } from '../utils/prepareUpload';
import { useTypography } from '../state/AppState';
import { errorMessage } from '../services/backend';
import { showAlert } from '../utils/alert';

export default function StorePhotoPicker({ value, currentPath, onChange, disabled, onBusyChange }: {
  value: UploadFile | null | undefined; currentPath?: string | null;
  onChange: (file: UploadFile | null | undefined) => void; disabled?: boolean; onBusyChange: (busy: boolean) => void;
}) {
  const T = useTypography('owner'); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const pick = async () => {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true); onBusyChange(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const prepared = await prepareUpload({ uri: asset.uri, name: asset.fileName ?? 'store.jpg', size: asset.fileSize }, 'photo');
      if (!prepared.mimeType?.startsWith('image/')) throw new Error('사진 파일을 선택해주세요.');
      onChange(prepared);
    } catch (error) { showAlert('사진 선택', errorMessage(error)); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  };
  return <View style={{ gap: 12 }}>
    <Text style={T.titleMD}>매장 소개 사진</Text>
    <Text style={T.bodyMD}>대표 사진 1장 · 매장 승인 후 예약자에게 공개됩니다.</Text>
    {value ? <Image source={{ uri: value.uri }} style={{ aspectRatio: 5 / 3, width: '100%', borderRadius: 16 }} resizeMode="cover" />
      : value === undefined && currentPath ? <StorePhoto path={currentPath} style={{ width: '100%', aspectRatio: 5 / 3, borderRadius: 16 }} /> : null}
    {value && <Text style={T.bodyMD}>{value.name} · {Math.ceil((value.size ?? 0) / 1024)}KB · 저장 전</Text>}
    {value === null && currentPath && <Text style={T.bodyMD}>저장하면 현재 사진을 삭제합니다.</Text>}
    <GhostButton title={busy ? '사진 압축 중…' : '사진 선택·교체'} onPress={pick} disabled={disabled || busy} appRole="owner" />
    {(value || (value === undefined && currentPath)) && <GhostButton title="사진 제거" onPress={() => onChange(null)} disabled={disabled || busy} appRole="owner" />}
    {value !== undefined && <GhostButton title="사진 변경 취소" onPress={() => onChange(undefined)} disabled={disabled || busy} appRole="owner" />}
  </View>;
}
