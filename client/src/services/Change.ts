export type Change = (method: string, path: string, body?: unknown) => Promise<boolean>;
