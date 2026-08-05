import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { AppColors } from '../theme/colors';

interface AppDatePickerProps {
  value: Date;
  minimumDate?: Date;
  onChange: (date: Date) => void;
}

// 네이티브(iOS/Android)용. 웹은 AppDatePicker.web.tsx가 대신 번들됨
// (@react-native-community/datetimepicker는 웹 구현체가 없어 빈 화면만 나옴).
export default function AppDatePicker({ value, minimumDate, onChange }: AppDatePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      minimumDate={minimumDate}
      display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
      onChange={(_event, selectedDate) => {
        if (selectedDate) onChange(selectedDate);
      }}
      themeVariant="light"
      accentColor={AppColors.primaryDeep}
    />
  );
}
