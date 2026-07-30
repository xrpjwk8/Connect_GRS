// Swift Models/MockData.swift 의 mock 데이터 포팅
import type { ChatMessage, MyReservation, Store, TimeSlot } from './types';

let uuidCounter = 0;
function uuid(): string {
  uuidCounter += 1;
  return `mock-${uuidCounter}`;
}

function dayOffset(offsetDays: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const regions = ['신촌', '왕십리', '건대', '혜화'];
export const categories = ['전체', '술집', '고깃집', '파티룸', '카페'];
export const timeOptions = [
  '상관없음',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
];
export const universities = ['연세대학교', '고려대학교', '서강대학교', '한양대학교', '이화여자대학교', '홍익대학교'];

export const homeFeaturedStores: Store[] = [
  {
    id: uuid(),
    name: '청춘 연어 신촌점',
    category: '술집',
    rating: 4.8,
    reviewCount: 120,
    maxCapacity: 40,
    pricePerPerson: 15000,
    acceptanceRate: 96,
    location: '신촌',
    imageName: 'restaurant-outline',
    keywords: ['최대 40석', '단체 환영'],
    isFavorite: false,
  },
  {
    id: uuid(),
    name: '스페이스 아지트',
    category: '파티룸',
    rating: 4.9,
    reviewCount: 85,
    maxCapacity: 60,
    pricePerPerson: 20000,
    acceptanceRate: 92,
    location: '신촌',
    imageName: 'sparkles-outline',
    keywords: ['파티룸', '조용한 분위기'],
    isFavorite: true,
  },
];

// 이 데모에서 로그인하는 점주의 매장. 예약자가 검색 결과에서 이 매장을 선택해 예약을
// 신청하면 점주 대시보드(OwnerDashboardScreen)에 실시간으로 표시됨.
export const ownerStore: Store = {
  id: 'store-owner-1',
  name: '캠퍼스 포차',
  category: '요리주점/포차',
  rating: 4.6,
  reviewCount: 42,
  maxCapacity: 45,
  pricePerPerson: 18000,
  acceptanceRate: 94,
  location: '홍대',
  imageName: 'beer-outline',
  keywords: ['단체 환영', '홍대입구역 도보 3분'],
  isFavorite: false,
};

export const searchResults: Store[] = [
  ownerStore,
  {
    id: uuid(),
    name: '수지상회 신촌점',
    category: '요리주점 / 오마카세',
    rating: 4.9,
    reviewCount: 124,
    maxCapacity: 30,
    pricePerPerson: 25000,
    acceptanceRate: 98,
    location: '신촌',
    imageName: 'wine-outline',
    keywords: ['단체 50명', '코스 메뉴'],
    isFavorite: false,
  },
  {
    id: uuid(),
    name: '구이마을 2호점',
    category: '고기집 / 무한리필',
    rating: 4.7,
    reviewCount: 88,
    maxCapacity: 50,
    pricePerPerson: 30000,
    acceptanceRate: 95,
    location: '신촌',
    imageName: 'flame-outline',
    keywords: ['단체석 완비', '신촌역 도보 5분'],
    isFavorite: false,
  },
  {
    id: uuid(),
    name: '신촌 현명포차',
    category: '요리주점 / 한중일양식',
    rating: 4.8,
    reviewCount: 60,
    maxCapacity: 80,
    pricePerPerson: 25000,
    acceptanceRate: 90,
    location: '신촌',
    imageName: 'musical-notes-outline',
    keywords: ['DJ 부킹', '스테이지'],
    isFavorite: false,
  },
];

export const favorites: Store[] = [
  {
    id: uuid(),
    name: '미도리 가든 신촌점',
    category: '일식',
    rating: 4.9,
    reviewCount: 200,
    maxCapacity: 25,
    pricePerPerson: 28000,
    acceptanceRate: 97,
    location: '신촌',
    imageName: 'leaf-outline',
    keywords: ['최대 25석'],
    isFavorite: true,
  },
  {
    id: uuid(),
    name: '더 링크 다이닝',
    category: '이태리',
    rating: 4.7,
    reviewCount: 150,
    maxCapacity: 50,
    pricePerPerson: 35000,
    acceptanceRate: 93,
    location: '신촌',
    imageName: 'restaurant-outline',
    keywords: ['최대 50석'],
    isFavorite: true,
  },
];

export const activeReservations: MyReservation[] = [
  {
    id: uuid(),
    storeName: '이자카야 모리',
    imageSymbol: 'wine-outline',
    status: 'confirmed',
    dateLabel: '5/25 (일) 19:00',
    people: 18,
    budget: 25000,
    dateValue: dayOffset(1, 19),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '구이구이 정육식당',
    imageSymbol: 'flame-outline',
    status: 'pending',
    dateLabel: '5/27 (화) 18:30',
    people: 24,
    dateValue: dayOffset(3, 18, 30),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
];

export const pastReservations: MyReservation[] = [
  {
    id: uuid(),
    storeName: '맥주창고 강남점',
    imageSymbol: 'beer-outline',
    status: 'completed',
    dateLabel: '5/10 (금) 방문',
    people: 0,
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '카페 드 로스터리',
    imageSymbol: 'cafe-outline',
    status: 'completed',
    dateLabel: '4/28 (일) 방문',
    people: 0,
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
];

// 예약자가 ownerStore(캠퍼스 포차)에 신청해 확정된 예약. 점주 쪽 화면에서도
// storeId로 동일 예약을 찾아 보여주기 때문에 채팅 데모의 기준 예약으로 사용됨.
const chatDemoReservationId = uuid();

export const allReservations: MyReservation[] = [
  {
    id: chatDemoReservationId,
    storeId: ownerStore.id,
    storeName: ownerStore.name,
    imageSymbol: ownerStore.imageName,
    status: 'confirmed',
    dateLabel: '6/3 (화) 19:00',
    people: 20,
    budget: 10000,
    dateValue: dayOffset(5, 19),
    bookerName: '윤태웅',
    bookerAffiliation: '연세대 인공지능학과 회장',
    timeLabels: [],
    eventPurpose: '엠티 뒤풀이',
    requestMessage: '스크린 있는 방 있을까요?',
  },
  {
    id: uuid(),
    storeName: '이자카야 모리',
    imageSymbol: 'wine-outline',
    status: 'confirmed',
    dateLabel: '5/25 (일) 19:00',
    people: 18,
    budget: 25000,
    dateValue: dayOffset(1, 19),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '구이구이 정육식당',
    imageSymbol: 'flame-outline',
    status: 'pending',
    dateLabel: '5/27 (화) 18:30',
    people: 24,
    dateValue: dayOffset(3, 18, 30),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '스페이스 아지트',
    imageSymbol: 'sparkles-outline',
    status: 'pending',
    dateLabel: '6/1 (일) 20:00',
    people: 15,
    budget: 20000,
    dateValue: dayOffset(8, 20),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '맥주창고 강남점',
    imageSymbol: 'beer-outline',
    status: 'completed',
    dateLabel: '5/10 (금) 19:00',
    people: 12,
    budget: 18000,
    dateValue: dayOffset(-14, 19),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '카페 드 로스터리',
    imageSymbol: 'cafe-outline',
    status: 'completed',
    dateLabel: '4/28 (일) 18:00',
    people: 8,
    budget: 15000,
    dateValue: dayOffset(-26, 18),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '수지상회 신촌점',
    imageSymbol: 'wine-outline',
    status: 'cancelled',
    dateLabel: '5/15 (수) 19:00',
    people: 10,
    budget: 25000,
    dateValue: dayOffset(-9, 19),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
  {
    id: uuid(),
    storeName: '신촌 현명포차',
    imageSymbol: 'musical-notes-outline',
    status: 'rejected',
    dateLabel: '5/12 (월) 20:00',
    people: 20,
    dateValue: dayOffset(-12, 20),
    timeLabels: [],
    eventPurpose: '',
    requestMessage: '',
  },
];

// 예약금 입금 계좌 공유 및 송금 확인용 채팅 데모 데이터
export const initialChatMessages: ChatMessage[] = [
  {
    id: uuid(),
    reservationId: chatDemoReservationId,
    senderRole: 'owner',
    text: '안녕하세요! 예약 확정되었습니다. 예약금 10,000원 입금 부탁드려요.',
    timeLabel: '오후 2:01',
  },
  {
    id: uuid(),
    reservationId: chatDemoReservationId,
    senderRole: 'owner',
    text: '계좌번호: 국민은행 123456-78-901234 (예금주 오효준)',
    timeLabel: '오후 2:01',
  },
  {
    id: uuid(),
    reservationId: chatDemoReservationId,
    senderRole: 'booker',
    text: '넵 확인했습니다! 잠시 후 입금할게요.',
    timeLabel: '오후 2:05',
  },
];

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
