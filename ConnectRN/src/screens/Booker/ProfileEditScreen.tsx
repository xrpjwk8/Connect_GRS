import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { universities } from '../../models/mockData';
import { AppTextField, FormLabel, InfoBanner, PickerField, TagLabel } from '../../components/CommonComponents';
import { GhostButton, LimeButton } from '../../components/Buttons';
import Card from '../../components/Card';

export default function ProfileEditScreen() {
  const navigation = useNavigation<any>();
  const appState = useAppState();

  const [schoolName, setLocalSchoolName] = useState(appState.schoolName || '연세대학교');
  const [departmentName, setLocalDepartmentName] = useState(appState.departmentName || '경영학과');
  const [position, setLocalPosition] = useState(appState.position || '부회장');
  const [realName, setLocalRealName] = useState(appState.realName || '김재원');
  const [schoolEmail, setLocalSchoolEmail] = useState(appState.schoolEmail || 'jaewon@yonsei.ac.kr');
  const [phoneNumber, setLocalPhoneNumber] = useState(appState.phoneNumber || '01012345678');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  const displayImageUri = pendingImageUri ?? appState.profileImageUri;

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    showAlert('신원 재인증이 필요할 수 있습니다', '그래도 수정하시겠습니까?', [
      { text: '아니요', style: 'cancel' },
      { text: '예', onPress: submitSave },
    ]);
  };

  const submitSave = () => {
    appState.setSchoolName(schoolName);
    appState.setDepartmentName(departmentName);
    appState.setPosition(position);
    appState.setRealName(realName);
    appState.setSchoolEmail(schoolEmail);
    appState.setPhoneNumber(phoneNumber);
    if (pendingImageUri) appState.setProfileImageUri(pendingImageUri);

    showAlert('저장되었습니다', '프로필 정보가 업데이트되었습니다.', [
      { text: '확인', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>개인정보 수정</Text>
        <View style={{ width: 18 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {displayImageUri ? (
              <Image source={{ uri: displayImageUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{realName ? realName[0] : '?'}</Text>
              </View>
            )}
            <Pressable style={styles.cameraBadge} onPress={handlePickPhoto}>
              <Ionicons name="camera" size={16} color={AppColors.white} />
            </Pressable>
          </View>
          <Text style={styles.avatarCaption}>프로필 사진 변경</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>기본 정보</Text>

          <View style={styles.field}>
            <FormLabel title="학교명" />
            <PickerField
              placeholder="학교를 선택해주세요"
              value={schoolName}
              options={universities}
              onChange={setLocalSchoolName}
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="학과 / 단체명" />
            <AppTextField placeholder="예: 경영학과" value={departmentName} onChangeText={setLocalDepartmentName} />
          </View>

          <View style={styles.field}>
            <FormLabel title="직책" />
            <AppTextField placeholder="예: 회장, 과대표" value={position} onChangeText={setLocalPosition} />
          </View>

          <View style={styles.field}>
            <FormLabel title="이름" />
            <AppTextField placeholder="실명" value={realName} onChangeText={setLocalRealName} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>연락처</Text>

          <View style={styles.field}>
            <View style={styles.rowBetween}>
              <FormLabel title="학교 메일" />
              <TagLabel text="인증 완료" color={AppColors.primary} textColor={AppColors.ink} />
            </View>
            <AppTextField
              placeholder="example@university.ac.kr"
              value={schoolEmail}
              onChangeText={setLocalSchoolEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <FormLabel title="휴대폰 번호" />
            <AppTextField
              placeholder="‘-’ 없이 숫자만 입력"
              value={phoneNumber}
              onChangeText={(text) => setLocalPhoneNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>
        </Card>

        <InfoBanner
          title="정보 수정 안내"
          message="학교 정보를 변경하면 신원 재인증이 필요할 수 있습니다. 학교 메일 변경 시 인증번호가 새로 발송됩니다."
        />

        <View style={{ gap: 10 }}>
          <GhostButton title="비밀번호 변경" />
          <Pressable style={styles.dangerTextButton}>
            <Text style={styles.dangerTextButtonText}>계정 탈퇴</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <LimeButton title="저장하기" style={{ flex: 1, borderRadius: AppRadius.lg }} onPress={handleSave} />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s14,
  },
  topBarTitle: { ...Typography.titleMD, color: AppColors.ink },
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s18, gap: AppSpacing.s20 },
  avatarSection: { alignItems: 'center', gap: AppSpacing.s12, paddingTop: AppSpacing.s4 },
  avatarWrap: { width: 96, height: 96 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: AppColors.ink },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: AppSpacing.s8,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.ink,
  },
  avatarCaption: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  card: {
    gap: AppSpacing.s16,
  },
  cardTitle: { ...Typography.headlineSM, color: AppColors.ink },
  field: { gap: AppSpacing.s6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dangerTextButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  dangerTextButtonText: { ...Typography.titleMD, color: AppColors.danger },
  bottomBar: {
    flexDirection: 'row',
    gap: AppSpacing.s10,
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s12,
    backgroundColor: AppColors.white,
  },
});
