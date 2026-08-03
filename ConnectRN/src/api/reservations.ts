import { apiClient } from './client';
import type { OwnerDashboardResponseDto, ReservationResponseDto } from './types';
import type { MyReservation, ReservationStatus } from '../models/types';
import { formatReservationDateLabel, parseIsoDate } from '../utils/date';

const STATUS_MAP: Record<ReservationResponseDto['status'], ReservationStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

function timeSlotsToLabels(timeSlots: string[]): string[] {
  return timeSlots.map((t) => t.slice(0, 5));
}

export function toMyReservation(dto: ReservationResponseDto): MyReservation {
  const timeLabels = timeSlotsToLabels(dto.timeSlots);
  return {
    id: dto.id,
    storeId: dto.storeId,
    storeName: dto.storeName,
    imageSymbol: dto.imageName,
    status: STATUS_MAP[dto.status],
    dateLabel: formatReservationDateLabel(dto.date, timeLabels),
    people: dto.people,
    budget: dto.budgetPerPerson ?? undefined,
    bookerName: dto.bookerName,
    bookerAffiliation: dto.bookerAffiliation,
    dateValue: parseIsoDate(dto.date),
    timeLabels,
    eventPurpose: dto.eventPurpose,
    requestMessage: dto.requestMessage,
  };
}

export interface CreateReservationPayload {
  storeId: string;
  bookerId: string;
  date: string;
  timeSlots: string[];
  people: number;
  budgetPerPerson?: number;
  eventPurpose: string;
  requestMessage?: string;
}

export async function createReservation(payload: CreateReservationPayload): Promise<MyReservation> {
  const dto = await apiClient.post<ReservationResponseDto>('/api/reservations', payload);
  return toMyReservation(dto);
}

export async function getReservationsForBooker(bookerId: string, statusGroup?: string): Promise<MyReservation[]> {
  const dtos = await apiClient.get<ReservationResponseDto[]>(`/api/bookers/${bookerId}/reservations`, {
    statusGroup,
  });
  return dtos.map(toMyReservation);
}

export async function getReservationsForOwner(ownerId: string, statusGroup?: string): Promise<MyReservation[]> {
  const dtos = await apiClient.get<ReservationResponseDto[]>(`/api/owners/${ownerId}/reservations`, {
    statusGroup,
  });
  return dtos.map(toMyReservation);
}

export interface UpdateReservationPayload {
  date: string;
  timeSlots: string[];
  people: number;
  budgetPerPerson?: number;
  eventPurpose?: string;
  requestMessage?: string;
}

export async function updateReservation(
  reservationId: string,
  payload: UpdateReservationPayload
): Promise<MyReservation> {
  const dto = await apiClient.patch<ReservationResponseDto>(`/api/reservations/${reservationId}`, payload);
  return toMyReservation(dto);
}

export async function cancelReservation(reservationId: string): Promise<MyReservation> {
  const dto = await apiClient.post<ReservationResponseDto>(`/api/reservations/${reservationId}/cancel`);
  return toMyReservation(dto);
}

export interface OwnerDashboard {
  storeName: string;
  weeklyRevenueManWon: number;
  weeklyReservationCount: number;
  pendingRequestCount: number;
  pendingRequests: MyReservation[];
}

export async function getOwnerDashboard(ownerId: string): Promise<OwnerDashboard> {
  const dto = await apiClient.get<OwnerDashboardResponseDto>(`/api/owners/${ownerId}/dashboard`);
  return { ...dto, pendingRequests: dto.pendingRequests.map(toMyReservation) };
}

export async function approveReservation(ownerId: string, reservationId: string): Promise<MyReservation> {
  const dto = await apiClient.post<ReservationResponseDto>(
    `/api/owners/${ownerId}/reservations/${reservationId}/approve`
  );
  return toMyReservation(dto);
}

export async function rejectReservation(ownerId: string, reservationId: string): Promise<MyReservation> {
  const dto = await apiClient.post<ReservationResponseDto>(
    `/api/owners/${ownerId}/reservations/${reservationId}/reject`
  );
  return toMyReservation(dto);
}
