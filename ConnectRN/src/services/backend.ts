import { supabase } from '../lib/supabase';
import { createBackend } from './api';
export const { rpc, searchStores } = createBackend(supabase);

export function errorMessage(error: unknown): string {
  const e = error as { message?: string; code?: string };
  if (/Cannot find native module.*Notifications|aps-environment|ExpoPushToken|FirebaseApp|FCM/i.test(e.message ?? '')) return '이 앱의 푸시 설정 또는 업데이트가 필요합니다. 앱 관리자에게 문의해주세요.';
  if (e.code === 'over_email_send_rate_limit' || e.code === 'over_request_rate_limit') return '인증 요청이 많습니다. 잠시 후 다시 시도해주세요.';
  if (e.code === 'email_address_not_authorized' || /not authorized|SMTP|sending.*email/i.test(e.message ?? '')) {
    return '현재 인증 메일을 발송할 수 없습니다. 서비스 관리자에게 문의해주세요.';
  }
  if (e.code === 'otp_expired') return '인증번호가 만료되었거나 올바르지 않습니다. 다시 요청해주세요.';
  if (e.message?.includes('Failed to fetch') || e.message?.includes('Network request failed')) return '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
  return e.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';
}
