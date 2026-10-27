import { Trip } from '../types';

const KEYS_STORAGE_KEY = 'teamsplit_authorized_edit_keys';

function getStoredKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTripEditKey(tripId: string, key: string): void {
  try {
    const keys = getStoredKeys();
    keys[tripId] = key;
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to save edit key:', err);
  }
}

export function getSavedEditKey(tripId: string): string | null {
  const keys = getStoredKeys();
  return keys[tripId] || null;
}

/**
 * Checks if the user is authorized to edit the given trip.
 * 
 * An editor is verified if:
 * 1. The URL provides the matching `key` parameter.
 * 2. OR the user's browser previously saved the matching edit key (e.g. they created it or previously used the collaborator link).
 * 3. AND the URL does not explicitly demand read-only mode (`view=readonly`).
 */
export function canUserEditTrip(
  trip: Trip,
  urlKey?: string | null,
  forceViewOnly?: boolean
): boolean {
  if (forceViewOnly) return false;

  // If trip has no editKey set, default to allow edit for backward compatibility
  if (!trip.editKey) return true;

  // 1. Direct URL key match
  if (urlKey && urlKey === trip.editKey) {
    // Save for future visits on this device
    saveTripEditKey(trip.id, urlKey);
    return true;
  }

  // 2. Previously stored key in localStorage
  const savedKey = getSavedEditKey(trip.id);
  if (savedKey && savedKey === trip.editKey) {
    return true;
  }

  return false;
}
