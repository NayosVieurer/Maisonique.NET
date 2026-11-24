import { Platform } from 'react-native';

const configuredOrigin = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

const writeTimeoutMs = 15_000;

function apiOrigin(): string {
  if (Platform.OS === 'web') {
    return __DEV__ ? configuredOrigin : '';
  }

  if (!configuredOrigin) {
    throw new Error('Set EXPO_PUBLIC_API_URL to the Pi address, then restart Expo.');
  }

  return configuredOrigin;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const url = apiOrigin() + '/api' + path;
  const headers: Record<string, string> =
    method === 'GET'
      ? {}
      : { 'Content-Type': 'application/json', 'X-Kitchen-Table': '1' };

  const controller = signal ? null : new AbortController();
  const timeout = controller
    ? setTimeout(() => controller.abort(), writeTimeoutMs)
    : null;

  try {
    const response = await fetch(url, {
      method,
      signal: signal ?? controller?.signal,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(problem.detail || 'Request failed (' + response.status + ').');
    }

    return response;
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error(
        'The Pi did not confirm the change. Refresh to check whether it was saved.',
      );
    }

    throw error;
  } finally {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
  }
}
