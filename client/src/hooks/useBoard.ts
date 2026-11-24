import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { Board } from '../models/Board';
import { apiRequest } from '../services/apiRequest';
import { errorMessage } from '../utils/errorMessage';

const pollIntervalMs = 15_000;

const readTimeoutMs = 12_000;

export function useBoard(start: string | null) {
  const [snapshot, setSnapshot] = useState<{ key: string | null; board: Board } | null>(
    null,
  );
  const [error, setError] = useState('');

  const sequence = useRef(0);
  const activeWeek = useRef(start);
  const activeRequest = useRef<AbortController | null>(null);
  activeWeek.current = start;

  const refresh = useCallback(async () => {
    if (activeWeek.current !== start) {
      return;
    }

    // Only the newest request for the selected week may update the screen.
    const requestNumber = ++sequence.current;
    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), readTimeoutMs);
    const path = start ? '/week?start=' + start : '/week';

    try {
      const response = await apiRequest('GET', path, undefined, controller.signal);
      const board: Board = await response.json();

      if (requestNumber === sequence.current && activeWeek.current === start) {
        setSnapshot({ key: start, board });
        setError('');
      }
    } catch (error) {
      if (requestNumber === sequence.current && activeWeek.current === start) {
        const detail = controller.signal.aborted
          ? 'The Pi took too long to reply. Try again.'
          : errorMessage(error);
        setError(detail);
      }
    } finally {
      clearTimeout(timeout);
    }
  }, [start]);

  useEffect(() => {
    setError('');
    void refresh();

    const interval = setInterval(() => {
      if (AppState.currentState !== 'background') {
        void refresh();
      }
    }, pollIntervalMs);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      ++sequence.current;
      activeRequest.current?.abort();
    };
  }, [refresh]);

  const board = snapshot?.key === start ? snapshot.board : null;
  return { board, error, refresh };
}
