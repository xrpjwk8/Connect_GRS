// Swift Models/MockData.swift 의 mock 데이터 포팅
import type { TimeSlot } from './types';

let uuidCounter = 0;
function uuid(): string {
  uuidCounter += 1;
  return `mock-${uuidCounter}`;
}

export const universities = ['연세대학교', '고려대학교', '서강대학교', '한양대학교', '이화여자대학교', '홍익대학교'];

// 영업 시간대 기본값. 'closed'는 영업 외 시간, 나머지는 'available'에서 시작해
// 점주의 수동 차단(blocked) 또는 확정된 예약(reserved)에 따라 TimeBlockScreen에서
// 실시간으로 계산됨.
export const defaultTimeSlots: TimeSlot[] = [
  { id: uuid(), label: '16:00 ~ 16:30', state: 'closed' },
  { id: uuid(), label: '16:30 ~ 17:00', state: 'closed' },
  { id: uuid(), label: '17:00 ~ 17:30', state: 'closed' },
  { id: uuid(), label: '17:30 ~ 18:00', state: 'closed' },
  { id: uuid(), label: '18:00 ~ 18:30', state: 'available' },
  { id: uuid(), label: '18:30 ~ 19:00', state: 'available' },
  { id: uuid(), label: '19:00 ~ 19:30', state: 'available' },
  { id: uuid(), label: '19:30 ~ 20:00', state: 'available' },
  { id: uuid(), label: '20:00 ~ 20:30', state: 'available' },
  { id: uuid(), label: '20:30 ~ 21:00', state: 'available' },
  { id: uuid(), label: '21:00 ~ 21:30', state: 'available' },
  { id: uuid(), label: '21:30 ~ 22:00', state: 'available' },
  { id: uuid(), label: '22:00 ~ 22:30', state: 'available' },
  { id: uuid(), label: '22:30 ~ 23:00', state: 'available' },
  { id: uuid(), label: '23:00 ~ 23:30', state: 'available' },
  { id: uuid(), label: '23:30 ~ 00:00', state: 'available' },
  { id: uuid(), label: '00:00 ~ 00:30', state: 'closed' },
  { id: uuid(), label: '00:30 ~ 01:00', state: 'closed' },
  { id: uuid(), label: '01:00 ~ 01:30', state: 'closed' },
  { id: uuid(), label: '01:30 ~ 02:00', state: 'closed' },
];
