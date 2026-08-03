// backend/src/main/java/com/connectgrs/backend/api/dto 의 Java record를 그대로 미러링.

export interface BookerProfileDto {
  id: string;
  schoolName: string;
  departmentName: string;
  position: string;
  realName: string;
  schoolEmail: string;
  phoneNumber: string;
}

export interface OwnerProfileDto {
  id: string;
  storeName: string;
  ownerName: string;
  contact: string;
  businessNumber: string;
  storeId: string;
}

export interface StoreSummaryResponseDto {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  maxCapacity: number;
  pricePerPerson: number;
  acceptanceRate: number;
  region: string;
  description: string;
  imageName: string;
  keywords: string[];
  favorite: boolean;
}

export interface ReservationResponseDto {
  id: string;
  storeId: string;
  storeName: string;
  imageName: string;
  ownerId: string;
  bookerId: string;
  bookerName: string;
  bookerAffiliation: string;
  date: string; // yyyy-MM-dd
  timeSlots: string[]; // HH:mm:ss
  people: number;
  budgetPerPerson: number | null;
  eventPurpose: string;
  requestMessage: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  createdAt: string;
}

export interface OwnerDashboardResponseDto {
  storeName: string;
  weeklyRevenueManWon: number;
  weeklyReservationCount: number;
  pendingRequestCount: number;
  pendingRequests: ReservationResponseDto[];
}

export interface ChatMessageResponseDto {
  id: string;
  reservationId: string;
  senderId: string;
  senderRole: 'BOOKER' | 'OWNER';
  text: string;
  createdAt: string;
}

export interface FilterMetadataResponseDto {
  regions: string[];
  categories: string[];
  universities: string[];
  timeOptions: string[];
}

export interface AvailabilitySlotDto {
  time: string;
  state: 'available' | 'blocked' | 'reserved' | 'closed';
}

export interface AvailabilityResponseDto {
  date: string;
  slots: AvailabilitySlotDto[];
}
