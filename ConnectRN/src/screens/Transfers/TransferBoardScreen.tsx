import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import TransferCard from '../../components/TransferCard';
import { GhostButton } from '../../components/Buttons';
import AppDatePicker from '../../components/AppDatePicker';
import useNativeBack from '../../navigation/useNativeBack';
import { useAppState, useTypography } from '../../state/AppState';
import { AppColors } from '../../theme/colors';
import { listTransfers } from '../../services/transfers';
import { errorMessage } from '../../services/backend';
import { serviceDate, timeMinute } from '../../utils/reservation';
import type { ReservationTransfer, TransferFilter } from '../../models/transfers';

export default function TransferBoardScreen() {
  const goBack = useNativeBack(); const navigation = useNavigation<any>(); const T = useTypography('booker');
  const { session, isPreview } = useAppState();
  const [date, setDate] = useState<Date | null>(null); const [showDate, setShowDate] = useState(false);
  const [time, setTime] = useState(''); const [people, setPeople] = useState(''); const [region, setRegion] = useState('');
  const [filter, setFilter] = useState<TransferFilter>({}); const [rows, setRows] = useState<ReservationTransfer[]>([]);
  const rowsRef = useRef(rows); rowsRef.current = rows;
  const [loading, setLoading] = useState(false); const [hasMore, setHasMore] = useState(false); const [error, setError] = useState('');
  const generation = useRef(0); const lock = useRef(false); const [version, setVersion] = useState(0);
  const apply = () => {
    try {
      if (people && (!/^\d+$/.test(people) || +people < 1 || +people > 10000)) throw new Error('인원은 1~10,000명으로 입력해주세요.');
      const minute = time.trim() ? timeMinute(time.trim()) : undefined;
      if (minute !== undefined && minute % 30 !== 0) throw new Error('시작 시간은 30분 단위로 입력해주세요.');
      rowsRef.current = []; setRows([]); setError(''); setFilter({ date: date ? serviceDate(date) : undefined, minute, people: people ? +people : undefined, region: region.trim() });
    } catch (e) { setError(errorMessage(e)); }
  };
  useFocusEffect(useCallback(() => {
    const run = ++generation.current; lock.current = true; setLoading(true); setError('');
    // Reconcile all already loaded pages without discarding the list/scroll on a detail round trip.
    const wanted = Math.max(20, rowsRef.current.length);
    void (async () => {
      const result: ReservationTransfer[] = []; let page: ReservationTransfer[] = [];
      do { page = await listTransfers(filter, 20, result.at(-1)); result.push(...page); } while (page.length === 20 && result.length < wanted && generation.current === run);
      if (run === generation.current) { setRows(result); setHasMore(page.length === 20); }
    })().catch(e => { if (run === generation.current) setError(errorMessage(e)); })
      .finally(() => { if (run === generation.current) { setLoading(false); lock.current = false; } });
    return () => { ++generation.current; lock.current = false; };
  }, [filter, version, session?.user.id, isPreview]));
  const loadMore = async () => {
    if (lock.current || !hasMore) return;
    lock.current = true; setLoading(true); const run = generation.current;
    try { const next = await listTransfers(filter, 20, rows.at(-1)); if (run === generation.current) { setRows(old => [...old, ...next]); setHasMore(next.length === 20); setError(''); } }
    catch (e) { if (run === generation.current) setError(errorMessage(e)); }
    finally { if (run === generation.current) { lock.current = false; setLoading(false); } }
  };
  const input = { borderWidth: 1, borderColor: AppColors.borderStrong, borderRadius: 12, padding: 12, backgroundColor: AppColors.white, color: AppColors.ink };
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }} edges={['top']}>
    <ScreenHeader title="양도 보드" onBack={goBack} />
    <FlatList data={rows} keyExtractor={t => t.id} contentContainerStyle={{ padding: 18, gap: 8 }} keyboardShouldPersistTaps="handled"
      refreshing={loading && rows.length > 0} onRefresh={() => setVersion(v => v + 1)}
      ListHeaderComponent={<View style={{ gap: 10, paddingBottom: 12 }}>
        <Text style={T.bodyMD}>최신 등록순 · 일시와 인원을 그대로 승계합니다.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <GhostButton title={date ? serviceDate(date) : '날짜 전체'} style={{ flex: 1 }} onPress={() => setShowDate(v => !v)} />
          {date && <GhostButton title="날짜 해제" onPress={() => setDate(null)} />}
        </View>
        {showDate && <AppDatePicker value={date ?? new Date()} mode="date" minimumDate={new Date()} onChange={(_, value) => { if (value) setDate(value); setShowDate(false); }} />}
        <TextInput accessibilityLabel="시작 시간" placeholder="시작 시간 · 예: 18:00 (익일 01시는 25:00)" value={time} onChangeText={setTime} style={[T.bodyMD, input]} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput accessibilityLabel="동일 인원" placeholder="인원 · 정확히 일치" keyboardType="number-pad" value={people} onChangeText={setPeople} style={[T.bodyMD, input, { flex: 1 }]} />
          <TextInput accessibilityLabel="지역" placeholder="지역 · 예: 신촌" value={region} onChangeText={setRegion} style={[T.bodyMD, input, { flex: 1 }]} />
        </View>
        <GhostButton title="조건 적용" onPress={apply} />
        {error ? <><Text accessibilityRole="alert" style={{ color: AppColors.danger }}>{error}</Text><GhostButton title="다시 불러오기" onPress={() => setVersion(v => v + 1)} /></> : null}
      </View>}
      renderItem={({ item }) => <TransferCard transfer={item} onPress={() => navigation.navigate('TransferDetail', { transferId: item.id })} />}
      ListEmptyComponent={!loading && !error ? <Text style={T.bodyLG}>조건에 맞는 양도 예약이 없어요.</Text> : null}
      ListFooterComponent={loading ? <ActivityIndicator /> : hasMore ? <GhostButton title="더 불러오기" onPress={loadMore} /> : null} />
  </SafeAreaView>;
}
