import BackButton from '../../components/BackButton';
import useNativeBack from '../../navigation/useNativeBack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppState, useTypography } from '../../state/AppState';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../models/database.types';
import { errorMessage } from '../../services/backend';
import { registerPush } from '../../services/pushNotifications';
import { openNotification } from '../../services/notifications';
import { GhostButton } from '../../components/Buttons';
import { AppColors } from '../../theme/colors';
type Row = Database['public']['Tables']['notifications']['Row'];

export default function NotificationInboxScreen() {
  const goBack = useNativeBack();
  const { session, selectedRole, isPreview } = useAppState(); const T = useTypography(selectedRole ?? 'booker'); const navigation = useNavigation<any>();
  const [rows, setRows] = useState<Row[]>([]); const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false); const [limit, setLimit] = useState(50); const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!session || isPreview) return;
    const run = ++generation.current;
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit);
    if (generation.current !== run) return;
    if (error) setError(errorMessage(error)); else { setRows(data); setError(''); }
  }, [session?.user.id, isPreview, limit]);
  useFocusEffect(useCallback(() => { void refresh(); return () => { ++generation.current; }; }, [refresh]));
  useEffect(() => {
    if (!session || isPreview) return;
    const channel = supabase.channel(`inbox:${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => { void refresh(); }).subscribe();
    const timer = setInterval(() => { void refresh(); }, 30000);
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [refresh]);
  const enable = async () => {
    if (!session || busy) return; setBusy(true);
    try { setStatus(await registerPush(session.user.id, true)); } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}><ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
    <BackButton onPress={goBack} />
    <Text style={T.headlineLG}>알림</Text>
    <GhostButton title={busy ? '기기 등록 중…' : '예약·채팅 푸시 알림 켜기'} onPress={enable} disabled={busy || isPreview} />
    {Platform.OS !== 'web' && <GhostButton title="기기 알림 설정 열기" onPress={() => { void Linking.openSettings(); }} />}
    {status ? <Text style={T.bodyMD}>{status}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: AppColors.danger }}>{error}</Text> : null}
    <GhostButton title="새로고침" onPress={() => void refresh()} />
    {!rows.length && <Text style={T.bodyMD}>아직 받은 알림이 없습니다.</Text>}
    {rows.map(row => <Pressable key={row.id} accessibilityRole="button" style={{ padding: 16, gap: 8, backgroundColor: row.read_at ? AppColors.white : AppColors.chipBG, borderRadius: 16 }} onPress={() => {
      if (session) void openNotification(row.id, session.user.id).then(() => refresh()).catch(e => setError(errorMessage(e)));
    }}>
      <Text style={T.titleMD}>{row.read_at ? '' : '● '}{row.title}</Text>
      <Text style={T.bodyMD}>{row.body}</Text>
      <Text style={T.labelMD}>{new Date(row.created_at).toLocaleString('ko-KR')}</Text>
    </Pressable>)}
    {rows.length === limit && <GhostButton title="이전 알림 더 보기" onPress={() => setLimit(n => n + 50)} />}
  </ScrollView></SafeAreaView>;
}
