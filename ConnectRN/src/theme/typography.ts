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
