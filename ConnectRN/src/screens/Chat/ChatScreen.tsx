import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { InfoBanner } from '../../components/CommonComponents';
import { getMessages, sendMessage } from '../../api/chat';
import type { ChatMessage } from '../../models/types';

const OWNER_QUICK_REPLIES = ['계좌번호: 국민은행 123456-78-901234', '입금 확인했습니다, 감사합니다!'];
const BOOKER_QUICK_REPLIES = ['계좌번호 알려주세요', '방금 입금했습니다!'];
const POLL_INTERVAL_MS = 4000;

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservationId } = route.params;
  const { selectedRole, myReservations, bookerId, ownerId } = useAppState();
  const role = selectedRole ?? 'booker';
  const isOwner = role === 'owner';
  const senderId = isOwner ? ownerId : bookerId;

  const reservation = myReservations.find((r) => r.id === reservationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const quickReplies = isOwner ? OWNER_QUICK_REPLIES : BOOKER_QUICK_REPLIES;

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const refresh = useCallback(() => {
    getMessages(reservationId)
      .then(setMessages)
      .catch((e) => console.warn('Failed to load chat messages', e));
  }, [reservationId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const interval = setInterval(refresh, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [refresh])
  );

  const handleSend = async (text: string) => {
    if (!text.trim() || !senderId) return;
    setDraft('');
    try {
      await sendMessage(reservationId, senderId, role, text);
      refresh();
    } catch (e) {
      console.warn('Failed to send chat message', e);
    }
  };

  const peerName = isOwner ? reservation?.bookerName || '예약자' : reservation?.storeName || '가게';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{peerName}</Text>
        <View style={{ width: 22 }} />
      </View>

      {reservation && (
        <View style={styles.reservationInfoBar}>
          <Ionicons name="calendar-outline" size={14} color={AppColors.inkSecondary} />
          <Text style={styles.reservationInfoText}>예약정보: {reservation.dateLabel}</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <InfoBanner title="개인정보유출 주의" />

          {messages.map((m) => (
            <ChatBubble key={m.id} text={m.text} timeLabel={m.timeLabel} isMine={m.senderRole === role} />
          ))}
        </ScrollView>

        <View style={styles.quickReplyRow}>
          {quickReplies.map((q) => (
            <Pressable key={q} style={styles.quickReplyChip} onPress={() => handleSend(q)}>
              <Text style={styles.quickReplyText} numberOfLines={1}>
                {q}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="메시지 보내기"
            placeholderTextColor={AppColors.neutral}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => handleSend(draft)}
          />
          <Pressable style={styles.sendButton} onPress={() => handleSend(draft)}>
            <Ionicons name="arrow-up" size={18} color={AppColors.ink} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ text, timeLabel, isMine }: { text: string; timeLabel: string; isMine: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{text}</Text>
      </View>
      <Text style={styles.bubbleTime}>{timeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderStrong,
  },
  headerTitle: { ...Typography.titleMD, color: AppColors.ink },
  reservationInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s6,
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s8,
    backgroundColor: AppColors.chipBG,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderStrong,
  },
  reservationInfoText: { ...Typography.labelMD, color: AppColors.inkSecondary },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s14, gap: AppSpacing.s10 },

  bubbleRow: { alignItems: 'flex-start', gap: AppSpacing.s4, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: AppSpacing.s14, paddingVertical: AppSpacing.s10, borderRadius: AppRadius.lg },
  bubbleTheirs: { backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.borderStrong },
  bubbleMine: { backgroundColor: AppColors.primary },
  bubbleText: { ...Typography.bodyLG, color: AppColors.ink },
  bubbleTextMine: { color: AppColors.ink },
  bubbleTime: { ...Typography.labelMD, color: AppColors.neutral },

  quickReplyRow: {
    flexDirection: 'row',
    gap: AppSpacing.s8,
    paddingHorizontal: AppSpacing.s18,
    paddingBottom: AppSpacing.s8,
  },
  quickReplyChip: {
    paddingHorizontal: AppSpacing.s12,
    paddingVertical: AppSpacing.s8,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.chipBG,
    maxWidth: 220,
  },
  quickReplyText: { ...Typography.labelMD, color: AppColors.inkSecondary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s8,
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderStrong,
  },
  input: {
    flex: 1,
    ...Typography.bodyLG,
    color: AppColors.ink,
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.chipBG,
    borderRadius: AppRadius.pill,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
  },
});
