import { randomUUID } from 'expo-crypto';
import { supabase } from '../lib/supabase';
import { developmentPreview, previewRestriction } from '../lib/developmentPreview';
import { studentCardFormat } from '../utils/studentVerification';
import type { UploadFile } from '../utils/prepareUpload';
import { rpc } from './backend';

export const STORE_PHOTO_BUCKET = 'store-photos';
// Input comes from the compressed preview. Recheck actual bytes, not picker metadata.
export async function saveStorePhoto(storeId: string, userId: string, file: UploadFile | null) {
  if (developmentPreview.active) throw new Error(previewRestriction);
  const checkAccount = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user.id !== userId) throw new Error('로그인 계정이 변경되었습니다. 다시 시도해주세요.');
  };
  await checkAccount();
  let path: string | null = null;
  if (file) {
    const bytes = await (await fetch(file.uri)).arrayBuffer();
    const format = studentCardFormat(bytes);
    if (format.extension === 'pdf' || bytes.byteLength > 1024 * 1024) throw new Error('매장 사진은 압축된 JPG·PNG, 최대 1MB만 저장할 수 있습니다. 다시 선택해주세요.');
    path = `${storeId}/${randomUUID()}.${format.extension}`;
    await checkAccount();
    const { error } = await supabase.storage.from(STORE_PHOTO_BUCKET).upload(path, bytes, { contentType: format.contentType, upsert: false });
    if (error) {
      // A lost upload response may have left an unreferenced object.
      await supabase.storage.from(STORE_PHOTO_BUCKET).remove([path]).catch(() => {});
      throw error;
    }
  }
  let previous: string | null;
  try {
    await checkAccount();
    previous = await rpc('set_store_photo', { p_store_id: storeId, p_path: path });
  } catch (error) {
    // RLS forbids deleting a referenced image, even if the RPC committed but its response was lost.
    if (path) await supabase.storage.from(STORE_PHOTO_BUCKET).remove([path]).catch(() => {});
    throw error;
  }
  let cleanupPending = false;
  if (previous && previous !== path) {
    try {
      await checkAccount();
      const { error } = await supabase.storage.from(STORE_PHOTO_BUCKET).remove([previous]);
      cleanupPending = !!error;
    } catch { cleanupPending = true; }
  }
  return { path, cleanupPending };
}

export async function storePhotoUrl(path: string) {
  if (developmentPreview.active) return null;
  const { data, error } = await supabase.storage.from(STORE_PHOTO_BUCKET).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
