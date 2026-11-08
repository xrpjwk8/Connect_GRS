import { studentCardFormat } from './studentVerification';

export type UploadFile = { uri: string; name: string; size?: number; mimeType?: string };
export type ImagePurpose = 'student' | 'photo';

// Run locally before any server write; never silently send the original on failure.
export async function prepareUpload(file: UploadFile, purpose: ImagePurpose = 'photo'): Promise<UploadFile> {
  if ((file.size ?? 0) > 10 * 1024 * 1024) throw new Error('10MB 이하 파일을 선택해주세요.');
  const original = await (await fetch(file.uri)).arrayBuffer();
  if (!original.byteLength || original.byteLength > 10 * 1024 * 1024) {
    throw new Error('0바이트 초과, 10MB 이하 파일을 선택해주세요.');
  }
  const signature = new Uint8Array(original);
  const pdf = [0x25, 0x50, 0x44, 0x46, 0x2d].every((v, i) => signature[i] === v);
  if (pdf) {
    studentCardFormat(original); // PDFs retain the existing 10MB limit.
    return { uri: file.uri, name: file.name, size: original.byteLength, mimeType: 'application/pdf' };
  }
  const maxEdge = purpose === 'student' ? 2000 : 1600;
  const maxBytes = (purpose === 'student' ? 2 : 1) * 1024 * 1024;
  // Load on selection so an older development build can still open the app.
  const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
  const context = ImageManipulator.manipulate(file.uri);
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  try {
    rendered = await context.renderAsync();
    const resized = Math.max(rendered.width, rendered.height) > maxEdge;
    if (resized) {
      context.resize(rendered.width >= rendered.height ? { width: maxEdge } : { height: maxEdge });
      rendered.release();
      rendered = undefined;
      rendered = await context.renderAsync();
    }
    for (const quality of [0.82, 0.72, 0.62]) {
      const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality });
      const bytes = await (await fetch(result.uri)).arrayBuffer();
      if (bytes.byteLength <= maxBytes) {
        studentCardFormat(bytes); // Verify the encoded output before returning it.
        // Do not enlarge already-efficient JPG/PNG files.
        if (!resized && original.byteLength < bytes.byteLength) {
          try {
            const format = studentCardFormat(original);
            return { uri: file.uri, name: file.name, size: original.byteLength, mimeType: format.contentType };
          } catch { /* Other image formats must use the converted JPEG. */ }
        }
        return { uri: result.uri, name: file.name.replace(/\.[^.]+$/, '') + '.jpg', size: bytes.byteLength, mimeType: 'image/jpeg' };
      }
    }
    throw new Error('이미지 용량을 충분히 줄이지 못했습니다. 필요한 부분만 잘라 다시 선택해주세요.');
  } finally {
    rendered?.release();
    context.release();
  }
}
