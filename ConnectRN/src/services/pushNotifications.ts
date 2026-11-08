import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { developmentPreview } from '../lib/developmentPreview';
import { rpc } from './backend';

const DEVICE_KEY = 'connect.push-installation';
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {
  const task = queue.then(work, work); queue = task.catch(() => {}); return task;
}
async function installationId() {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) { id = randomUUID(); await AsyncStorage.setItem(DEVICE_KEY, id); }
  return id;
}
export function registerPush(userId: string, requestPermission = false) {
  return serial(async () => {
    if (Platform.OS === 'web' || developmentPreview.active) return '웹에서는 앱 내 알림을 확인할 수 있습니다.';
    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) throw new Error('푸시 프로젝트 설정이 필요합니다. 앱 관리자에게 문의해주세요.');
    const Notifications = await import('expo-notifications');
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('activity', {
      name: '예약·채팅', importance: Notifications.AndroidImportance.HIGH,
    });
    let permission = await Notifications.getPermissionsAsync();
    if (requestPermission && !permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
    const allowed = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    const id = await installationId();
    const current = await supabase.auth.getSession();
    if (current.error) throw current.error;
    if (current.data.session?.user.id !== userId || developmentPreview.active) return '계정이 변경되었습니다.';
    if (!allowed) {
      await rpc('unregister_push_device', { p_device_id: id });
      return '푸시 알림이 꺼져 있습니다. 기기 설정에서 알림을 허용해주세요.';
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const latest = await supabase.auth.getSession();
    if (latest.data.session?.user.id !== userId || developmentPreview.active) return '계정이 변경되었습니다.';
    await rpc('register_push_device', { p_device_id: id, p_token: token, p_platform: Platform.OS });
    return '이 기기의 예약·채팅 푸시 알림이 켜졌습니다.';
  });
}
export function unregisterPush() {
  return serial(async () => {
    if (Platform.OS === 'web' || developmentPreview.active) return;
    const id = await AsyncStorage.getItem(DEVICE_KEY);
    if (id) await rpc('unregister_push_device', { p_device_id: id });
  });
}
