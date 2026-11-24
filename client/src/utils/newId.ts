import { getRandomValues } from 'expo-crypto';

export function newId(): string {
  const bytes = getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  return Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('');
}
