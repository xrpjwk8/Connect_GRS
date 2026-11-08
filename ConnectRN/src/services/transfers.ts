import { transferMemoError } from '../utils/transferMemo';
import { supabase } from '../lib/supabase';
import { rpc } from './backend';
import { developmentPreview, previewRestriction } from '../lib/developmentPreview';
import type { ReservationTransfer, TransferFilter } from '../models/transfers';

function previewTransfers(): ReservationTransfer[] {
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(Date.now() + 9 * 3600000 + (i + 2) * 86400000).toISOString().slice(0, 10);
    return { id: `preview-transfer-${i}`, store_id: `preview-store-${i}`, store_name: ['캠퍼스 포차', '모임식당', '연희 다이닝', '신촌 한상', '우리 모임'][i],
      region: '서울 신촌', service_date: date, start_minute: 1080 + i * 30, slot_count: 4,
      starts_at: `${date}T${18 + Math.floor(i / 2)}:${i % 2 ? '30' : '00'}:00+09:00`, ends_at: `${date}T${20 + Math.floor(i / 2)}:${i % 2 ? '30' : '00'}:00+09:00`,
      people: [30, 20, 25, 40, 15][i], terms: '테스트 예시입니다. 예약된 일시·인원을 그대로 승계하며 추가 합의 조건은 없습니다.',
      created_at: new Date(Date.now() - i * 60000).toISOString(), completed_at: null, status: 'active',
      is_mine: false, is_recipient: false, is_owner: false };
  });
}
export async function listTransfers(filter: TransferFilter = {}, limit = 20, before?: ReservationTransfer): Promise<ReservationTransfer[]> {
  if (developmentPreview.active) return previewTransfers().filter(t => (!filter.date || t.service_date === filter.date)
    && (filter.minute === undefined || t.start_minute === filter.minute) && (!filter.people || t.people === filter.people)
    && (!filter.region || t.region.includes(filter.region)) && (!before || t.id > before.id)).slice(0, limit);
  return await rpc('list_transfers', { p_date: filter.date, p_minute: filter.minute, p_people: filter.people,
    p_region: filter.region, p_limit: limit, p_before_time: before?.created_at, p_before_id: before?.id }) as unknown as ReservationTransfer[];
}
export async function getTransfer(id: string): Promise<ReservationTransfer> {
  if (developmentPreview.active) {
    const row = previewTransfers().find(t => t.id === id);
    if (!row) throw new Error('양도를 찾을 수 없습니다.');
    return row;
  }
  return await rpc('get_transfer', { p_id: id }) as unknown as ReservationTransfer;
}
export async function myTransfers(): Promise<ReservationTransfer[]> {
  if (developmentPreview.active) return [];
  const { data, error } = await supabase.rpc('my_transfers');
  if (error) throw error;
  return data as unknown as ReservationTransfer[];
}
export async function createTransfer(reservationId: string, terms: string, noDeposit: boolean, memo = '') {
  if (developmentPreview.active) throw new Error(previewRestriction);
  const error = transferMemoError(memo);
  if (error) throw new Error(error);
  return rpc('create_transfer', { p_reservation_id: reservationId, p_terms: terms, p_no_deposit: noDeposit, p_memo: memo });
}
export async function withdrawTransfer(id: string) {
  if (developmentPreview.active) throw new Error(previewRestriction);
  return rpc('withdraw_transfer', { p_id: id });
}
export async function claimTransfer(id: string, requestId: string) {
  if (developmentPreview.active) throw new Error(previewRestriction);
  return rpc('claim_transfer', { p_id: id, p_request_id: requestId, p_accept_terms: true });
}
