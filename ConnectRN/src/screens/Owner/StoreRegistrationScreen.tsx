import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTextField, FormLabel, PickerField } from '../../components/CommonComponents';
import { LimeButton, GhostButton } from '../../components/Buttons';
import { useAppState, useTypography } from '../../state/AppState';
import { rpc, errorMessage } from '../../services/backend';
import { supabase } from '../../lib/supabase';
import StorePhotoPicker from '../../components/StorePhotoPicker';
import { saveStorePhoto } from '../../services/storePhotos';
import type { UploadFile } from '../../utils/prepareUpload';
import { regions, categories } from '../../models/mockData';
import { AppColors } from '../../theme/colors';
export default function StoreRegistrationScreen() {
  const { refresh, logout, session, isAdmin, setAdminPanelOpen } = useAppState();
  const T = useTypography('owner');
  const [name, setName] = useState(''); const [region, setRegion] = useState('');
  const [category, setCategory] = useState(''); const [capacity, setCapacity] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [photo, setPhoto] = useState<UploadFile | null | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  async function save() {
    if (lock.current || picking) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!name.trim() || !region.trim() || !category.trim() || !/^\d+$/.test(capacity) || Number(capacity) < 1) throw new Error('매장 정보와 정원을 확인해주세요.');
      // Recover a successful registration whose response was lost before retrying.
      const { data, error } = await supabase.from('stores').select('id').eq('owner_id', session!.user.id).limit(1);
      if (error) throw error;
      const store = data[0] ?? await rpc('register_store', { p_name: name.trim(), p_region: region.trim(), p_category: category.trim(), p_capacity: Number(capacity) });
      if (photo) {
        await saveStorePhoto(store.id, session!.user.id, photo);
        setPhoto(undefined);
      }
      await refresh();
    } catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}><ScrollView contentContainerStyle={{ padding: 22, gap: 20 }} keyboardShouldPersistTaps="handled">
    <Text style={T.headlineLG}>매장 등록</Text>
    <Text style={T.bodyLG}>매장 정보를 등록해주세요. 운영자 승인 후 예약자에게 공개됩니다.</Text>
    <View style={{ gap: 8 }}><FormLabel title="매장명" appRole="owner" /><AppTextField appRole="owner" accessibilityLabel="매장명" placeholder="매장명을 입력해주세요" value={name} onChangeText={setName} editable={!busy} /></View>
    <View style={{ gap: 8 }}><FormLabel title="지역" appRole="owner" /><PickerField appRole="owner" placeholder="지역을 선택해주세요" value={region} options={regions} onChange={setRegion} disabled={busy} /></View>
    <View style={{ gap: 8 }}><FormLabel title="업종" appRole="owner" /><PickerField appRole="owner" placeholder="업종을 선택해주세요" value={category} options={categories.filter(value => value !== '전체')} onChange={setCategory} disabled={busy} /></View>
    <View style={{ gap: 8 }}><FormLabel title="최대 정원" appRole="owner" /><AppTextField appRole="owner" accessibilityLabel="최대 정원" placeholder="예: 50" value={capacity} onChangeText={setCapacity} editable={!busy} keyboardType="number-pad" /></View>
    <StorePhotoPicker value={photo} onChange={setPhoto} disabled={busy || picking} onBusyChange={setPicking} />
    {error ? <Text accessibilityRole="alert" style={[T.bodyLG, { color: AppColors.danger }]}>{error}</Text> : null}
    <LimeButton title={busy ? '등록 중…' : '매장 등록하기'} onPress={save} disabled={busy || picking} appRole="owner" />
    {isAdmin && <GhostButton title="관리자 학생증 심사" onPress={() => setAdminPanelOpen(true)} disabled={busy || picking} appRole="owner" />}
    <GhostButton title="로그아웃" onPress={logout} disabled={busy || picking} appRole="owner" />
  </ScrollView></SafeAreaView>;
}
