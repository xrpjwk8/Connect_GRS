import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';
import { AppSpacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface InteractiveUploaderProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  allowsFiles?: boolean;
  onPicked?: (uri: string, label: string) => void;
}

export default function InteractiveUploader({
  icon,
  title,
  subtitle,
  allowsFiles = false,
  onPicked,
}: InteractiveUploaderProps) {
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedLabel('사진 업로드 완료');
      onPicked?.(result.assets[0].uri, '사진 업로드 완료');
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      multiple: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedLabel(asset.name);
      onPicked?.(asset.uri, asset.name);
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
    <Pressable style={styles.container} onPress={handlePress}>
      <Ionicons
        name={pickedLabel === null ? icon : 'checkmark-circle'}
        size={28}
        color={pickedLabel === null ? AppColors.inkSecondary : AppColors.primaryDeep}
      />
      <Text style={[styles.title, { color: pickedLabel === null ? AppColors.primaryDeep : AppColors.ink }]}>
        {pickedLabel ?? title}
      </Text>
      <Text style={styles.subtitle}>{pickedLabel === null ? subtitle : '다시 누르면 변경할 수 있어요'}</Text>
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
  title: { ...Typography.titleMD, textAlign: 'center' },
  subtitle: { ...Typography.bodyMD, color: AppColors.neutral },
});
