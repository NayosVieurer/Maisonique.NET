import { useRef, useState } from 'react';

import { apiRequest } from '../services/apiRequest';
import type { Change } from '../services/Change';
import { errorMessage } from '../utils/errorMessage';

export function useHouseholdWrite(refresh: () => Promise<void>) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const change: Change = async (method, path, body) => {
    if (inFlight.current) {
      return false;
    }

    inFlight.current = true;
    setBusy(true);
    setError('');

    try {
      await apiRequest(method, path, body);
      await refresh();
      return true;
    } catch (error) {
      setError(errorMessage(error));
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return { busy, error, change, clearError: () => setError('') };
}
