import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerDevice } from './api/devices';
import type { UserRole } from './models/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Expo managed 앱(iOS/Android 공통)이라 Expo Push Token 하나로 양쪽 플랫폼을 다 커버함.
// EAS project id가 없으면(=아직 `eas init`을 안 돌린 상태) 토큰 발급이 안 되니 조용히 스킵.
export async function registerForPushNotifications(userId: string, role: UserRole): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (!Device.isDevice) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('EAS project id가 설정되지 않아 푸시 토큰을 발급받을 수 없어요. `npx eas init`을 실행해주세요.');
    return;
  }

  try {
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerDevice(userId, role, expoPushToken);
  } catch (e) {
    console.warn('Failed to register push token', e);
  }
}
