import { apiClient } from './client';
import type { BookerProfileDto, OwnerProfileDto } from './types';

export interface BookerSignUpPayload {
  schoolName: string;
  departmentName: string;
  position: string;
  realName: string;
  schoolEmail: string;
  phoneNumber: string;
}

export interface OwnerSignUpPayload {
  storeName: string;
  ownerName: string;
  contact: string;
  businessNumber: string;
}

export function signUpBooker(payload: BookerSignUpPayload): Promise<BookerProfileDto> {
  return apiClient.post<BookerProfileDto>('/api/auth/bookers', payload);
}

export function signUpOwner(payload: OwnerSignUpPayload): Promise<OwnerProfileDto> {
  return apiClient.post<OwnerProfileDto>('/api/auth/owners', payload);
}

export function lookupBookerByEmail(schoolEmail: string): Promise<BookerProfileDto> {
  return apiClient.get<BookerProfileDto>('/api/auth/bookers/lookup', { schoolEmail });
}

export function lookupOwnerByContact(contact: string): Promise<OwnerProfileDto> {
  return apiClient.get<OwnerProfileDto>('/api/auth/owners/lookup', { contact });
}

export function sendVerificationCode(email: string): Promise<void> {
  return apiClient.post<void>('/api/auth/verification-code', { email });
}

export function confirmVerificationCode(email: string, code: string): Promise<void> {
  return apiClient.post<void>('/api/auth/verification-code/confirm', { email, code });
}
