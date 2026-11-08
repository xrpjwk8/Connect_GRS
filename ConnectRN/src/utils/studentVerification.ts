import type { Database } from '../models/database.types';
export type StudentVerification = Database['public']['Tables']['student_verifications']['Row'];
export const verificationLabel: Record<string, string> = {
  draft: '미제출', pending: '심사 중', approved: '승인 완료', rejected: '재신청 필요',
};
export const MAX_STUDENT_CARD_BYTES = 10 * 1024 * 1024;
export const studentRestriction = '학생증 인증 승인 후 예약·채팅을 이용할 수 있습니다. 마이페이지에서 학생증을 제출해주세요.';

export function studentCardFormat(buffer: ArrayBuffer) {
  if (!buffer.byteLength || buffer.byteLength > MAX_STUDENT_CARD_BYTES) throw new Error('파일 크기는 0바이트 초과, 10MB 이하여야 합니다.');
  const bytes = new Uint8Array(buffer);
  const starts = (signature: number[]) => signature.every((value, i) => bytes[i] === value);
  if (starts([0xff, 0xd8, 0xff])) return { extension: 'jpg', contentType: 'image/jpeg' };
  if (starts([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) return { extension: 'png', contentType: 'image/png' };
  if (starts([0x25,0x50,0x44,0x46,0x2d])) return { extension: 'pdf', contentType: 'application/pdf' };
  throw new Error('JPG, PNG 또는 PDF 파일만 제출할 수 있습니다.');
}
