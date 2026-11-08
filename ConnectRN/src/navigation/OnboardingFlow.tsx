import React, { useEffect, useMemo, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppState } from '../state/AppState';
import RoleSelectionScreen from '../screens/Root/RoleSelectionScreen';
import AccountAccess from '../components/AccountAccess';
import { createRemovalObserver } from './removedRoute';

const Stack = createNativeStackNavigator();
function Start({ navigation }: any) {
  const { onboardingPath } = useAppState();
  const destination = onboardingPath[onboardingPath.length - 1];
  useEffect(() => {
    if (destination) navigation.navigate('Account', { destination });
  }, [destination, navigation]);
  return <RoleSelectionScreen />;
}
function Account({ route }: any) {
  const destination: string = route.params.destination;
  return <AccountAccess role={destination.startsWith('owner') ? 'owner' : 'booker'} signup={destination.endsWith('SignUp')} />;
}
export default function OnboardingFlow() {
  const { cancelSignUp } = useAppState();
  const latest = useRef(cancelSignUp); latest.current = cancelSignUp;
  const state = useMemo(() => createRemovalObserver('Account', () => latest.current()), []);
  return <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, fullScreenGestureEnabled: false }} screenListeners={{ state }}>
    <Stack.Screen name="RoleSelection" component={Start} />
    <Stack.Screen name="Account" component={Account} />
  </Stack.Navigator>;
}
