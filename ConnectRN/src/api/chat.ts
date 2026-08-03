import { apiClient } from './client';
import type { ChatMessageResponseDto } from './types';
import type { ChatMessage, UserRole } from '../models/types';

function toChatMessage(dto: ChatMessageResponseDto): ChatMessage {
  return {
    id: dto.id,
    reservationId: dto.reservationId,
    senderRole: dto.senderRole === 'OWNER' ? 'owner' : 'booker',
    text: dto.text,
    timeLabel: new Date(dto.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
  };
}

export async function getMessages(reservationId: string): Promise<ChatMessage[]> {
  const dtos = await apiClient.get<ChatMessageResponseDto[]>(`/api/reservations/${reservationId}/messages`);
  return dtos.map(toChatMessage);
}

export async function sendMessage(
  reservationId: string,
  senderId: string,
  senderRole: UserRole,
  text: string
): Promise<ChatMessage> {
  const dto = await apiClient.post<ChatMessageResponseDto>(`/api/reservations/${reservationId}/messages`, {
    senderId,
    senderRole: senderRole === 'owner' ? 'OWNER' : 'BOOKER',
    text,
  });
  return toChatMessage(dto);
}
