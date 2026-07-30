// 4px 기반 스페이싱 스케일 (connect_design_system/DESIGN.md spacing 섹션 포팅)
// 값 자체보다 "어디서든 같은 이름 = 같은 간격"을 보장하는 것이 목적.
export const AppSpacing = {
  s2: 2,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s18: 18,
  s20: 20,
  s24: 24,
  s36: 36,
  s40: 40,

  // DESIGN.md 명명 토큰 별칭
  stackSM: 4, // stack-sm
  elementGap: 8, // element-gap
  cardGap: 12, // card-gap
  containerPadding: 18, // container-padding
  sectionGap: 36, // section-gap
} as const;
