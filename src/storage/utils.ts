import { createUuid } from '../core/ids';
import { normalizeText } from '../core/normalize';
import { nowMs } from '../core/time';

export function normalizeField(value: string): string {
  return normalizeText(value);
}

export function createTimestamp(): number {
  return nowMs();
}

export function createStorageId(): string {
  return createUuid();
}
