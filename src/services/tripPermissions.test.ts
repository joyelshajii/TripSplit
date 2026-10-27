import { describe, it, expect, beforeEach } from 'vitest';

// In-memory localStorage mock for node test runner
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, String(v)),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
(globalThis as any).localStorage = localStorageMock;

import { canUserEditTrip, saveTripEditKey, getSavedEditKey } from './tripPermissions';
import { Trip } from '../types';

describe('tripPermissions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockTrip: Trip = {
    id: 'trip_100',
    title: 'Test Trip',
    memberIds: ['m1'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    revision: 1,
    confirmationHistory: [],
    editKey: 'secret_key_123',
  };

  it('denies edit if forceViewOnly is true even if key matches', () => {
    expect(canUserEditTrip(mockTrip, 'secret_key_123', true)).toBe(false);
  });

  it('allows edit if matching urlKey is provided and saves key locally', () => {
    expect(canUserEditTrip(mockTrip, 'secret_key_123', false)).toBe(true);
    expect(getSavedEditKey('trip_100')).toBe('secret_key_123');
  });

  it('denies edit if wrong urlKey is provided and no stored key exists', () => {
    expect(canUserEditTrip(mockTrip, 'wrong_key', false)).toBe(false);
  });

  it('denies edit if no key provided and no stored key exists', () => {
    expect(canUserEditTrip(mockTrip, null, false)).toBe(false);
  });

  it('allows edit if user previously stored the correct key', () => {
    saveTripEditKey('trip_100', 'secret_key_123');
    expect(canUserEditTrip(mockTrip, null, false)).toBe(true);
  });
});
