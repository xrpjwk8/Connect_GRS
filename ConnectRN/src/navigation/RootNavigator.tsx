import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostButton } from '../components/Buttons';
import StoreRegistrationScreen from '../screens/Owner/StoreRegistrationScreen';
import { useAppState } from '../state/AppState';
import OnboardingFlow from './OnboardingFlow';
import BookerTabNavigator from './BookerTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';

export default function RootNavigator() {
  const { route, ready, profile, ownerStore, loadError, refresh, logout, isPreview, selectedRole } = useAppState();
  if (isPreview) return <View style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>{selectedRole === 'owner' ? <OwnerTabNavigator /> : <BookerTabNavigator />}</View>
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#e8f1d1' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ flex: 1, fontSize: 12 }}>테스트 미리보기 · {selectedRole === 'booker' ? '학생증 미인증 · ' : ''}실제 예약·채팅 불가</Text>
        <Pressable accessibilityRole="button" onPress={logout} hitSlop={8}><Text style={{ fontWeight: '700' }}>나가기</Text></Pressable>
      </View>
    </SafeAreaView>
  </View>;
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /><Text>계정을 확인하고 있습니다…</Text></View>;
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
