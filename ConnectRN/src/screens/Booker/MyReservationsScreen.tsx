import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { ownerStore } from '../../models/mockData';
import { TagLabel } from '../../components/CommonComponents';
import { GhostButton, LimeButton } from '../../components/Buttons';
import Card from '../../components/Card';
import type { MyReservation } from '../../models/types';

function useReservationThumbUri(res: MyReservation): string | null {
  const { storePhotoSquareUri } = useAppState();
  return res.storeId === ownerStore.id ? storePhotoSquareUri : null;
}

type FilterKey = 'ongoing' | 'done' | 'cancelled';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ongoing', label: '진행 중' },
  { key: 'done', label: '완료' },
  { key: 'cancelled', label: '취소' },
];

function dateAscending(a: MyReservation, b: MyReservation): number {
  if (a.dateValue && b.dateValue) return a.dateValue.getTime() - b.dateValue.getTime();
  if (!a.dateValue && b.dateValue) return 1;
  if (a.dateValue && !b.dateValue) return -1;
  return 0;
}

export default function MyReservationsScreen() {
  const navigation = useNavigation<any>();
  const { myReservations, setMyReservations } = useAppState();
  const [filter, setFilter] = useState<FilterKey>('ongoing');

  const pendingList = myReservations.filter((r) => r.status === 'pending').sort(dateAscending);
  const confirmedList = myReservations.filter((r) => r.status === 'confirmed').sort(dateAscending);
  const completedList = myReservations.filter((r) => r.status === 'completed').sort(dateAscending);
  const cancelledByUserList = myReservations.filter((r) => r.status === 'cancelled').sort(dateAscending);
  const rejectedList = myReservations.filter((r) => r.status === 'rejected').sort(dateAscending);

  const handleCancel = (res: MyReservation) => {
    Alert.alert('신청을 취소하시겠습니까?', '이 예약 신청을 정말 취소하시겠습니까? 취소 후에는 되돌릴 수 없어요.', [
      { text: '아니요', style: 'cancel' },
      {
        text: '예, 취소합니다',
        style: 'destructive',
        onPress: () => {
          setMyReservations(myReservations.map((r) => (r.id === res.id ? { ...r, status: 'cancelled' } : r)));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 예약</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const selected = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  { backgroundColor: selected ? AppColors.ink : AppColors.white },
                ]}
              >
                <Text style={[styles.filterChipText, { color: selected ? AppColors.white : AppColors.ink }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filter === 'ongoing' && (
          <OngoingContent
            pendingList={pendingList}
            confirmedList={confirmedList}
            onEdit={(res) => navigation.navigate('ReservationEdit', { reservationId: res.id })}
            onCancel={handleCancel}
          />
        )}
        {filter === 'done' && <DoneContent completedList={completedList} />}
        {filter === 'cancelled' && (
          <CancelledContent cancelledByUserList={cancelledByUserList} rejectedList={rejectedList} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={36} color={AppColors.inkSecondary} />
      <Text style={styles.emptyStateMessage}>{message}</Text>
      <Text style={styles.emptyStateSub}>{sub}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function OngoingContent({
  pendingList,
  confirmedList,
  onEdit,
  onCancel,
}: {
  pendingList: MyReservation[];
  confirmedList: MyReservation[];
  onEdit: (res: MyReservation) => void;
  onCancel: (res: MyReservation) => void;
}) {
  if (pendingList.length === 0 && confirmedList.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        message="진행 중인 예약이 없어요"
        sub="홈에서 단체석을 검색하고 예약을 신청해보세요"
      />
    );
  }
  return (
    <>
      {pendingList.length > 0 && (
        <>
          <SectionHeader title="점주 응답 대기 중" />
          {pendingList.map((res) => (
            <ReservationCard key={res.id} res={res} onEdit={onEdit} onCancel={onCancel} />
          ))}
        </>
      )}
      {confirmedList.length > 0 && (
        <>
          <SectionHeader title="확정된 예약" />
          {confirmedList.map((res) => (
            <ReservationCard key={res.id} res={res} onEdit={onEdit} onCancel={onCancel} />
          ))}
        </>
      )}
    </>
  );
}

function DoneContent({ completedList }: { completedList: MyReservation[] }) {
  if (completedList.length === 0) {
    return <EmptyState icon="checkmark-circle-outline" message="완료된 예약이 없어요" sub="성사된 예약이 끝나면 여기에 기록돼요" />;
  }
  return (
    <View style={{ gap: 10 }}>
      {completedList.map((res) => (
        <CompletedRow key={res.id} res={res} />
      ))}
    </View>
  );
}

function CancelledContent({
  cancelledByUserList,
  rejectedList,
}: {
  cancelledByUserList: MyReservation[];
  rejectedList: MyReservation[];
}) {
  if (cancelledByUserList.length === 0 && rejectedList.length === 0) {
    return (
      <EmptyState
        icon="close-circle-outline"
        message="취소된 예약이 없어요"
        sub="취소하거나 거절당한 예약이 생기면 여기서 확인할 수 있어요"
      />
    );
  }
  return (
    <>
      {cancelledByUserList.length > 0 && (
        <>
          <SectionHeader title="내가 취소한 예약" />
          <View style={{ gap: 10 }}>
            {cancelledByUserList.map((res) => (
              <CancelledRow key={res.id} res={res} />
            ))}
          </View>
        </>
      )}
      {rejectedList.length > 0 && (
        <>
          <SectionHeader title="점주가 거절한 예약" />
          <View style={{ gap: 10 }}>
            {rejectedList.map((res) => (
              <CancelledRow key={res.id} res={res} />
            ))}
          </View>
        </>
      )}
    </>
  );
}

function ReservationCard({
  res,
  onEdit,
  onCancel,
}: {
  res: MyReservation;
  onEdit: (res: MyReservation) => void;
  onCancel: (res: MyReservation) => void;
}) {
  const thumbUri = useReservationThumbUri(res);
  const { storeNaverMapUrl, storeKakaoMapUrl } = useAppState();

  const handleLocationGuide = () => {
    const mapUrl = res.storeId === ownerStore.id ? storeNaverMapUrl || storeKakaoMapUrl : null;
    if (!mapUrl) {
      Alert.alert('위치 정보 없음', '점주가 아직 지도 링크를 등록하지 않았어요.');
      return;
    }
    Linking.openURL(mapUrl).catch(() => {
      Alert.alert('열 수 없어요', '등록된 지도 링크가 올바르지 않아요.');
    });
  };

  return (
    <Card style={styles.reservationCard}>
      <View style={styles.reservationTopRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.reservationTagRow}>
            {res.status === 'pending' ? (
              <TagLabel text="점주 응답 대기" color={AppColors.ink} textColor={AppColors.white} />
            ) : (
              <TagLabel text="확정" color={AppColors.primaryDeep} textColor={AppColors.white} />
            )}
            <Text style={styles.reservationDate}>{res.dateLabel}</Text>
          </View>
          <Text style={styles.reservationStoreName}>{res.storeName}</Text>
        </View>
        <View style={styles.reservationThumb}>
          {thumbUri ? (
            <Image source={{ uri: thumbUri }} style={styles.reservationThumbImage} resizeMode="cover" />
          ) : (
            <Ionicons name={res.imageSymbol as any} size={22} color="rgba(255,255,255,0.7)" />
          )}
        </View>
      </View>

      <View style={styles.reservationMetaBox}>
        <View style={styles.reservationMetaItem}>
          <Ionicons name="people-outline" size={16} color={AppColors.ink} />
          <Text style={styles.reservationMetaText}>{res.people}명</Text>
        </View>
        {res.budget != null && (
          <View style={styles.reservationMetaItem}>
            <Ionicons name="cash-outline" size={16} color={AppColors.ink} />
            <Text style={styles.reservationMetaText}>예산 {res.budget.toLocaleString()}원</Text>
          </View>
        )}
      </View>

      <View style={styles.reservationActionsRow}>
        {res.status === 'confirmed' ? (
          <LimeButton title="위치 안내" style={{ flex: 1, minHeight: 40 }} onPress={handleLocationGuide} />
        ) : (
          <>
            <GhostButton title="예약 수정" style={{ flex: 1, minHeight: 40 }} onPress={() => onEdit(res)} />
            <Pressable style={styles.dangerOutlineButton} onPress={() => onCancel(res)}>
              <Text style={styles.dangerOutlineButtonText}>신청 취소</Text>
            </Pressable>
          </>
        )}
      </View>
    </Card>
  );
}

function CompletedRow({ res }: { res: MyReservation }) {
  const thumbUri = useReservationThumbUri(res);
  return (
    <View style={styles.simpleRow}>
      <View style={styles.simpleThumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.reservationThumbImage} resizeMode="cover" />
        ) : (
          <Ionicons name={res.imageSymbol as any} size={18} color={AppColors.inkSecondary} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.simpleRowTitle}>{res.storeName}</Text>
        <Text style={styles.simpleRowSubtitle}>{res.dateLabel}</Text>
      </View>
      <TagLabel text="완료" color={AppColors.chipBG} textColor={AppColors.inkSecondary} />
    </View>
  );
}

function CancelledRow({ res }: { res: MyReservation }) {
  const thumbUri = useReservationThumbUri(res);
  return (
    <View style={styles.simpleRow}>
      <View style={styles.simpleThumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.reservationThumbImage} resizeMode="cover" />
        ) : (
          <Ionicons name={res.imageSymbol as any} size={18} color={AppColors.inkSecondary} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.simpleRowTitle}>{res.storeName}</Text>
        <Text style={styles.simpleRowSubtitle}>{res.dateLabel}</Text>
      </View>
      <TagLabel
        text={res.status === 'rejected' ? '점주 거절' : '취소'}
        color={AppColors.dangerSoft}
        textColor={AppColors.danger}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  header: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s10, alignItems: 'center' },
  headerTitle: { ...Typography.titleMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s18 },
  filterRow: { flexDirection: 'row', gap: AppSpacing.s10 },
  filterChip: {
    paddingHorizontal: AppSpacing.s16,
    paddingVertical: AppSpacing.s8,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  filterChipText: { ...Typography.bodyLG },
  sectionHeader: { ...Typography.headlineMD, color: AppColors.ink, paddingTop: AppSpacing.s4 },
  emptyState: { alignItems: 'center', gap: AppSpacing.s8, paddingVertical: AppSpacing.s40 },
  emptyStateMessage: { ...Typography.titleMD, color: AppColors.ink },
  emptyStateSub: { ...Typography.bodyMD, color: AppColors.inkSecondary, textAlign: 'center' },

  reservationCard: { gap: AppSpacing.s12 },
  reservationTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  reservationTagRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  reservationDate: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  reservationStoreName: { ...Typography.headlineSM, color: AppColors.ink },
  reservationThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reservationThumbImage: { width: '100%', height: '100%' },
  reservationMetaBox: {
    flexDirection: 'row',
    gap: AppSpacing.s14,
    paddingHorizontal: AppSpacing.s12,
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.chipBG,
    borderRadius: 10,
  },
  reservationMetaItem: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s4 },
  reservationMetaText: { ...Typography.bodyLG, color: AppColors.ink },
  reservationActionsRow: { flexDirection: 'row', gap: AppSpacing.s10 },
  dangerOutlineButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  dangerOutlineButtonText: { ...Typography.titleMD, color: AppColors.danger },

  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s12,
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  simpleThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: AppColors.chipBG,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  simpleRowTitle: { ...Typography.titleMD, color: AppColors.ink },
  simpleRowSubtitle: { ...Typography.bodyMD, color: AppColors.inkSecondary },
});
