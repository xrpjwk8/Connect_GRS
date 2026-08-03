import { apiClient } from './client';
import type { AvailabilityResponseDto, FilterMetadataResponseDto, StoreSummaryResponseDto } from './types';
import type { Store } from '../models/types';

export function toStore(dto: StoreSummaryResponseDto): Store {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    maxCapacity: dto.maxCapacity,
    pricePerPerson: dto.pricePerPerson,
    acceptanceRate: dto.acceptanceRate,
    location: dto.region,
    imageName: dto.imageName,
    keywords: dto.keywords,
    isFavorite: dto.favorite,
  };
}

export async function getFeaturedStores(bookerId?: string, region?: string): Promise<Store[]> {
  const dtos = await apiClient.get<StoreSummaryResponseDto[]>('/api/stores/featured', { bookerId, region });
  return dtos.map(toStore);
}

export async function searchStores(params: {
  bookerId?: string;
  region?: string;
  category?: string;
  people?: number;
  date?: string;
  time?: string;
}): Promise<Store[]> {
  const dtos = await apiClient.get<StoreSummaryResponseDto[]>('/api/stores', params);
  return dtos.map(toStore);
}

export async function getStore(storeId: string, bookerId?: string): Promise<Store> {
  const dto = await apiClient.get<StoreSummaryResponseDto>(`/api/stores/${storeId}`, { bookerId });
  return toStore(dto);
}

export async function getFavorites(bookerId: string): Promise<Store[]> {
  const dtos = await apiClient.get<StoreSummaryResponseDto[]>(`/api/bookers/${bookerId}/favorites`);
  return dtos.map(toStore);
}

export function addFavorite(bookerId: string, storeId: string): Promise<void> {
  return apiClient.post<void>(`/api/bookers/${bookerId}/favorites/${storeId}`);
}

export function removeFavorite(bookerId: string, storeId: string): Promise<void> {
  return apiClient.delete<void>(`/api/bookers/${bookerId}/favorites/${storeId}`);
}

export function getFilterMetadata(): Promise<FilterMetadataResponseDto> {
  return apiClient.get<FilterMetadataResponseDto>('/api/meta/filters');
}

export function getAvailability(ownerId: string, storeId: string, date: string): Promise<AvailabilityResponseDto> {
  return apiClient.get<AvailabilityResponseDto>(`/api/owners/${ownerId}/availability`, { storeId, date });
}

// blockedSlots: "HH:mm" 시작 시각 목록 (해당 날짜의 차단 목록 전체를 대체함)
export function replaceBlockedSlots(
  ownerId: string,
  storeId: string,
  date: string,
  blockedSlots: string[]
): Promise<AvailabilityResponseDto> {
  return apiClient.put<AvailabilityResponseDto>(`/api/owners/${ownerId}/availability/blocks`, {
    storeId,
    date,
    blockedSlots: blockedSlots.map((t) => `${t}:00`),
  });
}
