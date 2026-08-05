import React from 'react';
import { AppColors } from '../theme/colors';

interface AppDatePickerProps {
  value: Date;
  minimumDate?: Date;
  onChange: (date: Date) => void;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// @react-native-community/datetimepicker는 웹 구현체가 없어서(빈 화면) 브라우저 기본
// <input type="date"> 로 대체. 네이티브는 AppDatePicker.tsx가 대신 번들됨.
export default function AppDatePicker({ value, minimumDate, onChange }: AppDatePickerProps) {
  return (
    <input
      type="date"
      value={toIsoDate(value)}
      min={minimumDate ? toIsoDate(minimumDate) : undefined}
      onChange={(e) => {
        if (e.target.value) onChange(parseIsoDate(e.target.value));
      }}
      style={{
        width: '100%',
        padding: '14px',
        fontSize: 16,
        fontFamily: 'inherit',
        color: AppColors.ink,
        backgroundColor: AppColors.white,
        border: `1px solid ${AppColors.borderStrong}`,
        borderRadius: 14,
        boxSizing: 'border-box',
      }}
    />
  );
}
