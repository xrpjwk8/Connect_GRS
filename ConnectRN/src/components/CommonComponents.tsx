import React, { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { Typography } from '../theme/typography';
import type { Store } from '../models/types';
import Card from './Card';

export function ConnectHomeHeader() {
  return (
    <View style={styles.headerRow}>
      <Ionicons name="location-outline" size={18} color={AppColors.primaryDeep} />
      <View style={styles.headerSpacer} />
      <Text style={styles.headerTitle}>Connect</Text>
      <View style={styles.headerSpacer} />
      <Ionicons name="notifications-outline" size={18} color={AppColors.ink} />
    </View>
  );
}

export function ChipButton({
  title,
  isSelected,
  onPress,
}: {
  title: string;
  isSelected: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: isSelected ? AppColors.primary : AppColors.white },
        { borderColor: isSelected ? AppColors.primaryDim : AppColors.borderStrong },
      ]}
    >
      <Text style={[styles.chipText, { color: isSelected ? AppColors.ink : AppColors.inkSecondary }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function TagLabel({
  text,
  color = AppColors.chipBG,
  textColor = AppColors.inkSecondary,
}: {
  text: string;
  color?: string;
  textColor?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={[styles.tagText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export function RatingView({ rating, count }: { rating: number; count?: number | null }) {
  return (
    <View style={styles.ratingRow}>
      <Ionicons name="star" size={11} color={AppColors.primaryDeep} />
      <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
      {count != null && <Text style={styles.ratingCount}>({count})</Text>}
    </View>
  );
}

export function StoreCard({ store, photoUri }: { store: Store; photoUri?: string | null }) {
  return (
    <Card padding={0} style={styles.storeCard}>
      <View style={styles.storeImageWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.storeImage} resizeMode="cover" />
        ) : (
          <View style={styles.storeImage}>
            <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.6)" />
          </View>
        )}
        <View style={styles.favoriteBadge}>
          <Ionicons
            name={store.isFavorite ? 'heart' : 'heart-outline'}
            size={16}
            color={store.isFavorite ? AppColors.danger : AppColors.white}
          />
        </View>
      </View>

      <View style={styles.storeBody}>
        <View style={styles.storeTitleRow}>
          <Text style={styles.storeName}>{store.name}</Text>
          <RatingView rating={store.rating} count={store.reviewCount} />
        </View>

        <View style={styles.storeMetaRow}>
          <Ionicons name="people-outline" size={11} color={AppColors.inkSecondary} />
          <Text style={styles.storeMetaText}>최대 {store.maxCapacity}석</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.storePrice}>₩{store.pricePerPerson.toLocaleString()}~</Text>
        </View>

        <View style={styles.storeKeywordsRow}>
          {store.keywords.slice(0, 3).map((keyword) => (
            <TagLabel key={keyword} text={keyword} />
          ))}
          <View style={{ flex: 1 }} />
          <TagLabel text={`수락률 ${store.acceptanceRate}%`} color={AppColors.primary} textColor={AppColors.ink} />
        </View>
      </View>
    </Card>
  );
}

export function FormLabel({ title, required = false }: { title: string; required?: boolean }) {
  return (
    <View style={styles.formLabelRow}>
      <Text style={styles.formLabelText}>{title}</Text>
      {required && <Text style={styles.formLabelRequired}>*</Text>}
    </View>
  );
}

export function AppTextField(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={AppColors.neutral}
      style={styles.textField}
      {...props}
    />
  );
}

export function InfoBanner({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.infoBanner}>
      <Ionicons name="information-circle-outline" size={18} color={AppColors.inkSecondary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.infoBannerTitle}>{title}</Text>
        {message ? <Text style={styles.infoBannerMessage}>{message}</Text> : null}
      </View>
    </View>
  );
}

export function PickerField({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.pickerField} onPress={() => setOpen(true)}>
        <Text style={[styles.pickerFieldText, { color: value ? AppColors.ink : AppColors.neutral }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={AppColors.inkSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.pickerSheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerOption}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function DashedUploader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.dashedUploader}>
      <Ionicons name={icon as any} size={28} color={AppColors.inkSecondary} />
      <Text style={styles.dashedTitle}>{title}</Text>
      <Text style={styles.dashedSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerSpacer: { flex: 1 },
  headerTitle: { ...Typography.headlineLG, color: AppColors.primaryDeep },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AppRadius.pill,
    borderWidth: 1,
  },
  chipText: { ...Typography.bodyLG },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { ...Typography.labelMD },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { ...Typography.bodyLG, color: AppColors.ink },
  ratingCount: { ...Typography.bodyMD, color: AppColors.neutral },

  storeCard: { overflow: 'hidden' },
  storeImageWrap: { position: 'relative' },
  storeImage: {
    width: '100%',
    aspectRatio: 2,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  storeBody: { padding: 16, gap: 10 },
  storeTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeName: { ...Typography.headlineSM, color: AppColors.ink },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeMetaText: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  storePrice: { ...Typography.bodyLG, color: AppColors.ink },
  storeKeywordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },

  formLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  formLabelText: { ...Typography.titleMD, color: AppColors.ink },
  formLabelRequired: { ...Typography.titleMD, color: AppColors.danger },

  textField: {
    ...Typography.bodyLG,
    color: AppColors.ink,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: AppColors.chipBG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.borderSubtle,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: AppColors.chipBG,
    borderRadius: 14,
  },
  infoBannerTitle: { ...Typography.titleMD, color: AppColors.ink },
  infoBannerMessage: { ...Typography.bodyMD, color: AppColors.inkSecondary },

  dashedUploader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 36,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: AppRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColors.outlineVariant,
  },
  dashedTitle: { ...Typography.titleMD, color: AppColors.primaryDeep },
  dashedSubtitle: { ...Typography.bodyMD, color: AppColors.neutral },

  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: AppColors.chipBG,
    borderRadius: 14,
  },
  pickerFieldText: { ...Typography.bodyLG },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    maxHeight: '60%',
    backgroundColor: AppColors.white,
    borderTopLeftRadius: AppRadius.xl,
    borderTopRightRadius: AppRadius.xl,
    paddingVertical: 8,
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderSubtle,
  },
  pickerOptionText: { ...Typography.bodyLG, color: AppColors.ink },
});
