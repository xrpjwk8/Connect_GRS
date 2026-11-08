import { supabase } from '../lib/supabase';
import { developmentPreview, previewRestriction } from '../lib/developmentPreview';
import { rpc } from './backend';
import { studentCardFormat, type StudentVerification } from '../utils/studentVerification';

export const STUDENT_BUCKET = 'student-cards';

export async function uploadStudentCard(bytes: ArrayBuffer, userId: string, previous: StudentVerification | null) {
  if (developmentPreview.active) throw new Error(previewRestriction);
  const format = studentCardFormat(bytes);
  const checkAccount = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user.id !== userId) throw new Error('로그인 계정이 변경되었습니다. 다시 시도해주세요.');
  };
  await checkAccount();
  if (previous && (previous.status === 'draft' || previous.status === 'rejected')) {
    const { error } = await supabase.storage.from(STUDENT_BUCKET).remove([previous.document_path]);
    if (error) throw error;
  }
  await checkAccount();
  const draft = await rpc('begin_student_verification', { p_extension: format.extension });
  await checkAccount();
  const { error } = await supabase.storage.from(STUDENT_BUCKET).upload(draft.document_path, bytes, {
    contentType: format.contentType, upsert: false, cacheControl: '0',
  });
  if (error) throw error;
  await checkAccount();
  // A lost response can be retried from the draft screen with the same request ID.
  return rpc('submit_student_verification', { p_request_id: draft.request_id });
}

export async function studentDocumentUrl(path: string) {
  if (developmentPreview.active) throw new Error(previewRestriction);
  const { data, error } = await supabase.storage.from(STUDENT_BUCKET).createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
