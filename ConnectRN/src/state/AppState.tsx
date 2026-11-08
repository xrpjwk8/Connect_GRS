import { unregisterPush } from '../services/pushNotifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as NativeAppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import type { ChatMessage, MyReservation, SearchFilter, Store, UserRole } from '../models/types';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { developmentPreview, previewStore, previewRestriction } from '../lib/developmentPreview';
import { errorMessage, rpc } from '../services/backend';
import { mapReservation, mapStore, minuteLabel, type ProfileRow, type StoreRow } from '../utils/reservation';
import { showAlert } from '../utils/alert';
import { getTypography, type AppRole, type OwnerFontScale } from '../theme/typography';
import { type StudentVerification, studentRestriction } from '../utils/studentVerification';

export type Route = 'onboarding' | 'bookerTabs' | 'ownerTabs';
export type OnboardingDestination = 'bookerSignUp' | 'ownerSignUp' | 'bookerLogin' | 'ownerLogin';

function useStateValue() {
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const isPreview = __DEV__ && previewRole !== null;
  // Fast Refresh may retain React state while reloading the transport module.
  if (isPreview && !developmentPreview.active) developmentPreview.enter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const sessionRef = useRef<Session | null>(null);
  const generation = useRef(0);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [studentVerification, setStudentVerification] = useState<StudentVerification | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [studentVerificationOnEntry, setStudentVerificationOnEntry] = useState(false);
  const [ownerStoreRow, setOwnerStoreRow] = useState<StoreRow | null>(null);
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
  const [myReservations, setMyReservations] = useState<MyReservation[]>([]);
  const [blockedSlotsByDate, setBlockedSlotsByDate] = useState<Record<string, string[]>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [favorites, setFavorites] = useState<Store[]>([]);
  const [storePhotoWideUri, setStorePhotoWideUri] = useState<string | null>(null);
  const [storePhotoSquareUri, setStorePhotoSquareUri] = useState<string | null>(null);
  const [storeNaverMapUrl, setStoreNaverMapUrl] = useState<string | null>(null);
  const [storeKakaoMapUrl, setStoreKakaoMapUrl] = useState<string | null>(null);
  const [selectedBookerTab, setSelectedBookerTab] = useState(0);
  const [ownerFontScale, setOwnerFontScale] = useState<OwnerFontScale>('normal');

  const clearAccount = useCallback(() => {
    setStudentVerificationOnEntry(false);
    setStudentVerification(null); setIsAdmin(false); setAdminPanelOpen(false);
    setChatMessages([]); setProfile(null); setOwnerStoreRow(null); setMyReservations([]); setFavorites([]);
    setBlockedSlotsByDate({}); setSchoolName(''); setDepartmentName(''); setPosition('');
    setRealName(''); setSchoolEmail(''); setPhoneNumber(''); setProfileImageUri(null);
    setStorePhotoWideUri(null); setStorePhotoSquareUri(null); setStoreNaverMapUrl(null); setStoreKakaoMapUrl(null);
    setLastSearchFilter(null); setSelectedSearchDate(null); setSelectedBookerTab(0); setOwnerFontScale('normal');
  }, []);

  const refresh = useCallback(async () => {
    if (developmentPreview.active) { setReady(true); setRefreshing(false); return; }
    const current = sessionRef.current;
    const run = ++generation.current;
    if (!current) { clearAccount(); setReady(true); setRefreshing(false); return; }
    setRefreshing(true); setLoadError(null);
    try {
      const { data: admin, error: adminError } = await supabase.rpc('accept_admin_invitation');
      if (adminError) throw adminError;
      const { data: p, error: pe } = await supabase.from('profiles').select('*').eq('id', current.user.id).maybeSingle();
      if (pe) throw pe;
      const [stores, reservations, blocks, favoriteRows, verification, messages] = await Promise.all([
        supabase.from('stores').select('*').eq('owner_id', current.user.id).order('created_at').limit(1),
        supabase.from('reservations').select('*, stores(name)').order('starts_at', { ascending: false }),
        supabase.from('time_blocks').select('*'),
        supabase.from('favorites').select('stores(*)').eq('user_id', current.user.id),
        supabase.from('student_verifications').select('*').eq('user_id', current.user.id).maybeSingle(),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      for (const response of [stores, reservations, blocks, favoriteRows, verification, messages]) if (response.error) throw response.error;
      if (generation.current !== run || sessionRef.current?.user.id !== current.user.id) return;
      setChatMessages((messages.data ?? []).reverse().map(m => ({ id: m.id, reservationId: m.reservation_id, senderRole: m.sender_role as UserRole, text: m.body, timeLabel: new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) })));
      setProfile(p); setOwnerStoreRow(stores.data?.[0] ?? null);
      setIsAdmin(admin === true); setStudentVerification(verification.data);
      setMyReservations((reservations.data ?? []).map(r => mapReservation(r, r.stores?.name ?? '매장')));
      const blocked: Record<string, string[]> = {};
      for (const b of blocks.data ?? []) {
        if (b.store_id !== stores.data?.[0]?.id) continue;
        const date = b.service_date.split('-').map(Number).join('-');
        (blocked[date] ??= []).push(minuteLabel(b.start_minute));
      }
      setBlockedSlotsByDate(blocked);
      setFavorites((favoriteRows.data ?? []).flatMap(f => f.stores ? [{ ...mapStore(f.stores), isFavorite: true }] : []));
      if (p) {
        setSelectedRole(p.role as UserRole); setSchoolName(p.school_name); setDepartmentName(p.department_name);
        setPosition(p.position); setRealName(p.real_name);
      }
      setSchoolEmail(current.user.email ?? ''); setPhoneNumber(current.user.phone ?? '');
    } catch (error) {
      if (generation.current === run) setLoadError(errorMessage(error));
      throw error;
    } finally {
      if (generation.current === run) { setRefreshing(false); setReady(true); }
    }
  }, [clearAccount]);

  useEffect(() => {
    if (!supabaseConfigured) { setLoadError('Supabase 연결 설정이 없습니다. .env.local을 확인해주세요.'); setReady(true); return; }
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      const changed = sessionRef.current?.user.id !== next?.user.id;
      sessionRef.current = next;
      if (developmentPreview.active) { setSession(next); return; }
      if (changed) { ++generation.current; clearAccount(); setReady(false); }
      if (!next) { setOnboardingPath([]); setSelectedRole(null); }
      setSession(next);
    });
    supabase.auth.getSession().then(({ error }) => {
      if (error) { setLoadError(errorMessage(error)); setReady(true); }
    }).catch(error => { setLoadError(errorMessage(error)); setReady(true); });
    const subscription = NativeAppState.addEventListener('change', state => {
      if (state === 'active') {
        if (developmentPreview.active) return;
        if (Platform.OS !== 'web') supabase.auth.startAutoRefresh();
        if (sessionRef.current) void refresh().catch(() => {});
      } else if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    });
    if (Platform.OS !== 'web') supabase.auth.startAutoRefresh();
    return () => { ++generation.current; data.subscription.unsubscribe(); subscription.remove(); supabase.auth.stopAutoRefresh(); };
  }, [clearAccount, refresh]);

  const userId = session?.user.id;
  useEffect(() => {
    if (session === undefined || !supabaseConfigured) return;
    void refresh().catch(() => {});
    // Token refreshes keep the same account; don't erase edits or refetch every token event.
  }, [userId, session === undefined, refresh]);

  useEffect(() => {
    if (!userId || isPreview) return;
    const channel = supabase.channel(`account-events:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => { void refresh().catch(() => {}); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => { void refresh().catch(() => {}); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, isPreview, refresh]);

  const logout = useCallback(async () => {
    if (developmentPreview.active) {
      developmentPreview.exit(); setPreviewRole(null); clearAccount();
      setSelectedRole(null); setOnboardingPath([]); setLoadError(null);
      if (Platform.OS !== 'web') supabase.auth.startAutoRefresh();
      await refresh().catch(() => {});
      return;
    }
    try { await unregisterPush(); } catch (error) { showAlert('로그아웃 실패', '기기 알림 연결을 해제하지 못했습니다. 인터넷 연결 후 다시 시도해주세요.'); return; }
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) { showAlert('로그아웃 실패', errorMessage(error)); return; }
    ++generation.current; sessionRef.current = null; setSession(null); clearAccount();
    setSelectedRole(null); setOnboardingPath([]); setLoadError(null); setReady(true);
  }, [clearAccount, refresh]);
  const enterPreview = (role: UserRole, draft: { name: string; school: string; department: string; position: string; email: string }) => {
    developmentPreview.enter();
    ++generation.current; supabase.auth.stopAutoRefresh(); clearAccount();
    setPreviewRole(role); setSelectedRole(role); setOnboardingPath([]);
    setRealName(draft.name.trim()); setSchoolName(draft.school.trim());
    setDepartmentName(draft.department.trim()); setPosition(draft.position.trim()); setSchoolEmail(draft.email.trim());
    if (role === 'owner') setOwnerStoreRow(previewStore);
    setLoadError(null); setRefreshing(false); setReady(true);
  };
  const navigateAuth = (role: UserRole, destination: OnboardingDestination) => {
    setSelectedRole(role); setOnboardingPath([destination]);
  };
  const ownerStore = useMemo(() => ownerStoreRow ? mapStore(ownerStoreRow) : null, [ownerStoreRow]);
  const route: Route = isPreview ? (previewRole === 'owner' ? 'ownerTabs' : 'bookerTabs')
    : !session || !profile ? 'onboarding' : profile.role === 'owner' ? 'ownerTabs' : 'bookerTabs';
  return {
    route, session: isPreview ? null : session, profile, ready, refreshing, loadError, refresh, ownerStore, ownerStoreRow, favorites,
    isPreview, enterPreview, studentVerification, isAdmin, adminPanelOpen, setAdminPanelOpen,
    studentVerificationOnEntry, setStudentVerificationOnEntry,
    canBook: !isPreview && profile?.role === 'booker' && studentVerification?.status === 'approved',
    onboardingPath, selectedRole, schoolName, setSchoolName, departmentName, setDepartmentName,
    position, setPosition, realName, setRealName, schoolEmail, setSchoolEmail, phoneNumber, setPhoneNumber,
    profileImageUri, setProfileImageUri, selectedSearchDate, setSelectedSearchDate, lastSearchFilter, setLastSearchFilter,
    myReservations, blockedSlotsByDate,
    capacityOverbookingEnabled: ownerStoreRow?.allow_shared ?? true,
    storePhotoWideUri, setStorePhotoWideUri, storePhotoSquareUri, setStorePhotoSquareUri,
    storeNaverMapUrl, setStoreNaverMapUrl, storeKakaoMapUrl, setStoreKakaoMapUrl,
    selectedBookerTab, setSelectedBookerTab, ownerFontScale, setOwnerFontScale,
    chatMessages,
    goToBookerSignUp: () => navigateAuth('booker', 'bookerSignUp'),
    goToOwnerSignUp: () => navigateAuth('owner', 'ownerSignUp'),
    goToBookerLogin: () => navigateAuth('booker', 'bookerLogin'),
    goToOwnerLogin: () => navigateAuth('owner', 'ownerLogin'),
    cancelSignUp: () => setOnboardingPath([]), logout,
    saveProfile: async (name: string, school: string, department: string, job: string) => {
      if (!profile) throw new Error('로그인이 필요합니다.');
      await rpc('complete_profile', { p_role: profile.role, p_real_name: name, p_school_name: school,
        p_department_name: department, p_position: job });
    },
  };
}
const AppStateContext = createContext<ReturnType<typeof useStateValue> | null>(null);
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const value = useStateValue();
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used within AppStateProvider');
  return value;
}
export function useTypography(role: AppRole): Record<string, import('react-native').TextStyle> {
  const { ownerFontScale } = useAppState();
  return useMemo(() => getTypography(role, ownerFontScale), [role, ownerFontScale]);
}
