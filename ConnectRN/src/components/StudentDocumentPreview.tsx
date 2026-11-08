import React, { useEffect, useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppSpacing } from '../theme/spacing';
import { AppRadius } from '../theme/radius';
import { useTypography } from '../state/AppState';
import type { AppRole } from '../theme/typography';
import { GhostButton } from './Buttons';
import { studentDocumentUrl } from '../services/studentVerification';
import { errorMessage } from '../services/backend';

export default function StudentDocumentPreview({ path, appRole = 'booker' }: { path: string; appRole?: AppRole }) {
  const T = useTypography(appRole);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!url) return;
    const timer = setTimeout(() => setUrl(null), 60_000);
    return () => clearTimeout(timer);
  }, [url]);
  return <View style={{ gap: AppSpacing.s12, padding: AppSpacing.s16, borderRadius: AppRadius.lg, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.borderStrong }}>
    <Text style={T.titleMD}>제출된 학생증</Text>
    <Text style={[T.bodyMD, { color: AppColors.inkSecondary }]}>보안을 위해 파일은 1분 동안 표시됩니다. 시간이 지나면 다시 불러올 수 있어요.</Text>
    <GhostButton appRole={appRole} title={busy ? '불러오는 중…' : url ? '파일 다시 불러오기' : '제출 파일 보기'} disabled={busy} onPress={async () => {
      setBusy(true); setError('');
      try { setUrl(await studentDocumentUrl(path)); }
      catch (e) { setError(errorMessage(e)); }
      finally { setBusy(false); }
    }} />
    {url && (path.endsWith('.pdf')
      ? <GhostButton appRole={appRole} title="PDF 열기" onPress={() => { void Linking.openURL(url).catch(e => setError(errorMessage(e))); }} />
      : <Image accessibilityLabel="제출된 학생증" source={{ uri: url }} style={{ height: 320, width: '100%', backgroundColor: AppColors.surfaceContainerLow, borderRadius: AppRadius.md }} resizeMode="contain" onError={() => setError('이미지를 불러오지 못했습니다. 파일을 다시 불러와주세요.')}  />)}
    {error ? <Text accessibilityRole="alert" style={[T.bodyMD, { color: AppColors.danger }]}>{error}</Text> : null}
  </View>;
}
