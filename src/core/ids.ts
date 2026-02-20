const randomPart = (): string => Math.random().toString(36).slice(2, 10);

export function createUuid(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${randomPart()}-${randomPart()}-${Date.now().toString(36)}`;
}
