import React, { useEffect, useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { GhostButton } from './Buttons';
import { studentDocumentUrl } from '../services/studentVerification';
import { errorMessage } from '../services/backend';

export default function StudentDocumentPreview({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!url) return;
    const timer = setTimeout(() => setUrl(null), 60_000);
    return () => clearTimeout(timer);
  }, [url]);
  return <View style={{ gap: 8 }}>
    <GhostButton title={busy ? '불러오는 중…' : '제출 파일 보기 (1분)'} disabled={busy} onPress={async () => {
      setBusy(true); setError('');
      try { setUrl(await studentDocumentUrl(path)); }
      catch (e) { setError(errorMessage(e)); }
      finally { setBusy(false); }
    }} />
    {url && (path.endsWith('.pdf')
      ? <GhostButton title="PDF 열기" onPress={() => { void Linking.openURL(url).catch(e => setError(errorMessage(e))); }} />
      : <Image accessibilityLabel="제출된 학생증" source={{ uri: url }} style={{ height: 260, width: '100%' }} resizeMode="contain" />)}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
  </View>;
}
