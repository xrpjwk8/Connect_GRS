// Swift Models/MockData.swift 의 도메인 타입 포팅 (mock 데이터 배열은 미포함)

export type UserRole = 'booker' | 'owner';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export const ReservationStatusLabel: Record<ReservationStatus, string> = {
  pending: '점주 응답 대기',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  rejected: '점주 거절',
};

export interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  maxCapacity: number;
  pricePerPerson: number;
  acceptanceRate: number;
  location: string;
  imageName: string;
  keywords: string[];
  isFavorite: boolean;
}

export interface MyReservation {
  id: string;
  storeId?: string;
  storeName: string;
  imageSymbol: string;
  status: ReservationStatus;
  dateLabel: string;
  people: number;
  budget?: number;

  bookerName?: string;
  bookerAffiliation?: string;

  dateValue?: Date;
  timeLabels: string[];
  eventPurpose: string;
  requestMessage: string;

  // 점주가 "새 예약 등록"으로 직접 추가한 오프라인(전화 등) 예약인지 여부
  isManual?: boolean;
}

export interface ChatMessage {
  id: string;
  reservationId: string;
  senderRole: UserRole;
  text: string;
  timeLabel: string;
}

export type TimeSlotState = 'available' | 'blocked' | 'reserved' | 'closed';

export interface TimeSlot {
  id: string;
  label: string;
  state: TimeSlotState;
}

export interface SearchFilter {
  region: string;
  date: Date;
  people: number;
  time: string;
}
