import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { GhostButton } from '../../components/Buttons';

export default function StoreProfileScreen() {
  const navigation = useNavigation<any>();
  const { logout, ownerStoreInfo } = useAppState();

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
            <Text style={styles.storeLocation}>{ownerStoreInfo?.location ?? ''}</Text>
            <Text style={styles.storeName}>{ownerStoreInfo?.name ?? ''}</Text>
          </View>
        </View>

        <MenuRow
          icon="storefront-outline"
          title="가게정보 관리"
          onPress={() => navigation.navigate('StoreInfoEdit')}
        />
        <MenuRow icon="card-outline" title="결제 수단 관리" />
        <MenuRow icon="document-text-outline" title="이용 약관" />
        <MenuRow icon="help-circle-outline" title="도움말 / FAQ" />

        <View style={{ height: 12 }} />

        <GhostButton title="로그아웃" onPress={logout} textStyle={{ color: AppColors.danger }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  onPress?: () => void;
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

const styles = StyleSheet.create({
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
