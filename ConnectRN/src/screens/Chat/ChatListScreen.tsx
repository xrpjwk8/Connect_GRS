import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { ownerStore } from '../../models/mockData';
import type { ChatMessage, MyReservation } from '../../models/types';

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { selectedRole, myReservations, chatMessages } = useAppState();
  const isOwner = selectedRole === 'owner';

  const threads = useMemo(() => {
    const chattable = myReservations.filter((r) => r.status === 'confirmed' || r.status === 'pending');
    return isOwner ? chattable.filter((r) => r.storeId === ownerStore.id) : chattable;
  }, [myReservations, isOwner]);

  const lastMessageOf = (reservationId: string): ChatMessage | undefined => {
    const list = chatMessages.filter((m) => m.reservationId === reservationId);
    return list[list.length - 1];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {threads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={36} color={AppColors.inkSecondary} />
          <Text style={styles.emptyStateMessage}>대화 중인 예약이 없어요</Text>
          <Text style={styles.emptyStateSub}>예약이 확정되면 여기서 채팅할 수 있어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {threads.map((res) => (
            <ThreadRow
              key={res.id}
              res={res}
              isOwner={isOwner}
              lastMessage={lastMessageOf(res.id)}
              onPress={() => navigation.navigate('Chat', { reservationId: res.id })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ThreadRow({
  res,
  isOwner,
  lastMessage,
  onPress,
}: {
  res: MyReservation;
  isOwner: boolean;
  lastMessage: ChatMessage | undefined;
  onPress: () => void;
}) {
  const name = isOwner ? res.bookerName || '예약자' : res.storeName;
  const title = isOwner && res.bookerAffiliation ? `${name} (${res.bookerAffiliation})` : name;
  const subtitle = lastMessage ? lastMessage.text : '아직 대화가 없어요';

  return (
    <Pressable style={styles.threadRow} onPress={onPress}>
      {!isOwner && (
        <View style={styles.threadAvatar}>
          <Text style={styles.threadAvatarText}>{name[0]}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.threadTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.threadSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {lastMessage && <Text style={styles.threadTime}>{lastMessage.timeLabel}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  header: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s10, alignItems: 'center' },
  headerTitle: { ...Typography.titleMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s8, gap: AppSpacing.s10 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: AppSpacing.s8, paddingHorizontal: AppSpacing.s40 },
  emptyStateMessage: { ...Typography.titleMD, color: AppColors.ink },
  emptyStateSub: { ...Typography.bodyMD, color: AppColors.inkSecondary, textAlign: 'center' },

  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s12,
    padding: AppSpacing.s14,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
  },
  threadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadAvatarText: { ...Typography.titleMD, color: AppColors.ink },
  threadTitle: { ...Typography.titleMD, color: AppColors.ink },
  threadSubtitle: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  threadTime: { ...Typography.labelMD, color: AppColors.neutral },
});
