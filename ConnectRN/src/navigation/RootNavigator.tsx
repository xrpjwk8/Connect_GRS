import React from 'react';
import { useAppState } from '../state/AppState';
import OnboardingFlow from './OnboardingFlow';
import BookerTabNavigator from './BookerTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';

export default function RootNavigator() {
  const { route } = useAppState();

  switch (route) {
    case 'bookerTabs':
      return <BookerTabNavigator />;
    case 'ownerTabs':
      return <OwnerTabNavigator />;
    default:
      return <OnboardingFlow />;
  }
}
