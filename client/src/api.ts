import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getRandomValues } from 'expo-crypto';
import type { Board } from './types';

const configured = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
function apiOrigin() {
  if (Platform.OS === 'web') return __DEV__ ? configured : '';
  if (!configured) throw new Error('Set EXPO_PUBLIC_API_URL to the Pi address, then restart Expo.');
  return configured;
}
export function newId(): string {
  const bytes = getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
}
export async function request(method: string, path: string, body?: unknown, signal?: AbortSignal) {
  const url = apiOrigin() + '/api' + path;
  const local = signal ? null : new AbortController();
  const timeout = local ? setTimeout(() => local.abort(), 15000) : null;
  try {
    const response = await fetch(url, { method, signal: signal ?? local?.signal,
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Kitchen-Table': '1' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(problem.detail || ('Request failed (' + response.status + ').'));
    }
    return response;
  } catch (e) {
    if (local?.signal.aborted) throw new Error('The Pi did not confirm the change. Refresh to check whether it was saved.');
    throw e;
  } finally { if (timeout !== null) clearTimeout(timeout); }
}

export function message(error: unknown): string {
  if (error instanceof TypeError) return 'Could not reach the Pi. Check Wi-Fi and the server address.';
  return error instanceof Error ? error.message : 'The request failed. Try again.';
}

// Ignore responses for a previous week and superseded polls. Refresh on foreground and after writes.
export function useBoard(start: string | null) {
  const [snapshot, setSnapshot] = useState<{ key: string | null; board: Board } | null>(null);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const currentStart = useRef(start);
  currentStart.current = start;
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (currentStart.current !== start) return;
    const mine = ++sequence.current;
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    const timeout = setTimeout(() => pending.abort(), 12000);
    try {
      const response = await request('GET', '/week' + (start ? '?start=' + start : ''), undefined, pending.signal);
      const board: Board = await response.json();
      if (mine === sequence.current && currentStart.current === start) { setSnapshot({ key: start, board }); setError(''); }
    } catch (e) {
      if (mine === sequence.current) setError(pending.signal.aborted ? 'The Pi took too long to reply. Try again.' : message(e));
    } finally { clearTimeout(timeout); }
  }, [start]);
  useEffect(() => {
    setError(''); void refresh();
    const interval = setInterval(() => { if (AppState.currentState !== 'background') void refresh(); }, 15000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { clearInterval(interval); sub.remove(); ++sequence.current; controller.current?.abort(); };
  }, [refresh]);
  return { board: snapshot?.key === start ? snapshot.board : null, error, refresh };
}
