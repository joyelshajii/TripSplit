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

import { tripStorage } from './tripStorage';

describe('TripStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty data if storage is empty', () => {
    const trips = tripStorage.getTrips();
    expect(trips.length).toBe(0);
  });

  it('can create, update, duplicate, and delete trips', () => {
    const trip = tripStorage.createTrip({
      title: 'Manali Expedition',
      destination: 'Manali, HP',
      memberNames: ['Alex', 'Bob'],
    });

    expect(trip.title).toBe('Manali Expedition');
    expect(trip.memberIds).toHaveLength(2);

    const members = tripStorage.getMembers(trip.id);
    expect(members).toHaveLength(2);

    // Update
    const updated = tripStorage.updateTrip(trip.id, { destination: 'Solang Valley' });
    expect(updated.destination).toBe('Solang Valley');

    // Duplicate
    const dup = tripStorage.duplicateTrip(trip.id);
    expect(dup.title).toContain('(Copy)');
    expect(dup.id).not.toBe(trip.id);

    // Delete
    tripStorage.deleteTrip(trip.id);
    expect(tripStorage.getTrip(trip.id)).toBeUndefined();
  });

  it('exports and imports backup with ID collision prevention', () => {
    tripStorage.createTrip({
      title: 'Kerala Trip',
      destination: 'Munnar',
      memberNames: ['Joel', 'Arun'],
    });

    const backup = tripStorage.exportBackup();
    expect(backup.trips.length).toBe(1);
    expect(backup.appName).toBe('TripSplit');

    // Import into same store in merge mode -> IDs must not collide
    const initialTripCount = tripStorage.getTrips().length;
    const res = tripStorage.importBackup(JSON.stringify(backup), 'merge');
    expect(res.tripsCount).toBe(backup.trips.length);

    const newTripCount = tripStorage.getTrips().length;
    expect(newTripCount).toBe(initialTripCount + backup.trips.length);
  });

  it('rejects invalid backup JSON gracefully', () => {
    expect(() => {
      tripStorage.importBackup('{ not valid json', 'merge');
    }).toThrow(/Invalid JSON/);

    expect(() => {
      tripStorage.importBackup(JSON.stringify({ someKey: 'invalid' }), 'merge');
    }).toThrow(/must contain valid trips/);
  });
});
