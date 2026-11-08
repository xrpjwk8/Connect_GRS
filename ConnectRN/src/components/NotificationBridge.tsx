import { navigationRef } from '../navigation/navigationRef';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useAppState } from '../state/AppState';
import { registerPush } from '../services/pushNotifications';
import { openNotification } from '../services/notifications';

export default function NotificationBridge({ navigationReady }: { navigationReady: boolean }) {
  const app = useAppState(); const latest = useRef(app); latest.current = app;
  const pending = useRef<string | null>(null); const opening = useRef(false);
  const drain = async () => {
    const current = latest.current;
    if (opening.current || !navigationReady || !current.ready || !current.profile || !current.session || current.isPreview || !pending.current) return;
    const id = pending.current; opening.current = true;
    try {
      await openNotification(id, current.session.user.id);
      if (pending.current === id) pending.current = null;
      if (Platform.OS !== 'web') {
        const Notifications = await import('expo-notifications');
        await Notifications.clearLastNotificationResponseAsync();
      }
    } catch { /* Keep a transiently unavailable notification for the next foreground. */ }
    finally { opening.current = false; }
  };
  const drainRef = useRef(drain); drainRef.current = drain;
  useEffect(() => { void drainRef.current(); }, [app.ready, app.session?.user.id, app.profile?.id, app.isPreview, navigationReady]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let disposed = false; const subscriptions: { remove(): void }[] = [];
    void import('expo-notifications').then(async Notifications => {
      if (disposed) return;
      Notifications.setNotificationHandler({ handleNotification: async notification => {
        const current = latest.current;
        const own = !!current.session && !current.isPreview && notification.request.content.data?.userId === current.session.user.id;
        const route = navigationRef.getCurrentRoute();
        const sameChat = ['Chat', 'NotificationChat'].includes(route?.name ?? '') && (route?.params as { reservationId?: string } | undefined)?.reservationId === notification.request.content.data?.reservationId;
        return { shouldShowBanner: own && !sameChat, shouldShowList: own, shouldPlaySound: own && !sameChat, shouldSetBadge: false };
      } });
      const receive = (response: import('expo-notifications').NotificationResponse | null) => {
        const id = response?.notification.request.content.data?.notificationId;
        if (typeof id === 'string') { pending.current = id; void drainRef.current(); }
      };
      subscriptions.push(Notifications.addNotificationResponseReceivedListener(receive));
      subscriptions.push(Notifications.addPushTokenListener(() => {
        const current = latest.current;
        if (current.session && current.profile && !current.isPreview) void registerPush(current.session.user.id).catch(() => {});
      }));
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!disposed) receive(response);
    }).catch(() => { /* Old native builds still open; the inbox explains setup failures on request. */ });
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') void drainRef.current(); });
    return () => { disposed = true; subscriptions.forEach(s => s.remove()); foreground.remove(); };
  }, []);
  useEffect(() => {
    const userId = app.session?.user.id;
    if (!userId || !app.profile || app.isPreview || !app.ready) return;
    const register = () => { void registerPush(userId).catch(() => {}); };
    register();
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') register(); });
    return () => foreground.remove();
  }, [app.session?.user.id, app.profile?.id, app.isPreview, app.ready]);
  return null;
}
