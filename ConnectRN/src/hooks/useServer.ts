import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { randomUUID } from 'expo-crypto';
import { useAppState } from '../state/AppState';
import { errorMessage } from '../services/backend';
import { showAlert } from '../utils/alert';
import { developmentPreview, previewRestriction } from '../lib/developmentPreview';

export function useServerQuery<T>(key: string, query: () => Promise<T>) {
  const action = useRef(query); action.current = query;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(null); setData(null);
    action.current().then(value => { if (active) setData(value); })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, version]));
  return { data, loading, error, reload: () => setVersion(v => v + 1) };
}
export function useRefreshOnFocus() {
  const { refresh } = useAppState();
  useFocusEffect(useCallback(() => { void refresh().catch(() => {}); }, [refresh]));
}
export function useServerAction() {
  const { refresh, session } = useAppState();
  const userId = useRef(session?.user.id); userId.current = session?.user.id;
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const request = useRef<{ key: string; id: string } | null>(null);
  // Preserve the same UUID after a lost response; changed inputs get a new UUID.
  const requestId = (payload: unknown) => {
    const key = JSON.stringify([session?.user.id, payload]);
    if (request.current?.key !== key) request.current = { key, id: randomUUID() };
    return request.current.id;
  };
  const run = async (action: () => Promise<unknown>, onSuccess?: () => void) => {
    if (developmentPreview.active) { showAlert('테스트 미리보기', previewRestriction); return; }
    if (lock.current) return;
    const startedFor = userId.current;
    lock.current = true; setBusy(true);
    try {
      await action();
      // A committed write remains successful even if the follow-up fetch fails.
      // App-wide DataStatus displays the refresh failure with a retry action.
      await refresh().catch(() => {});
      if (userId.current === startedFor) onSuccess?.();
    } catch (error) { if (userId.current === startedFor) showAlert('처리하지 못했어요', errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  };
  return { busy, run, requestId };
}
