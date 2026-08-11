import type { TextStyle } from 'react-native';

// Noto Sans KR (heading) / Inter (body) 가 디자인 의도이나, 외부 폰트 의존 없이
// 시스템 폰트로 동작 (Swift AppTypography.swift 포팅)
export const Typography: Record<string, TextStyle> = {
  displayHero: { fontSize: 32, fontWeight: '700' },
  headlineLG: { fontSize: 22, fontWeight: '700' },
  headlineMD: { fontSize: 20, fontWeight: '700' },
  headlineSM: { fontSize: 18, fontWeight: '600' },
  titleMD: { fontSize: 16, fontWeight: '600' },
  bodyLG: { fontSize: 14, fontWeight: '500' },
  bodyMD: { fontSize: 13, fontWeight: '500' },
  labelMD: { fontSize: 12, fontWeight: '500' },
  labelSM: { fontSize: 11, fontWeight: '600' },
};

// 점주(Owner) 화면은 사장님 연령대(40~50대)가 예약자(대학생) 기준 타이포보다
// 큰 글씨를 필요로 해, 마이페이지에서 고를 수 있는 3단계 확대 스케일을 둔다.
export type OwnerFontScale = 'normal' | 'large' | 'xlarge';

const OWNER_FONT_SCALE_OFFSET: Record<OwnerFontScale, number> = {
  normal: 3,
  large: 6,
  xlarge: 9,
};

export const OWNER_FONT_SCALE_OPTIONS: { value: OwnerFontScale; label: string }[] = [
  { value: 'normal', label: '보통' },
  { value: 'large', label: '크게' },
  { value: 'xlarge', label: '아주 크게' },
];

export function getOwnerTypography(scale: OwnerFontScale): Record<string, TextStyle> {
  const offset = OWNER_FONT_SCALE_OFFSET[scale];
  return Object.fromEntries(
    Object.entries(Typography).map(([key, style]) => [
      key,
      { ...style, fontSize: (style.fontSize ?? 0) + offset },
    ])
  ) as Record<string, TextStyle>;
}

export type AppRole = 'owner' | 'booker';

export function getTypography(role: AppRole, ownerFontScale: OwnerFontScale = 'normal'): Record<string, TextStyle> {
  return role === 'owner' ? getOwnerTypography(ownerFontScale) : Typography;
}
