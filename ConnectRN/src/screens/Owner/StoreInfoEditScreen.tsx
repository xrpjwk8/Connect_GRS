import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../theme/colors';
import { AppRadius } from '../../theme/radius';
import { AppSpacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useAppState } from '../../state/AppState';
import { AppTextField, InfoBanner, TagLabel } from '../../components/CommonComponents';
import Card from '../../components/Card';

const CATEGORIES = ['전체', '고기집', '요리주점/포차', '호프/맥주', '한식/전골', '양식', '중식/일식', '치킨'];
const KEYWORD_LIMIT = 4;

export default function StoreInfoEditScreen() {
  const navigation = useNavigation<any>();
  const {
    capacityOverbookingEnabled,
    setCapacityOverbookingEnabled,
    storePhotoWideUri,
    setStorePhotoWideUri,
    storePhotoSquareUri,
    setStorePhotoSquareUri,
    storeNaverMapUrl,
    setStoreNaverMapUrl,
    storeKakaoMapUrl,
    setStoreKakaoMapUrl,
  } = useAppState();

  // 아래는 전부 "변경사항 저장" 누르기 전까지는 실제 앱 상태에 반영되지 않는 임시(draft) 값
  const [draftPhotoWideUri, setDraftPhotoWideUri] = useState(storePhotoWideUri);
  const [draftPhotoSquareUri, setDraftPhotoSquareUri] = useState(storePhotoSquareUri);
  const [draftOverbookingEnabled, setDraftOverbookingEnabled] = useState(capacityOverbookingEnabled);
  const [naverURL, setNaverURL] = useState(storeNaverMapUrl ?? '');
  const [kakaoURL, setKakaoURL] = useState(storeKakaoMapUrl ?? '');

  const [keywords, setKeywords] = useState(['최대 100석', '신촌역 도보 5분', '음료 서비스', '콘센트 있음']);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [deposit, setDeposit] = useState('10000');

  const handleSave = () => {
    setStorePhotoWideUri(draftPhotoWideUri);
    setStorePhotoSquareUri(draftPhotoSquareUri);
    setCapacityOverbookingEnabled(draftOverbookingEnabled);
    setStoreNaverMapUrl(naverURL.trim() || null);
    setStoreKakaoMapUrl(kakaoURL.trim() || null);
    navigation.goBack();
  };

  const keywordLimitReached = keywords.length >= KEYWORD_LIMIT;

  const handleAddKeyword = () => {
    const k = newKeyword.trim();
    if (keywordLimitReached) return;
    if (k && k.length <= 15) {
      setKeywords([...keywords, k]);
      setNewKeyword('');
    }
  };

  const handlePickStorePhoto = async (aspect: [number, number], onPicked: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onPicked(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={AppColors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>가게정보 관리</Text>
        <View style={{ width: 18 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10 }}>
          <SectionHeader icon="image-outline" title="가게 대표 사진" />
          <Pressable
            style={styles.photoUploadWide}
            onPress={() => handlePickStorePhoto([2, 1], setDraftPhotoWideUri)}
          >
            {draftPhotoWideUri && (
              <Image source={{ uri: draftPhotoWideUri }} style={styles.photoUploadImage} resizeMode="cover" />
            )}
            <View
              style={[
                styles.photoUploadOverlay,
                draftPhotoWideUri ? styles.photoUploadOverlayDim : null,
              ]}
            >
              <Ionicons name="camera" size={20} color={AppColors.white} />
              <View style={styles.photoUploadBadge}>
                <Text style={styles.photoUploadBadgeText}>{draftPhotoWideUri ? '사진 변경' : '사진 업로드'}</Text>
              </View>
            </View>
          </Pressable>
          <Text style={styles.hintText}>
            2:1 가로 이미지 · 예약자 검색 결과 카드에 노출돼요. 등록하지 않으면 기본 이미지로 보여요.
          </Text>
        </Card>

        <Card style={{ gap: 10 }}>
          <SectionHeader icon="square-outline" title="가게 정사각형 사진" />
          <Pressable
            style={styles.photoUploadSquare}
            onPress={() => handlePickStorePhoto([1, 1], setDraftPhotoSquareUri)}
          >
            {draftPhotoSquareUri && (
              <Image source={{ uri: draftPhotoSquareUri }} style={styles.photoUploadImage} resizeMode="cover" />
            )}
            <View
              style={[
                styles.photoUploadOverlay,
                draftPhotoSquareUri ? styles.photoUploadOverlayDim : null,
              ]}
            >
              <Ionicons name="camera" size={20} color={AppColors.white} />
              <View style={styles.photoUploadBadge}>
                <Text style={styles.photoUploadBadgeText}>{draftPhotoSquareUri ? '사진 변경' : '사진 업로드'}</Text>
              </View>
            </View>
          </Pressable>
          <Text style={styles.hintText}>
            1:1 정사각형 이미지 · 선택 사항이에요. 예약자 "내 예약" 카드 썸네일에 노출돼요.
          </Text>
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionHeader icon="list-outline" title="가게 업종 카테고리" />
          <Text style={styles.bodyMuted}>가게의 주요 업종을 하나 선택해 주세요. 검색 및 필터링에 활용됩니다.</Text>
          <View style={styles.flowRow}>
            {CATEGORIES.map((c) => {
              const selected = c === selectedCategory;
              return (
                <Pressable
                  key={c}
                  onPress={() => setSelectedCategory(c)}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: selected ? AppColors.primary : AppColors.chipBG },
                    { borderColor: selected ? AppColors.primaryDim : 'transparent' },
                  ]}
                >
                  <Text style={[styles.categoryChipText, { color: selected ? AppColors.ink : AppColors.inkSecondary }]}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={styles.keywordHeaderRow}>
            <SectionHeader icon="pricetag-outline" title="가게 키워드" />
            <View style={{ flex: 1 }} />
            <Text style={styles.keywordCountText}>{keywords.length}/{KEYWORD_LIMIT}</Text>
          </View>
          <View style={styles.keywordInputRow}>
            <TextInput
              style={styles.keywordInput}
              placeholder={keywordLimitReached ? `최대 ${KEYWORD_LIMIT}개까지 등록할 수 있어요` : '태그 추가 (예: 조용한 분위기)'}
              placeholderTextColor={AppColors.neutral}
              value={newKeyword}
              onChangeText={(text) => setNewKeyword(text.slice(0, 15))}
              editable={!keywordLimitReached}
            />
            <Pressable
              style={[styles.addButton, keywordLimitReached && styles.addButtonDisabled]}
              onPress={handleAddKeyword}
              disabled={keywordLimitReached}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </Pressable>
          </View>
          <View style={styles.flowRow}>
            {keywords.map((kw) => (
              <View key={kw} style={styles.keywordChip}>
                <Text style={styles.keywordChipText}>{kw}</Text>
                <Pressable onPress={() => setKeywords(keywords.filter((k) => k !== kw))} hitSlop={6}>
                  <Ionicons name="close" size={10} color={AppColors.inkSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <SectionHeader icon="cash-outline" title="예약금 설정" />
          <Text style={styles.bodyMuted}>악성노쇼 방지를 위한 예약금을 책정하여 노쇼를 방지하세요.</Text>
          <View style={styles.depositRow}>
            <TextInput
              style={styles.depositInput}
              value={deposit}
              onChangeText={(text) => setDeposit(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
            />
            <View style={{ flex: 1 }} />
            <Text style={styles.depositUnit}>KRW</Text>
          </View>
          <InfoBanner title="안내" message="이 금액은 예약 정책에 따라 최종 결제 금액에서 차감되거나 방문 후 환불됩니다." />
        </Card>

        <Card style={{ gap: 10 }}>
          <SectionHeader icon="options-outline" title="예약 정책" />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.fieldTitle}>잔여 좌석 기반 중복 예약</Text>
              <Text style={styles.bodyMuted}>
                이미 예약이 있는 시간대라도 매장 정원이 남아있으면 그 자리 수만큼 추가 예약을 받아요.
              </Text>
            </View>
            <ToggleSwitch value={draftOverbookingEnabled} onChange={setDraftOverbookingEnabled} />
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <SectionHeader icon="map-outline" title="가게주소 / 외부 지도 링크" />
          <View style={{ gap: 6 }}>
            <View style={styles.rowCenter}>
              <Text style={styles.fieldTitle}>네이버 지도 URL</Text>
              <TagLabel text="필수" color={AppColors.dangerSoft} textColor={AppColors.danger} />
            </View>
            <AppTextField
              placeholder="https://naver.me/..."
              value={naverURL}
              onChangeText={setNaverURL}
              autoCapitalize="none"
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldTitle}>카카오 지도 URL</Text>
            <AppTextField
              placeholder="https://kakaomap.com/..."
              value={kakaoURL}
              onChangeText={setKakaoURL}
              autoCapitalize="none"
            />
          </View>
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>변경사항 저장</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon} size={16} color={AppColors.ink} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.toggleTrack, { backgroundColor: value ? AppColors.primaryDeep : AppColors.borderStrong }]}
    >
      <View style={[styles.toggleKnob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
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
  scrollContent: { paddingHorizontal: AppSpacing.s18, paddingVertical: AppSpacing.s14, gap: AppSpacing.s18 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s6 },
  sectionHeaderText: { ...Typography.headlineSM, color: AppColors.ink },
  bodyMuted: { ...Typography.bodyMD, color: AppColors.inkSecondary },
  hintText: { ...Typography.labelMD, color: AppColors.inkSecondary },
  photoUploadWide: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: AppRadius.md,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoUploadSquare: {
    width: 140,
    aspectRatio: 1,
    borderRadius: AppRadius.md,
    backgroundColor: AppColors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoUploadImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  photoUploadOverlay: { alignItems: 'center', justifyContent: 'center', gap: AppSpacing.s4 },
  photoUploadOverlayDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  photoUploadBadge: {
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s8,
    borderRadius: AppRadius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  photoUploadBadgeText: { ...Typography.bodyLG, color: AppColors.white },
  flowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: AppSpacing.s8 },
  categoryChip: { paddingHorizontal: AppSpacing.s14, paddingVertical: AppSpacing.s8, borderRadius: AppRadius.pill, borderWidth: 1 },
  categoryChipText: { ...Typography.bodyLG },
  keywordHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  keywordCountText: { ...Typography.labelMD, color: AppColors.inkSecondary },
  keywordInputRow: { flexDirection: 'row', gap: AppSpacing.s8 },
  keywordInput: {
    flex: 1,
    ...Typography.bodyLG,
    color: AppColors.ink,
    paddingHorizontal: AppSpacing.s12,
    paddingVertical: AppSpacing.s10,
    backgroundColor: AppColors.chipBG,
    borderRadius: 14,
  },
  addButton: { paddingHorizontal: AppSpacing.s14, paddingVertical: AppSpacing.s10, borderRadius: 14, backgroundColor: AppColors.ink },
  addButtonDisabled: { backgroundColor: AppColors.neutral },
  addButtonText: { ...Typography.bodyLG, color: AppColors.white },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.s6,
    paddingHorizontal: AppSpacing.s10,
    paddingVertical: AppSpacing.s6,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.primary,
  },
  keywordChipText: { ...Typography.bodyLG, color: AppColors.ink },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.s14,
    paddingVertical: AppSpacing.s12,
    backgroundColor: AppColors.chipBG,
    borderRadius: 14,
  },
  depositInput: { ...Typography.bodyLG, color: AppColors.ink },
  depositUnit: { ...Typography.bodyLG, color: AppColors.inkSecondary },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s8 },
  fieldTitle: { ...Typography.titleMD, color: AppColors.ink },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.s12 },
  toggleTrack: { width: 44, height: 26, borderRadius: AppRadius.pill, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: AppColors.white },
  bottomBar: {
    flexDirection: 'row',
    gap: AppSpacing.s10,
    paddingHorizontal: AppSpacing.s18,
    paddingVertical: AppSpacing.s12,
    backgroundColor: AppColors.white,
  },
  saveButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.pill,
  },
  saveButtonText: { ...Typography.titleMD, color: AppColors.ink },
});
