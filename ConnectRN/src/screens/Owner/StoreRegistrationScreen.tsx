import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTextField, FormLabel } from '../../components/CommonComponents';
import { LimeButton, GhostButton } from '../../components/Buttons';
import { useAppState, useTypography } from '../../state/AppState';
import { rpc, errorMessage } from '../../services/backend';
import { supabase } from '../../lib/supabase';
import { AppColors } from '../../theme/colors';
export default function StoreRegistrationScreen() {
  const { refresh, logout, session, isAdmin, setAdminPanelOpen } = useAppState();
  const T = useTypography('owner');
  const [name, setName] = useState(''); const [region, setRegion] = useState('신촌');
  const [category, setCategory] = useState('요리주점/포차'); const [capacity, setCapacity] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!name.trim() || !region.trim() || !category.trim() || !/^\d+$/.test(capacity) || Number(capacity) < 1) throw new Error('매장 정보와 정원을 확인해주세요.');
      // Recover a successful registration whose response was lost before retrying.
      const { data, error } = await supabase.from('stores').select('id').eq('owner_id', session!.user.id).limit(1);
      if (error) throw error;
      if (!data.length) await rpc('register_store', { p_name: name.trim(), p_region: region.trim(), p_category: category.trim(), p_capacity: Number(capacity) });
      await refresh();
    } catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}><ScrollView contentContainerStyle={{ padding: 22, gap: 20 }} keyboardShouldPersistTaps="handled">
    <Text style={T.headlineLG}>매장 등록</Text>
    <Text style={T.bodyLG}>매장 정보를 등록해주세요. 운영자 승인 후 예약자에게 공개됩니다.</Text>
    {([['매장명', name, setName], ['지역', region, setRegion], ['업종', category, setCategory], ['최대 정원', capacity, setCapacity]] as const).map(([label, value, change]) =>
      <View key={label} style={{ gap: 8 }}><FormLabel title={label} appRole="owner" /><AppTextField appRole="owner" value={value} onChangeText={change} editable={!busy} keyboardType={label === '최대 정원' ? 'number-pad' : 'default'} /></View>)}
    {error ? <Text accessibilityRole="alert" style={[T.bodyLG, { color: AppColors.danger }]}>{error}</Text> : null}
    <LimeButton title={busy ? '등록 중…' : '매장 등록하기'} onPress={save} disabled={busy} appRole="owner" />
    {isAdmin && <GhostButton title="관리자 학생증 심사" onPress={() => setAdminPanelOpen(true)} disabled={busy} appRole="owner" />}
    <GhostButton title="로그아웃" onPress={logout} disabled={busy} appRole="owner" />
  </ScrollView></SafeAreaView>;
}
