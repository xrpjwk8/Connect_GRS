import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useAppState } from '../state/AppState';
import { supabase } from '../lib/supabase';
import { fetchChat, sendMessage, type MessageRow } from '../services/chat';
import { errorMessage } from '../services/backend';

export function useChat(reservationId: string, epoch = 0) {
  const { session, isPreview } = useAppState(); const userId = session?.user.id;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const currentMessages = useRef(messages); currentMessages.current = messages;
  const [error, setError] = useState(''); const [sending, setSending] = useState(false);
  const [hasOlder, setHasOlder] = useState(false); const [loading, setLoading] = useState(false);
  const generation = useRef(0); const sendLock = useRef(false); const pageLock = useRef(false);
  const pending = useRef<{ body: string; requestId: string } | null>(null);
  const merge = useCallback((rows: MessageRow[]) => setMessages(old => {
    const byId = new Map(old.map(m => [m.id, m])); rows.forEach(m => byId.set(m.id, m));
    return [...byId.values()].sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  }), []);
  const refresh = useCallback(async () => {
    if (!userId || isPreview) return;
    const run = generation.current;
    try {
      const newest = currentMessages.current.at(-1);
      let page = await fetchChat(reservationId, undefined, epoch); const rows = [...page]; let pages = 1;
      // Backfill bursts missed while offline, rather than skipping the gap between pages.
      while (newest && page.length === 50 && page.at(-1)!.created_at >= newest.created_at && !page.some(m => m.id === newest.id) && pages < 10) {
        if (run !== generation.current) return;
        page = await fetchChat(reservationId, page.at(-1), epoch); rows.push(...page); pages++;
      }
      if (run !== generation.current) return;
      if (pages === 10 && page.at(-1)!.created_at > (newest?.created_at ?? '')) {
        setMessages([]); setHasOlder(true);
      }
      merge(rows); setError('');
    }
    catch (e) { if (run === generation.current) setError(errorMessage(e)); }
  }, [userId, isPreview, reservationId, epoch, merge]);
  useEffect(() => {
    ++generation.current; const run = generation.current;
    setMessages([]); setError(''); setHasOlder(false); setLoading(false); setSending(false); pending.current = null;
    if (!userId || isPreview) return;
    setLoading(true);
    void fetchChat(reservationId, undefined, epoch).then(rows => { if (run === generation.current) { merge(rows); setHasOlder(rows.length === 50); } })
      .catch(e => { if (run === generation.current) setError(errorMessage(e)); })
      .finally(() => { if (run === generation.current) setLoading(false); });
    const channel = supabase.channel(`chat:${reservationId}:${epoch}:${userId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `reservation_id=eq.${reservationId}`,
    }, () => { void refresh(); }).subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); });
    // Reconcile missed realtime events after reconnect/foreground; RLS applies to every fetch.
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 10000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { ++generation.current; clearInterval(timer); listener.remove(); void supabase.removeChannel(channel); };
  }, [userId, isPreview, reservationId, epoch, merge, refresh]);
  const loadOlder = async () => {
    if (!messages[0] || pageLock.current || !userId || isPreview) return;
    pageLock.current = true; const run = generation.current; setLoading(true);
    try { const rows = await fetchChat(reservationId, messages[0], epoch); if (run === generation.current) { merge(rows); setHasOlder(rows.length === 50); setError(''); } }
    catch (e) { if (run === generation.current) setError(errorMessage(e)); }
    finally { pageLock.current = false; if (run === generation.current) setLoading(false); }
  };
  const send = async (body: string) => {
    if (sendLock.current || !userId || isPreview) return false;
    const text = body.trim(); if (!text) return false;
    if (pending.current && pending.current.body !== text) { setError('전송 결과가 불확실한 메시지가 있습니다. 같은 내용을 다시 전송해 결과를 확인해주세요.'); return false; }
    pending.current ??= { body: text, requestId: randomUUID() };
    sendLock.current = true; setSending(true); const run = generation.current;
    try {
      const row = await sendMessage(reservationId, text, pending.current.requestId, epoch);
      if (run !== generation.current) return false;
      pending.current = null; merge([row]); setError(''); return true;
    } catch (e) {
      if (run === generation.current) {
        // A definite DB rejection did not commit; network/unknown failures keep the request UUID.
        if (/^(22|42|54)/.test((e as { code?: string }).code ?? '')) pending.current = null;
        setError(errorMessage(e));
      }
      return false;
    } finally { sendLock.current = false; if (run === generation.current) setSending(false); }
  };
  return { messages, error, sending, loading, hasOlder, loadOlder, refresh, send };
}
