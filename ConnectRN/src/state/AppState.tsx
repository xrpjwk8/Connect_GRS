import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ChatMessage, MyReservation, SearchFilter, UserRole } from '../models/types';
import { allReservations as mockAllReservations, initialChatMessages } from '../models/mockData';

export type Route = 'onboarding' | 'bookerTabs' | 'ownerTabs';
export type OnboardingDestination = 'bookerSignUp' | 'ownerSignUp' | 'bookerLogin' | 'ownerLogin';

interface AppStateValue {
  route: Route;
  onboardingPath: OnboardingDestination[];
  selectedRole: UserRole | null;

  schoolName: string;
  setSchoolName: (v: string) => void;
  departmentName: string;
  setDepartmentName: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  realName: string;
  setRealName: (v: string) => void;
  schoolEmail: string;
  setSchoolEmail: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;

  profileImageUri: string | null;
  setProfileImageUri: (v: string | null) => void;

  selectedSearchDate: Date | null;
  setSelectedSearchDate: (v: Date | null) => void;
  lastSearchFilter: SearchFilter | null;
  setLastSearchFilter: (v: SearchFilter | null) => void;

  myReservations: MyReservation[];
  setMyReservations: (v: MyReservation[]) => void;

  // 예약 건당 채팅 메시지. 예약금 계좌 공유·입금 확인 용도 (실제 송금은 앱 밖에서 진행)
  chatMessages: ChatMessage[];
  sendChatMessage: (reservationId: string, senderRole: UserRole, text: string) => void;

  // 시간대별 잔여 좌석만큼 중복 예약을 받을지 여부 (점주 설정)
  capacityOverbookingEnabled: boolean;
  setCapacityOverbookingEnabled: (v: boolean) => void;

  // 점주가 수동으로 차단한 시간대. key: "YYYY-M-D", value: 차단된 슬롯 시작 시각 목록
  blockedSlotsByDate: Record<string, string[]>;
  setBlockedSlotsByDate: (v: Record<string, string[]>) => void;

  // 점주 매장의 가로형(2:1) 대표 사진. 예약자 검색 결과 카드에 노출됨
  storePhotoWideUri: string | null;
  setStorePhotoWideUri: (v: string | null) => void;

  // 점주 매장의 정사각형(1:1) 사진 (선택 사항). 예약자 "내 예약" 카드 썸네일에 노출됨
  storePhotoSquareUri: string | null;
  setStorePhotoSquareUri: (v: string | null) => void;

  // 점주 매장의 외부 지도 링크. 예약자 "위치 안내" 버튼에서 열림
  storeNaverMapUrl: string | null;
  setStoreNaverMapUrl: (v: string | null) => void;
  storeKakaoMapUrl: string | null;
  setStoreKakaoMapUrl: (v: string | null) => void;

  selectedBookerTab: number;
  setSelectedBookerTab: (v: number) => void;

  goToBookerSignUp: () => void;
  goToOwnerSignUp: () => void;
  goToBookerLogin: () => void;
  goToOwnerLogin: () => void;
  cancelSignUp: () => void;
  finishBookerSignUp: () => void;
  finishOwnerSignUp: () => void;
  logout: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<Route>('onboarding');
  const [onboardingPath, setOnboardingPath] = useState<OnboardingDestination[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const [schoolName, setSchoolName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [position, setPosition] = useState('');
  const [realName, setRealName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const [selectedSearchDate, setSelectedSearchDate] = useState<Date | null>(null);
  const [lastSearchFilter, setLastSearchFilter] = useState<SearchFilter | null>(null);

  const [myReservations, setMyReservations] = useState<MyReservation[]>(mockAllReservations);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);

  const [capacityOverbookingEnabled, setCapacityOverbookingEnabled] = useState(true);
  const [blockedSlotsByDate, setBlockedSlotsByDate] = useState<Record<string, string[]>>({});
  const [storePhotoWideUri, setStorePhotoWideUri] = useState<string | null>(null);
  const [storePhotoSquareUri, setStorePhotoSquareUri] = useState<string | null>(null);
  const [storeNaverMapUrl, setStoreNaverMapUrl] = useState<string | null>(null);
  const [storeKakaoMapUrl, setStoreKakaoMapUrl] = useState<string | null>(null);

  const [selectedBookerTab, setSelectedBookerTab] = useState(0);

  const value = useMemo<AppStateValue>(
    () => ({
      route,
      onboardingPath,
      selectedRole,
      schoolName,
      setSchoolName,
      departmentName,
      setDepartmentName,
      position,
      setPosition,
      realName,
      setRealName,
      schoolEmail,
      setSchoolEmail,
      phoneNumber,
      setPhoneNumber,
      profileImageUri,
      setProfileImageUri,
      selectedSearchDate,
      setSelectedSearchDate,
      lastSearchFilter,
      setLastSearchFilter,
      myReservations,
      setMyReservations,
      chatMessages,
      sendChatMessage: (reservationId: string, senderRole: UserRole, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setChatMessages((prev) => [
          ...prev,
          {
            id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            reservationId,
            senderRole,
            text: trimmed,
            timeLabel: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
          },
        ]);
      },
      capacityOverbookingEnabled,
      setCapacityOverbookingEnabled,
      blockedSlotsByDate,
      setBlockedSlotsByDate,
      storePhotoWideUri,
      setStorePhotoWideUri,
      storePhotoSquareUri,
      setStorePhotoSquareUri,
      storeNaverMapUrl,
      setStoreNaverMapUrl,
      storeKakaoMapUrl,
      setStoreKakaoMapUrl,
      selectedBookerTab,
      setSelectedBookerTab,

      goToBookerSignUp: () => {
        setSelectedRole('booker');
        setOnboardingPath(['bookerSignUp']);
      },
      goToOwnerSignUp: () => {
        setSelectedRole('owner');
        setOnboardingPath(['ownerSignUp']);
      },
      goToBookerLogin: () => {
        setSelectedRole('booker');
        setOnboardingPath(['bookerLogin']);
      },
      goToOwnerLogin: () => {
        setSelectedRole('owner');
        setOnboardingPath(['ownerLogin']);
      },
      cancelSignUp: () => {
        setOnboardingPath([]);
      },
      finishBookerSignUp: () => {
        setRoute('bookerTabs');
        setOnboardingPath([]);
      },
      finishOwnerSignUp: () => {
        setRoute('ownerTabs');
        setOnboardingPath([]);
      },
      logout: () => {
        setSelectedRole(null);
        setRoute('onboarding');
        setOnboardingPath([]);
        setSchoolName('');
        setDepartmentName('');
        setPosition('');
        setRealName('');
        setSchoolEmail('');
        setPhoneNumber('');
        setProfileImageUri(null);
        setSelectedSearchDate(null);
        setLastSearchFilter(null);
        setSelectedBookerTab(0);
      },
    }),
    [
      route,
      onboardingPath,
      selectedRole,
      schoolName,
      departmentName,
      position,
      realName,
      schoolEmail,
      phoneNumber,
      profileImageUri,
      selectedSearchDate,
      lastSearchFilter,
      myReservations,
      chatMessages,
      capacityOverbookingEnabled,
      blockedSlotsByDate,
      storePhotoWideUri,
      storePhotoSquareUri,
      storeNaverMapUrl,
      storeKakaoMapUrl,
      selectedBookerTab,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
