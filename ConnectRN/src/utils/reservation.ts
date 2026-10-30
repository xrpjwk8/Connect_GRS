import type { Database } from '../models/database.types';
import type { MyReservation, Store } from '../models/types';
export type StoreRow = Database['public']['Tables']['stores']['Row'];
export type ReservationRow = Database['public']['Tables']['reservations']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Dates selected in the UI are civil service dates, not UTC instants.
export function serviceDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function minuteLabel(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}
export function timeMinute(label: string): number {
  if (!/^\d{2}:\d{2}$/.test(label)) throw new Error('예약 시간을 확인해주세요.');
  const [hour, minute] = label.split(':').map(Number);
  if (hour > 29 || minute > 59) throw new Error('예약 시간을 확인해주세요.');
  return hour * 60 + minute;
}
export function slotSelection(labels: string[]) {
  const minutes = labels.map(timeMinute).sort((a, b) => a - b);
  if (minutes.length < 1 || minutes.length > 6 || minutes.some((m, i) => m % 30 !== 0 || (i > 0 && m !== minutes[i - 1] + 30))) {
    throw new Error('연속된 30분 단위 시간을 1~6칸 선택해주세요.');
  }
  return { p_start_minute: minutes[0], p_slot_count: minutes.length };
}
export function mapStore(row: StoreRow): Store {
  return { id: row.id, name: row.name, category: row.category, maxCapacity: row.capacity,
    location: row.region, imageName: 'storefront-outline', keywords: [], isFavorite: false,
    rating: 0, reviewCount: 0, pricePerPerson: 0, acceptanceRate: 0,
    approved: row.approved, openingMinute: row.opening_minute, closingMinute: row.closing_minute,
    allowShared: row.allow_shared, description: row.description, metricsAvailable: false };
}
export function mapReservation(row: ReservationRow, storeName: string): MyReservation {
  const [y, m, d] = row.service_date.split('-').map(Number);
  return { id: row.id, storeId: row.store_id, storeName, imageSymbol: 'storefront-outline',
    status: row.status as MyReservation['status'], people: row.people,
    budget: row.budget_per_person ?? undefined, dateValue: new Date(y, m - 1, d),
    startsAt: row.starts_at, endsAt: row.ends_at,
    dateLabel: `${m}/${d} ${minuteLabel(row.start_minute)} ~ ${minuteLabel(row.start_minute + row.slot_count * 30)}`,
    timeLabels: Array.from({ length: row.slot_count }, (_, i) => minuteLabel(row.start_minute + i * 30)),
    bookerName: row.booker_name, bookerAffiliation: row.booker_affiliation,
    eventPurpose: row.event_purpose, requestMessage: row.request_message, isManual: row.is_manual };
}
