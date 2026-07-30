// 디자인 토큰은 connect_design_system/DESIGN.md 를 따름 (Swift AppColors.swift 포팅)
export const AppColors = {
  // Surface / background
  surface: '#FAF9F9',
  canvasDeep: '#ECECE8',
  white: '#FFFFFF',
  surfaceContainer: '#EFEDED',
  surfaceContainerLow: '#F5F3F3',
  surfaceContainerHigh: '#E9E8E8',
  chipBG: '#F4F4F2',

  // Ink / text
  ink: '#0F0F0F',
  inkSecondary: '#3D3D3D',
  onSurface: '#1B1C1C',
  onSurfaceVariant: '#454934',

  // Primary (Lime)
  primary: '#D6FF3D',
  primaryDeep: '#526600',
  onPrimary: '#171E00',
  primaryDim: '#AFD500',

  // Outlines / borders
  outline: '#757962',
  outlineVariant: '#C5C9AE',
  borderStrong: '#ECECEC',
  borderSubtle: '#F4F4F4',

  // Semantic
  success: '#16A34A',
  danger: '#EF4444',
  dangerSoft: '#FFE9E7',
  warn: '#EAB308',

  // Misc
  neutral: '#8A8A8A',
  neutralLight: '#F5F5F3',
} as const;
