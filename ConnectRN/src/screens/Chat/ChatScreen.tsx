import React, { useRef, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { useAppState, useTypography } from '../../state/AppState';
import { InfoBanner } from '../../components/CommonComponents';

const OWNER_QUICK_REPLIES = ['계좌번호: 국민은행 123456-78-901234', '입금 확인했습니다, 감사합니다!'];
const BOOKER_QUICK_REPLIES = ['계좌번호 알려주세요', '방금 입금했습니다!'];

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservationId } = route.params;
  const { selectedRole, myReservations, chatMessages, sendChatMessage } = useAppState();
  const role = selectedRole ?? 'booker';
  const isOwner = role === 'owner';
  const T = useTypography(role);

  const reservation = myReservations.find((r) => r.id === reservationId);
  const messages = chatMessages.filter((m) => m.reservationId === reservationId);
  const quickReplies = isOwner ? OWNER_QUICK_REPLIES : BOOKER_QUICK_REPLIES;

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendChatMessage(reservationId, role, text);
    setDraft('');
  };

  const peerName = isOwner ? reservation?.bookerName || '예약자' : reservation?.storeName || '가게';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={AppColors.ink} />
        </Pressable>
        <Text style={[T.titleMD, { color: AppColors.ink }]}>{peerName}</Text>
        <View style={{ width: 22 }} />
      </View>

      {reservation && (
        <View style={styles.reservationInfoBar}>
          <Ionicons name="calendar-outline" size={14} color={AppColors.inkSecondary} />
          <Text style={[T.labelMD, { color: AppColors.inkSecondary }]}>예약정보: {reservation.dateLabel}</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <InfoBanner title="개인정보유출 주의" appRole={role} />

          {messages.map((m) => (
            <ChatBubble key={m.id} text={m.text} timeLabel={m.timeLabel} isMine={m.senderRole === role} role={role} />
          ))}
        </ScrollView>

        <View style={styles.quickReplyRow}>
          {quickReplies.map((q) => (
            <Pressable key={q} style={styles.quickReplyChip} onPress={() => handleSend(q)}>
              <Text style={[T.labelMD, { color: AppColors.inkSecondary }]} numberOfLines={1}>
                {q}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, T.bodyLG]}
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

function ChatBubble({
  text,
  timeLabel,
  isMine,
  role,
}: {
  text: string;
  timeLabel: string;
  isMine: boolean;
  role: 'owner' | 'booker';
}) {
  const T = useTypography(role);
  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[T.bodyLG, { color: AppColors.ink }]}>{text}</Text>
      </View>
      <Text style={[T.labelMD, { color: AppColors.neutral }]}>{timeLabel}</Text>
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
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s14, gap: AppSpacing.s10 },

  bubbleRow: { alignItems: 'flex-start', gap: AppSpacing.s4, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: AppSpacing.s14, paddingVertical: AppSpacing.s10, borderRadius: AppRadius.lg },
  bubbleTheirs: { backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.borderStrong },
  bubbleMine: { backgroundColor: AppColors.primary },

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
