export type TransferStatus = 'active' | 'completed' | 'withdrawn' | 'cancelled' | 'expired';
export interface ReservationTransfer {
  id: string; store_id: string; store_name: string; region: string;
  service_date: string; start_minute: number; slot_count: number;
  starts_at: string; ends_at: string; people: number; terms: string;
  created_at: string; completed_at: string | null; status: TransferStatus;
  is_mine: boolean; is_recipient: boolean; is_owner: boolean;
  memo?: string;
  reservation_id?: string; from_name?: string; from_affiliation?: string;
  to_name?: string; to_affiliation?: string;
}
export interface TransferFilter { date?: string; minute?: number; people?: number; region?: string }
export const transferLabels: Record<TransferStatus, string> = {
  active: '양도 가능', completed: '양도 완료', withdrawn: '양도 철회', cancelled: '예약 종료', expired: '기한 만료',
};
export function transferStatus(t: ReservationTransfer, now = Date.now()): TransferStatus {
  return t.status === 'active' && Date.parse(t.starts_at) <= now ? 'expired' : t.status;
}
