import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { OWNER_FONT_SCALE_OPTIONS, type OwnerFontScale } from '../../theme/typography';
import { useAppState, useTypography } from '../../state/AppState';
import { ownerStore } from '../../models/mockData';
import { GhostButton } from '../../components/Buttons';

export default function StoreProfileScreen() {
  const navigation = useNavigation<any>();
  const { logout, ownerFontScale, setOwnerFontScale } = useAppState();
  const Typography = useTypography('owner');
  const styles = useMemo(() => makeStyles(Typography), [Typography]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>마이페이지</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="storefront-outline" size={26} color={AppColors.primaryDeep} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.storeLocation}>{ownerStore.location}</Text>
            <Text style={styles.storeName}>{ownerStore.name}</Text>
          </View>
        </View>

        <View style={styles.fontScaleCard}>
          <Text style={styles.fontScaleTitle}>글씨 크기</Text>
          <View style={styles.fontScaleRow}>
            {OWNER_FONT_SCALE_OPTIONS.map((option) => (
              <FontScaleOption
                key={option.value}
                label={option.label}
                selected={option.value === ownerFontScale}
                onPress={() => setOwnerFontScale(option.value as OwnerFontScale)}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <MenuRow
          icon="storefront-outline"
          title="가게정보 관리"
          onPress={() => navigation.navigate('StoreInfoEdit')}
          styles={styles}
        />
        <MenuRow icon="card-outline" title="결제 수단 관리" styles={styles} />
        <MenuRow icon="document-text-outline" title="이용 약관" styles={styles} />
        <MenuRow icon="help-circle-outline" title="도움말 / FAQ" styles={styles} />

        <View style={{ height: 12 }} />

        <GhostButton title="로그아웃" onPress={logout} textStyle={{ color: AppColors.danger }} appRole="owner" />
      </ScrollView>
    </SafeAreaView>
  );
}

function FontScaleOption({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.fontScaleOption, selected && styles.fontScaleOptionSelected]}
    >
      <Text style={[styles.fontScaleOptionText, selected && styles.fontScaleOptionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  icon,
  title,
  onPress,
  styles,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  onPress?: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={AppColors.ink} style={{ width: 28 }} />
      <Text style={styles.menuRowText}>{title}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={18} color={AppColors.inkSecondary} />
    </Pressable>
  );
}

const makeStyles = (Typography: Record<string, TextStyle>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.surface },
    titleBar: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s12, alignItems: 'center' },
    titleText: { ...Typography.titleMD, color: AppColors.ink },
    scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s18, gap: AppSpacing.s18 },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: AppSpacing.s14,
      padding: AppSpacing.s16,
      backgroundColor: AppColors.white,
      borderRadius: AppRadius.lg,
      borderWidth: 1,
      borderColor: AppColors.borderStrong,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: AppColors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storeLocation: { ...Typography.bodyLG, color: AppColors.inkSecondary },
    storeName: { ...Typography.headlineSM, color: AppColors.ink },
    fontScaleCard: {
      gap: AppSpacing.s10,
      padding: AppSpacing.s16,
      backgroundColor: AppColors.white,
      borderRadius: AppRadius.lg,
      borderWidth: 1,
      borderColor: AppColors.borderStrong,
    },
    fontScaleTitle: { ...Typography.titleMD, color: AppColors.ink },
    fontScaleRow: { flexDirection: 'row', gap: AppSpacing.s8 },
    fontScaleOption: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: AppRadius.lg,
      backgroundColor: AppColors.surfaceContainerHigh,
    },
    fontScaleOptionSelected: { backgroundColor: AppColors.primary },
    fontScaleOptionText: { ...Typography.bodyLG, color: AppColors.inkSecondary },
    fontScaleOptionTextSelected: { color: AppColors.ink },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: AppSpacing.s16,
      paddingVertical: AppSpacing.s14,
      backgroundColor: AppColors.white,
      borderRadius: AppRadius.lg,
      borderWidth: 1,
      borderColor: AppColors.borderStrong,
    },
    menuRowText: { ...Typography.titleMD, color: AppColors.ink },
  });
