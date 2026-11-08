import { supabase } from '../lib/supabase';
import { rpc } from './backend';
import { developmentPreview, previewRestriction } from '../lib/developmentPreview';
import type { Database } from '../models/database.types';
export type MessageRow = Database['public']['Tables']['chat_messages']['Row'];
export async function fetchChat(reservationId: string, before?: MessageRow, epoch = 0) {
  if (developmentPreview.active) return [];
  let query = supabase.from('chat_messages').select('*').eq('reservation_id', reservationId).eq('chat_epoch', epoch)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(50);
  if (before) query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function sendMessage(reservationId: string, body: string, requestId: string, epoch = 0) {
  if (developmentPreview.active) throw new Error(previewRestriction);
  return rpc('send_chat_message_epoch', { p_reservation_id: reservationId, p_body: body, p_request_id: requestId, p_epoch: epoch });
}
