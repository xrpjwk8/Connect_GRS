import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { AppSpacing } from '../theme/spacing';
import { type AppRole } from '../theme/typography';
import { prepareUpload } from '../utils/prepareUpload';
import { showAlert } from '../utils/alert';
import { errorMessage } from '../services/backend';
import { useTypography } from '../state/AppState';

interface InteractiveUploaderProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  allowsFiles?: boolean;
  onPicked?: (uri: string, label: string) => void;
  appRole?: AppRole;
}

export default function InteractiveUploader({
  icon,
  title,
  subtitle,
  allowsFiles = false,
  onPicked,
  appRole = 'booker',
}: InteractiveUploaderProps) {
  const T = useTypography(appRole);
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const prepare = async (asset: { uri: string; name: string }) => {
    setBusy(true);
    try {
      const file = await prepareUpload(asset);
      setPickedLabel(file.name);
      onPicked?.(file.uri, file.name);
    } catch (e) { showAlert('파일 준비 실패', errorMessage(e)); }
    finally { setBusy(false); }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await prepare({ uri: asset.uri, name: asset.fileName ?? 'photo.jpg' });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      multiple: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await prepare(asset);
    }
  };

  const handlePress = () => {
    if (!allowsFiles) {
      pickPhoto();
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['취소', '사진 보관함', '파일 앱'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) pickPhoto();
          if (index === 2) pickFile();
        }
      );
    } else {
      Alert.alert('업로드 방법 선택', undefined, [
        { text: '사진 보관함', onPress: pickPhoto },
        { text: '파일 앱', onPress: pickFile },
        { text: '취소', style: 'cancel' },
      ]);
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress} disabled={busy}>
      <Ionicons
        name={pickedLabel === null ? icon : 'checkmark-circle'}
        size={28}
        color={pickedLabel === null ? AppColors.inkSecondary : AppColors.primaryDeep}
      />
      <Text
        style={[
          T.titleMD,
          styles.titleBase,
          { color: pickedLabel === null ? AppColors.primaryDeep : AppColors.ink },
        ]}
      >
        {busy ? '파일 준비 중…' : pickedLabel ?? title}
      </Text>
      <Text style={[T.bodyMD, styles.subtitle]}>
        {pickedLabel === null ? subtitle : '다시 누르면 변경할 수 있어요'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: AppSpacing.s8,
    paddingVertical: AppSpacing.s36,
    paddingHorizontal: AppSpacing.s16,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: AppRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColors.outlineVariant,
  },
  titleBase: { textAlign: 'center' },
  subtitle: { color: AppColors.neutral },
});
