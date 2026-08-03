import { apiClient } from './client';
import type { UserRole } from '../models/types';

export function registerDevice(userId: string, role: UserRole, expoPushToken: string): Promise<void> {
  return apiClient.post<void>('/api/devices', {
    userId,
    role: role === 'owner' ? 'OWNER' : 'BOOKER',
    expoPushToken,
  });
}
