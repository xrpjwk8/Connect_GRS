import { supabase } from '../lib/supabase';
import { rpc } from './backend';
import { developmentPreview } from '../lib/developmentPreview';
import { navigationRef } from '../navigation/navigationRef';

export async function openNotification(id: string, userId: string) {
  if (developmentPreview.active || !navigationRef.isReady() || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  const { data, error } = await supabase.from('notifications').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const session = await supabase.auth.getSession();
  if (session.data.session?.user.id !== userId || developmentPreview.active) return false;
  await rpc('mark_notification_read', { p_id: id });
  navigationRef.navigate(data.kind === 'chat_message' ? 'NotificationChat' : 'NotificationReservation', { reservationId: data.reservation_id });
  return true;
}
