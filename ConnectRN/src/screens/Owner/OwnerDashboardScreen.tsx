import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { ownerStore } from '../../models/mockData';
import { useAppState } from '../../state/AppState';
import { TagLabel } from '../../components/CommonComponents';
import type { MyReservation } from '../../models/types';

export default function OwnerDashboardScreen() {
  const { myReservations, setMyReservations } = useAppState();

  const requests = useMemo(
    () =>
      myReservations
        .filter((r) => r.storeId === ownerStore.id && r.status === 'pending')
        .sort((a, b) => (a.dateValue?.getTime() ?? 0) - (b.dateValue?.getTime() ?? 0)),
    [myReservations]
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;
    return myReservations
      .filter(
        (r) =>
          r.storeId === ownerStore.id &&
          r.status === 'confirmed' &&
          r.dateValue &&
          r.dateValue.getTime() >= now &&
          r.dateValue.getTime() <= sevenDaysLater
      )
      .sort((a, b) => (a.dateValue?.getTime() ?? 0) - (b.dateValue?.getTime() ?? 0));
  }, [myReservations]);

  const decide = (id: string, decision: 'confirmed' | 'rejected') => {
    setMyReservations(myReservations.map((r) => (r.id === id ? { ...r, status: decision } : r)));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Connect</Text>
        </View>

        <View style={styles.storeRow}>
          <Ionicons name="storefront-outline" size={16} color={AppColors.inkSecondary} />
          <Text style={styles.storeRowText}>{`[${ownerStore.location}] ${ownerStore.name}`}</Text>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>신규 예약 요청</Text>
          <TagLabel text={String(requests.length)} color={AppColors.danger} textColor={AppColors.white} />
        </View>

        <View style={{ gap: 12 }}>
          {requests.length === 0 ? (
            <Text style={styles.emptyText}>대기 중인 예약 요청이 없어요.</Text>
          ) : (
            requests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onAccept={() => decide(req.id, 'confirmed')}
                onReject={() => decide(req.id, 'rejected')}
              />
            ))
          )}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>다가오는 예약</Text>
        </View>

        <View style={{ gap: 12 }}>
          {upcoming.length === 0 ? (
            <Text style={styles.emptyText}>7일 이내 다가오는 예약이 없어요.</Text>
          ) : (
            upcoming.map((res) => <UpcomingCard key={res.id} res={res} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({
  req,
  onAccept,
  onReject,
}: {
  req: MyReservation;
  onAccept: () => void;
  onReject: () => void;
}) {
  const bookerName = req.bookerName || '예약자';
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestAccent} />
      <View style={styles.requestTopRow}>
        <View style={styles.requestAvatar}>
          <Text style={styles.requestAvatarText}>{bookerName[0]}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.requestNameRow}>
            <Text style={styles.requestName}>{bookerName}</Text>
            <Ionicons name="checkmark-circle" size={11} color={AppColors.primaryDeep} />
          </View>
          <Text style={styles.requestAffiliation}>{req.bookerAffiliation}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={styles.requestDateTime}>{req.dateLabel}</Text>
          <Text style={styles.requestPeople}>{req.people}명</Text>
        </View>
      </View>

      {req.requestMessage ? <Text style={styles.requestMessage}>“{req.requestMessage}”</Text> : null}

      <View style={styles.requestActionsRow}>
        <Pressable style={styles.rejectButton} onPress={onReject}>
          <Text style={styles.rejectButtonText}>거절</Text>
        </Pressable>
        <Pressable style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>수락</Text>
        </Pressable>
      </View>
    </View>
  );
}

function UpcomingCard({ res }: { res: MyReservation }) {
  const bookerName = res.bookerName || '예약자';
  return (
    <View style={styles.upcomingCard}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.requestNameRow}>
          <Text style={styles.requestName}>{bookerName}</Text>
          {res.isManual && <Text style={styles.manualTag}>(외부 예약)</Text>}
        </View>
        <Text style={styles.requestAffiliation}>{res.bookerAffiliation || res.eventPurpose || '단체 예약'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.requestDateTime}>{res.dateLabel}</Text>
        <Text style={styles.requestPeople}>{res.people}명</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: AppSpacing.s4 },
  headerTitle: { ...Typography.headlineLG, color: AppColors.primaryDeep },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  storeRowText: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s8 },
  sectionTitle: { ...Typography.headlineMD, color: AppColors.ink },
  emptyText: { ...Typography.bodyMD, color: AppColors.inkSecondary },

  requestCard: {
    gap: AppSpacing.s12,
    padding: AppSpacing.s14,
    paddingLeft: AppSpacing.s18,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    overflow: 'hidden',
  },
  requestAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: AppColors.primaryDeep },
  requestTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: AppSpacing.s12 },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: { ...Typography.titleMD, color: AppColors.ink },
  requestNameRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s4 },
  requestName: { ...Typography.titleMD, color: AppColors.ink },
  requestAffiliation: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  requestDateTime: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  requestPeople: { ...Typography.headlineSM, color: AppColors.ink },
  requestMessage: {
    ...Typography.bodyMD,
    color: AppColors.inkSecondary,
    padding: AppSpacing.s12,
    backgroundColor: AppColors.chipBG,
    borderRadius: AppRadius.md,
  },
  requestActionsRow: { flexDirection: 'row', gap: AppSpacing.s10 },
  rejectButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  rejectButtonText: { ...Typography.titleMD, color: AppColors.ink },
  acceptButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primaryDeep,
    borderRadius: AppRadius.lg,
  },
  acceptButtonText: { ...Typography.titleMD, color: AppColors.white },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppSpacing.s12,
    padding: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  manualTag: { ...Typography.labelMD, color: AppColors.neutral },
});
