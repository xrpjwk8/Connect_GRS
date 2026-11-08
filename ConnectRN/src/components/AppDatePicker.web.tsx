import React from 'react';
import type { ComponentProps } from 'react';
import type NativeDateTimePicker from '@react-native-community/datetimepicker';
import { serviceDate } from '../utils/reservation';
export default function AppDatePicker({ value, minimumDate, maximumDate, onChange }: ComponentProps<typeof NativeDateTimePicker>) {
  return <input aria-label="예약 날짜" type="date" value={serviceDate(value)}
    min={minimumDate ? serviceDate(minimumDate) : undefined} max={maximumDate ? serviceDate(maximumDate) : undefined}
    style={{ fontSize: 18, padding: 12, borderRadius: 12, border: '1px solid #ddd', background: 'white', maxWidth: '100%' }}
    onChange={event => {
      if (!event.target.value) return;
      const [year, month, day] = event.target.value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      onChange?.({ type: 'set', nativeEvent: { timestamp: date.getTime(), utcOffset: -date.getTimezoneOffset() } }, date);
    }} />;
}
