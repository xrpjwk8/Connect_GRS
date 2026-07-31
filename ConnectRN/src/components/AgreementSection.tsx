import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { AppSpacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { MARKETING_CONSENT_TEXT, PRIVACY_POLICY_TEXT, TERMS_OF_SERVICE_TEXT } from '../data/legalDocs';

interface AgreementItem {
  key: string;
  label: string;
  required: boolean;
  content: string;
}

const ITEMS: AgreementItem[] = [
  { key: 'terms', label: '이용약관 동의', required: true, content: TERMS_OF_SERVICE_TEXT },
  { key: 'privacy', label: '개인정보 수집 및 이용 동의', required: true, content: PRIVACY_POLICY_TEXT },
  { key: 'marketing', label: '마케팅 정보 수신 동의', required: false, content: MARKETING_CONSENT_TEXT },
];

export default function AgreementSection({
  onRequiredAgreedChange,
}: {
  onRequiredAgreedChange: (allRequiredAgreed: boolean) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [viewingItem, setViewingItem] = useState<AgreementItem | null>(null);

  const allChecked = ITEMS.every((item) => checked[item.key]);
  const allRequiredAgreed = ITEMS.filter((item) => item.required).every((item) => checked[item.key]);

  useEffect(() => {
    onRequiredAgreedChange(allRequiredAgreed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRequiredAgreed]);

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = !allChecked;
    setChecked(Object.fromEntries(ITEMS.map((item) => [item.key, next])));
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.allRow} onPress={toggleAll}>
        <Ionicons
          name={allChecked ? 'checkbox' : 'square-outline'}
          size={22}
          color={allChecked ? AppColors.primaryDeep : AppColors.inkSecondary}
        />
        <Text style={styles.allLabel}>전체 동의합니다</Text>
      </Pressable>

      <View style={styles.divider} />

      {ITEMS.map((item) => (
        <View key={item.key} style={styles.itemRow}>
          <Pressable style={styles.itemCheckArea} onPress={() => toggle(item.key)}>
            <Ionicons
              name={checked[item.key] ? 'checkbox' : 'square-outline'}
              size={20}
              color={checked[item.key] ? AppColors.primaryDeep : AppColors.inkSecondary}
            />
            <Text style={styles.itemLabel}>
              <Text style={{ color: item.required ? AppColors.danger : AppColors.inkSecondary }}>
                {item.required ? '[필수] ' : '[선택] '}
              </Text>
              {item.label}
            </Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => setViewingItem(item)}>
            <Text style={styles.viewLink}>보기</Text>
          </Pressable>
        </View>
      ))}

      <Modal visible={viewingItem != null} animationType="slide" onRequestClose={() => setViewingItem(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>{viewingItem?.label.replace(' 동의', '')}</Text>
            <Pressable onPress={() => setViewingItem(null)} hitSlop={8}>
              <Ionicons name="close" size={22} color={AppColors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalBodyText}>{viewingItem?.content}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: AppSpacing.s10,
    padding: AppSpacing.s16,
    backgroundColor: AppColors.chipBG,
    borderRadius: AppRadius.lg,
  },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s8 },
  allLabel: { ...Typography.titleMD, color: AppColors.ink },
  divider: { height: 1, backgroundColor: AppColors.borderStrong },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemCheckArea: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s8, flex: 1 },
  itemLabel: { ...Typography.bodyLG, color: AppColors.ink },
  viewLink: { ...Typography.bodyMD, color: AppColors.inkSecondary, textDecorationLine: 'underline' },

  modalContainer: { flex: 1, backgroundColor: AppColors.surface, paddingTop: 56 },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingBottom: AppSpacing.s14,
  },
  modalTitle: { ...Typography.headlineSM, color: AppColors.ink },
  modalScrollContent: { paddingHorizontal: AppSpacing.s18, paddingBottom: AppSpacing.s40 },
  modalBodyText: { ...Typography.bodyLG, color: AppColors.inkSecondary, lineHeight: 22 },
});
