import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { tripStorage } from '../storage/tripStorage';
import { Trip, Member, Expense } from '../types';

export interface CloudTripPayload {
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  customCategories?: string[];
  editKey: string;
  updatedAt: string;
}

/**
 * Saves a local trip with all its members and expenses to Firestore.
 */
export async function syncTripToCloud(tripId: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    return false;
  }

  try {
    const trip = tripStorage.getTrip(tripId);
    if (!trip) return false;

    const members = tripStorage.getMembers(tripId);
    const expenses = tripStorage.getExpenses(tripId);
    const customCategories = tripStorage.getCategories();

    const payload: CloudTripPayload = {
      trip,
      members,
      expenses,
      customCategories,
      editKey: trip.editKey || '',
      updatedAt: trip.updatedAt || new Date().toISOString(),
    };

    await setDoc(doc(db, 'trips', tripId), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[CloudSync] Failed to sync trip to Firestore:', err);
    return false;
  }
}

/**
 * Fetches a trip by ID from Firestore and loads it into local storage.
 */
export async function fetchTripFromCloud(
  tripId: string
): Promise<{ success: boolean; trip?: Trip; error?: string }> {
  if (!isFirebaseConfigured || !db) {
    return { success: false, error: 'Firebase is not configured' };
  }

  try {
    const docRef = doc(db, 'trips', tripId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, error: 'Trip not found on server' };
    }

    const data = snap.data() as CloudTripPayload;
    if (!data.trip || !Array.isArray(data.members)) {
      return { success: false, error: 'Corrupt trip data format' };
    }

    tripStorage.upsertTripFromCloud(data);
    return { success: true, trip: data.trip };
  } catch (err: any) {
    console.error('[CloudSync] Error fetching trip from cloud:', err);
    if (
      err?.code === 'permission-denied' ||
      err?.message?.includes('permission') ||
      err?.message?.includes('PERMISSION_DENIED')
    ) {
      return {
        success: false,
        error:
          'Firestore permission denied. Please update your Firebase Firestore Security Rules in Firebase Console to allow read and write access.',
      };
    }
    return { success: false, error: err?.message || 'Failed to connect to cloud database' };
  }
}

/**
 * Subscribes to real-time updates for a trip in Firestore.
 * When another collaborator updates an expense, this listener updates the local cache
 * and triggers `onUpdate()`.
 */
export function subscribeToTripInCloud(
  tripId: string,
  onUpdate: () => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const docRef = doc(db, 'trips', tripId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CloudTripPayload;
          if (data && data.trip) {
            tripStorage.upsertTripFromCloud(data);
            onUpdate();
          }
        }
      },
      (error) => {
        console.warn('[CloudSync] Real-time listener warning:', error);
      }
    );
  } catch (err) {
    console.warn('[CloudSync] Failed to attach listener:', err);
    return () => {};
  }
}

/**
 * Deletes a trip from Firestore when deleted locally.
 */
export async function deleteTripFromCloud(tripId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    await deleteDoc(doc(db, 'trips', tripId));
  } catch (err) {
    console.warn('[CloudSync] Failed to delete trip from Firestore:', err);
  }
}

/**
 * Uploads all existing local trips to Firestore.
 * Useful when setting up cloud sync or after updating security rules.
 */
export async function syncAllLocalTrips(): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const trips = tripStorage.getTrips();
    for (const t of trips) {
      await syncTripToCloud(t.id);
    }
  } catch (err) {
    console.warn('[CloudSync] Failed to batch sync local trips:', err);
  }
}

