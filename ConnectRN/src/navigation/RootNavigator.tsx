import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAppState } from '../state/AppState';
import { registerForPushNotifications } from '../notifications';
import { navigationRef } from './navigationRef';
import OnboardingFlow from './OnboardingFlow';
import BookerTabNavigator from './BookerTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';

export default function RootNavigator() {
  const { route, selectedRole, bookerId, ownerId } = useAppState();

  useEffect(() => {
    if (selectedRole === 'booker' && bookerId) {
      registerForPushNotifications(bookerId, 'booker');
    } else if (selectedRole === 'owner' && ownerId) {
      registerForPushNotifications(ownerId, 'owner');
    }
  }, [selectedRole, bookerId, ownerId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string } | undefined;
      if (!navigationRef.isReady()) return;
      if (data?.type === 'reservation_confirmed') {
        navigationRef.navigate('MyReservationsTab' as never);
      } else if (data?.type === 'reservation_request') {
        navigationRef.navigate('DashboardTab' as never);
      }
    });
    return () => subscription.remove();
  }, []);

  switch (route) {
    case 'bookerTabs':
      return <BookerTabNavigator />;
    case 'ownerTabs':
      return <OwnerTabNavigator />;
    default:
      return <OnboardingFlow />;
  }
}
