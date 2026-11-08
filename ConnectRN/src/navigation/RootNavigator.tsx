import NotificationInboxScreen from '../screens/Notifications/NotificationInboxScreen';
import NotificationReservationScreen from '../screens/Notifications/NotificationReservationScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import React, { useEffect, useMemo, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoleSelectionScreen from '../screens/Root/RoleSelectionScreen';
import { createRemovalObserver } from './removedRoute';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostButton } from '../components/Buttons';
import StoreRegistrationScreen from '../screens/Owner/StoreRegistrationScreen';
import { useAppState } from '../state/AppState';
import OnboardingFlow from './OnboardingFlow';
import BookerTabNavigator from './BookerTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';
import StudentReviewScreen from '../screens/Admin/StudentReviewScreen';

const Stack = createNativeStackNavigator();
export default function RootNavigator() {
  const app = useAppState();
  const latest = useRef(app); latest.current = app;
  const state = useMemo(() => createRemovalObserver('AdminReview', () => {
    const current = latest.current;
    if (current.profile) current.setAdminPanelOpen(false);
    else void current.logout();
  }), []);
  return <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: false }} screenListeners={{ state }}>
    <Stack.Screen name="Main" component={Main} />
    {app.session && app.profile && !app.isPreview && <>
      <Stack.Screen name="NotificationInbox" component={NotificationInboxScreen} />
      <Stack.Screen name="NotificationReservation" component={NotificationReservationScreen} />
      <Stack.Screen name="NotificationChat" component={ChatScreen} />
    </>}
    <Stack.Screen name="AdminReview" component={StudentReviewScreen} />
  </Stack.Navigator>;
}
function Main({ navigation }: any) {
  const { route, ready, profile, ownerStore, loadError, refresh, logout, isPreview, selectedRole, isAdmin, adminPanelOpen, onboardingPath } = useAppState();
  const showAdmin = ready && !isPreview && isAdmin && (adminPanelOpen || !profile);
  useEffect(() => { if (showAdmin) navigation.navigate('AdminReview'); }, [showAdmin, navigation]);
  if (isPreview) return <View style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>{selectedRole === 'owner' ? <OwnerTabNavigator /> : <BookerTabNavigator />}</View>
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#e8f1d1' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ flex: 1, fontSize: 12 }}>테스트 미리보기 · {selectedRole === 'booker' ? '학생증 미인증 · ' : ''}실제 예약·채팅 불가</Text>
        <Pressable accessibilityRole="button" onPress={logout} hitSlop={8}><Text style={{ fontWeight: '700' }}>나가기</Text></Pressable>
      </View>
    </SafeAreaView>
  </View>;
  // Keep the active form mounted while the newly authenticated account loads.
  // Replacing it with a spinner would discard the name/school and auth step.
  if (!ready) return onboardingPath.length ? <OnboardingFlow /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /><Text>계정을 확인하고 있습니다…</Text></View>;
  if (showAdmin && !profile) return <RoleSelectionScreen />;
  if (loadError && !profile) return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
    <Text accessibilityRole="alert">{loadError}</Text><GhostButton title="다시 연결" onPress={() => void refresh().catch(() => {})} />
    <GhostButton title="로그아웃" onPress={logout} /></View>;
  if (route === 'ownerTabs' && !ownerStore) return <StoreRegistrationScreen />;

  switch (route) {
    case 'bookerTabs':
      return <BookerTabNavigator />;
    case 'ownerTabs':
      return <OwnerTabNavigator />;
    default:
      return <OnboardingFlow />;
  }
}
