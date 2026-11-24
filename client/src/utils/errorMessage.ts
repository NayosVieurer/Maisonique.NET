export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Could not reach the Pi. Check Wi-Fi and the server address.';
  }
  return error instanceof Error ? error.message : 'The request failed. Try again.';
}
