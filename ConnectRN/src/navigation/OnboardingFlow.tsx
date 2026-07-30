import React from 'react';
import { useAppState } from '../state/AppState';
import RoleSelectionScreen from '../screens/Root/RoleSelectionScreen';
import BookerSignUpScreen from '../screens/Booker/BookerSignUpScreen';
import OwnerSignUpScreen from '../screens/Owner/OwnerSignUpScreen';
import BookerLoginScreen from '../screens/Booker/BookerLoginScreen';
import OwnerLoginScreen from '../screens/Owner/OwnerLoginScreen';

export default function OnboardingFlow() {
  const { onboardingPath } = useAppState();
  const destination = onboardingPath[onboardingPath.length - 1];

  if (destination === 'bookerSignUp') return <BookerSignUpScreen />;
  if (destination === 'ownerSignUp') return <OwnerSignUpScreen />;
  if (destination === 'bookerLogin') return <BookerLoginScreen />;
  if (destination === 'ownerLogin') return <OwnerLoginScreen />;
  return <RoleSelectionScreen />;
}
