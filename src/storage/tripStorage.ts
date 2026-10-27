import {
  Trip,
  Member,
  Expense,
  BackupData,
  TripCalculationResult,
} from '../types';
import { rupeesToPaise } from '../utils/currency';
import { saveTripEditKey } from '../services/tripPermissions';

const STORAGE_KEY = 'tripsplit_v1_store';
const CORRUPTED_BACKUP_KEY = 'tripsplit_corrupted_backup';
const CURRENT_VERSION = 1;

interface StorageState {
  version: number;
  trips: Trip[];
  members: Member[];
  expenses: Expense[];
  customCategories?: string[];
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createEmptyState(): StorageState {
  return {
    version: CURRENT_VERSION,
    trips: [],
    members: [],
    expenses: [],
    customCategories: [],
  };
}

class TripStorageService {
  private readState(): StorageState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const empty = createEmptyState();
        this.writeState(empty);
        return empty;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.trips)) {
        throw new Error('Malformed storage schema');
      }

      // Filter out any demo data artifacts if present
      parsed.trips = parsed.trips.filter((t: Trip) => t.id !== 'trip_demo_goa');
      parsed.members = parsed.members.filter((m: Member) => m.tripId !== 'trip_demo_goa');
      parsed.expenses = parsed.expenses.filter((e: Expense) => e.tripId !== 'trip_demo_goa');

      // Migrate legacy 'Petrol' category to 'Fuel'
      parsed.expenses.forEach((e: Expense) => {
        if ((e.category as string) === 'Petrol') {
          e.category = 'Fuel';
        }
      });
      if (Array.isArray(parsed.customCategories)) {
        parsed.customCategories = parsed.customCategories.map((c: string) =>
          c === 'Petrol' ? 'Fuel' : c
        );
      } else {
        parsed.customCategories = [];
      }

      // Ensure all trips have an editKey
      parsed.trips.forEach((t: Trip) => {
        if (!t.editKey) {
          t.editKey = generateId('key');
          saveTripEditKey(t.id, t.editKey);
        }
      });

      return parsed as StorageState;
    } catch (err) {
      console.error('Error reading storage, preserving backup:', err);
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localStorage.setItem(CORRUPTED_BACKUP_KEY, raw);
      } catch {
        // ignore
      }
      const empty = createEmptyState();
      this.writeState(empty);
      return empty;
    }
  }

  private writeState(state: StorageState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to write to localStorage:', err);
      throw new Error('Local storage write failed. Your browser storage may be full.');
    }
  }

  // --- Trips ---
  public getTrips(): Trip[] {
    const state = this.readState();
    return [...state.trips].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getTrip(id: string): Trip | undefined {
    const state = this.readState();
    return state.trips.find((t) => t.id === id);
  }

  public createTrip(params: {
    title: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    memberNames: string[];
  }): Trip {
    const state = this.readState();
    const tripId = generateId('trip');
    const now = new Date().toISOString();

    const members: Member[] = params.memberNames.map((name) => ({
      id: generateId('mem'),
      tripId,
      name: name.trim(),
      createdAt: now,
    }));

    const editKey = generateId('key');
    const trip: Trip = {
      id: tripId,
      title: params.title.trim(),
      destination: params.destination?.trim() || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      description: params.description?.trim() || undefined,
      memberIds: members.map((m) => m.id),
      createdAt: now,
      updatedAt: now,
      revision: 1,
      lastConfirmedRevision: null,
      confirmationHistory: [],
      editKey,
    };

    saveTripEditKey(tripId, editKey);
    state.trips.push(trip);
    state.members.push(...members);
    this.writeState(state);

    return trip;
  }

  public updateTrip(
    id: string,
    updates: Partial<Pick<Trip, 'title' | 'destination' | 'startDate' | 'endDate' | 'description'>>
  ): Trip {
    const state = this.readState();
    const index = state.trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip with ID ${id} not found`);

    const now = new Date().toISOString();
    const updated: Trip = {
      ...state.trips[index],
      ...updates,
      updatedAt: now,
      revision: state.trips[index].revision + 1,
    };

    state.trips[index] = updated;
    this.writeState(state);
    return updated;
  }

  public duplicateTrip(id: string): Trip {
    const state = this.readState();
    const original = state.trips.find((t) => t.id === id);
    if (!original) throw new Error('Trip not found');

    const newTripId = generateId('trip');
    const now = new Date().toISOString();

    // Map old member IDs to new member IDs
    const memberIdMap = new Map<string, string>();
    const originalMembers = state.members.filter((m) => m.tripId === id);
    const newMembers: Member[] = originalMembers.map((m) => {
      const newMemId = generateId('mem');
      memberIdMap.set(m.id, newMemId);
      return {
        ...m,
        id: newMemId,
        tripId: newTripId,
        createdAt: now,
      };
    });

    const originalExpenses = state.expenses.filter((e) => e.tripId === id);
    const newExpenses: Expense[] = originalExpenses.map((e) => ({
      ...e,
      id: generateId('exp'),
      tripId: newTripId,
      payerMemberId: memberIdMap.get(e.payerMemberId) || e.payerMemberId,
      beneficiaryMemberIds: e.beneficiaryMemberIds.map((bId) => memberIdMap.get(bId) || bId),
      createdAt: now,
      updatedAt: now,
    }));

    const duplicatedTrip: Trip = {
      ...original,
      id: newTripId,
      title: `${original.title} (Copy)`,
      memberIds: newMembers.map((m) => m.id),
      createdAt: now,
      updatedAt: now,
      revision: 1,
      lastConfirmedRevision: null,
      confirmationHistory: [],
    };

    state.trips.push(duplicatedTrip);
    state.members.push(...newMembers);
    state.expenses.push(...newExpenses);
    this.writeState(state);

    return duplicatedTrip;
  }

  public deleteTrip(id: string): void {
    const state = this.readState();
    state.trips = state.trips.filter((t) => t.id !== id);
    state.members = state.members.filter((m) => m.tripId !== id);
    state.expenses = state.expenses.filter((e) => e.tripId !== id);
    this.writeState(state);
  }

  public upsertTripFromCloud(cloudData: {
    trip: Trip;
    members: Member[];
    expenses: Expense[];
    customCategories?: string[];
  }): void {
    const state = this.readState();
    const tIndex = state.trips.findIndex((t) => t.id === cloudData.trip.id);
    if (tIndex >= 0) {
      // Preserve existing trip object if cloudData is older or merge
      state.trips[tIndex] = {
        ...state.trips[tIndex],
        ...cloudData.trip,
      };
    } else {
      state.trips.push(cloudData.trip);
    }

    // Replace members for this trip
    state.members = state.members.filter((m) => m.tripId !== cloudData.trip.id);
    state.members.push(...cloudData.members);

    // Replace expenses for this trip
    state.expenses = state.expenses.filter((e) => e.tripId !== cloudData.trip.id);
    state.expenses.push(...cloudData.expenses);

    // Merge custom categories
    if (cloudData.customCategories && Array.isArray(cloudData.customCategories)) {
      const mergedCats = new Set([...(state.customCategories || []), ...cloudData.customCategories]);
      state.customCategories = Array.from(mergedCats);
    }

    this.writeState(state);
  }

  // --- Members ---
  public getMembers(tripId: string): Member[] {
    const state = this.readState();
    return state.members.filter((m) => m.tripId === tripId);
  }

  public addMember(tripId: string, name: string): Member {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Member name cannot be blank');

    const state = this.readState();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');

    const now = new Date().toISOString();
    const newMember: Member = {
      id: generateId('mem'),
      tripId,
      name: cleanName,
      createdAt: now,
    };

    state.members.push(newMember);
    trip.memberIds.push(newMember.id);
    trip.revision += 1;
    trip.updatedAt = now;

    this.writeState(state);
    return newMember;
  }

  public renameMember(memberId: string, newName: string): Member {
    const cleanName = newName.trim();
    if (!cleanName) throw new Error('Member name cannot be blank');

    const state = this.readState();
    const member = state.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    member.name = cleanName;
    const trip = state.trips.find((t) => t.id === member.tripId);
    if (trip) {
      trip.revision += 1;
      trip.updatedAt = new Date().toISOString();
    }

    this.writeState(state);
    return member;
  }

  /**
   * Safely archives a member if they are linked to existing expenses,
   * or deletes them completely if they have no expenses.
   */
  public safeRemoveMember(memberId: string): { archived: boolean; message: string } {
    const state = this.readState();
    const member = state.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const trip = state.trips.find((t) => t.id === member.tripId);
    if (!trip) throw new Error('Trip not found');

    const hasPaid = state.expenses.some(
      (e) => e.tripId === trip.id && e.payerMemberId === memberId
    );
    const hasBenefited = state.expenses.some(
      (e) => e.tripId === trip.id && e.beneficiaryMemberIds.includes(memberId)
    );

    const now = new Date().toISOString();

    if (hasPaid || hasBenefited) {
      // Archive member to preserve historical calculations
      member.archivedAt = now;
      trip.revision += 1;
      trip.updatedAt = now;
      this.writeState(state);
      return {
        archived: true,
        message: `${member.name} has existing expenses. They have been archived so historical calculations remain intact.`,
      };
    } else {
      // Can safely delete
      state.members = state.members.filter((m) => m.id !== memberId);
      trip.memberIds = trip.memberIds.filter((id) => id !== memberId);
      trip.revision += 1;
      trip.updatedAt = now;
      this.writeState(state);
      return {
        archived: false,
        message: `${member.name} had no recorded expenses and was removed completely.`,
      };
    }
  }

  // --- Expenses ---
  public getExpenses(tripId: string): Expense[] {
    const state = this.readState();
    return state.expenses
      .filter((e) => e.tripId === tripId)
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }

  public getExpense(id: string): Expense | undefined {
    const state = this.readState();
    return state.expenses.find((e) => e.id === id);
  }

  public addExpense(
    tripId: string,
    params: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>
  ): Expense {
    if (params.amountPaise <= 0) throw new Error('Expense amount must be greater than zero');
    if (!params.payerMemberId) throw new Error('A payer must be selected');
    if (!params.beneficiaryMemberIds || params.beneficiaryMemberIds.length === 0) {
      throw new Error('At least one beneficiary must be selected');
    }

    const state = this.readState();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');

    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...params,
      id: generateId('exp'),
      tripId,
      createdAt: now,
      updatedAt: now,
    };

    state.expenses.push(newExpense);
    trip.revision += 1;
    trip.updatedAt = now;

    this.writeState(state);
    return newExpense;
  }

  public updateExpense(
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>>
  ): Expense {
    const state = this.readState();
    const index = state.expenses.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Expense with ID ${id} not found`);

    const existing = state.expenses[index];
    const now = new Date().toISOString();

    const updated: Expense = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    if (updated.amountPaise <= 0) throw new Error('Expense amount must be greater than zero');
    if (!updated.payerMemberId) throw new Error('A payer must be selected');
    if (updated.beneficiaryMemberIds.length === 0) {
      throw new Error('At least one beneficiary must be selected');
    }

    state.expenses[index] = updated;

    const trip = state.trips.find((t) => t.id === existing.tripId);
    if (trip) {
      trip.revision += 1;
      trip.updatedAt = now;
    }

    this.writeState(state);
    return updated;
  }

  public duplicateExpense(id: string): Expense {
    const state = this.readState();
    const original = state.expenses.find((e) => e.id === id);
    if (!original) throw new Error('Expense not found');

    const now = new Date().toISOString();
    const duplicated: Expense = {
      ...original,
      id: generateId('exp'),
      title: `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    state.expenses.push(duplicated);

    const trip = state.trips.find((t) => t.id === original.tripId);
    if (trip) {
      trip.revision += 1;
      trip.updatedAt = now;
    }

    this.writeState(state);
    return duplicated;
  }

  public deleteExpense(id: string): void {
    const state = this.readState();
    const expense = state.expenses.find((e) => e.id === id);
    if (!expense) return;

    state.expenses = state.expenses.filter((e) => e.id !== id);

    const trip = state.trips.find((t) => t.id === expense.tripId);
    if (trip) {
      trip.revision += 1;
      trip.updatedAt = new Date().toISOString();
    }

    this.writeState(state);
  }

  // --- Confirm Settlement ---
  public confirmSettlement(tripId: string, calculation: TripCalculationResult): Trip {
    const state = this.readState();
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');

    const now = new Date().toISOString();
    trip.lastConfirmedRevision = trip.revision;
    trip.updatedAt = now;

    const confirmationRecord = {
      revision: trip.revision,
      confirmedAt: now,
      expenseCount: Object.keys(calculation.expenseShares).length,
      totalPaise: calculation.totalTripPaise,
      transfers: calculation.settlementTransfers,
    };

    if (!trip.confirmationHistory) {
      trip.confirmationHistory = [];
    }
    trip.confirmationHistory.unshift(confirmationRecord);

    this.writeState(state);
    return trip;
  }

  // --- Backup Export / Import ---
  public exportBackup(): BackupData {
    const state = this.readState();
    return {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      appName: 'TripSplit',
      trips: state.trips,
      members: state.members,
      expenses: state.expenses,
    };
  }

  public importBackup(
    backupJson: string,
    mode: 'merge' | 'replace' = 'merge'
  ): { tripsCount: number; membersCount: number; expensesCount: number } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(backupJson);
    } catch {
      throw new Error('Invalid JSON format. Please verify the backup file.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Malformed backup data structure.');
    }

    const data = parsed as Partial<BackupData>;
    if (!Array.isArray(data.trips) || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
      throw new Error('Backup file must contain valid trips, members, and expenses arrays.');
    }

    const state = this.readState();

    if (mode === 'replace') {
      const newState: StorageState = {
        version: CURRENT_VERSION,
        trips: data.trips,
        members: data.members,
        expenses: data.expenses,
      };
      this.writeState(newState);
      return {
        tripsCount: data.trips.length,
        membersCount: data.members.length,
        expensesCount: data.expenses.length,
      };
    }

    // Merge mode with ID collision prevention
    const existingTripIds = new Set(state.trips.map((t) => t.id));
    const tripIdMap = new Map<string, string>();
    const memberIdMap = new Map<string, string>();

    const mergedTrips: Trip[] = [];
    for (const trip of data.trips) {
      const newTripId = existingTripIds.has(trip.id) ? generateId('trip') : trip.id;
      tripIdMap.set(trip.id, newTripId);
      mergedTrips.push({
        ...trip,
        id: newTripId,
        title: existingTripIds.has(trip.id) ? `${trip.title} (Imported)` : trip.title,
      });
    }

    const existingMemberIds = new Set(state.members.map((m) => m.id));
    const mergedMembers: Member[] = [];
    for (const member of data.members) {
      const newMemId = existingMemberIds.has(member.id) ? generateId('mem') : member.id;
      memberIdMap.set(member.id, newMemId);
      const mappedTripId = tripIdMap.get(member.tripId) || member.tripId;
      mergedMembers.push({
        ...member,
        id: newMemId,
        tripId: mappedTripId,
      });
    }

    // Update trip.memberIds
    for (const trip of mergedTrips) {
      trip.memberIds = trip.memberIds.map((mId) => memberIdMap.get(mId) || mId);
    }

    const existingExpenseIds = new Set(state.expenses.map((e) => e.id));
    const mergedExpenses: Expense[] = [];
    for (const expense of data.expenses) {
      const newExpId = existingExpenseIds.has(expense.id) ? generateId('exp') : expense.id;
      const mappedTripId = tripIdMap.get(expense.tripId) || expense.tripId;
      mergedExpenses.push({
        ...expense,
        id: newExpId,
        tripId: mappedTripId,
        payerMemberId: memberIdMap.get(expense.payerMemberId) || expense.payerMemberId,
        beneficiaryMemberIds: expense.beneficiaryMemberIds.map(
          (bId) => memberIdMap.get(bId) || bId
        ),
      });
    }

    state.trips.push(...mergedTrips);
    state.members.push(...mergedMembers);
    state.expenses.push(...mergedExpenses);

    this.writeState(state);

    return {
      tripsCount: mergedTrips.length,
      membersCount: mergedMembers.length,
      expensesCount: mergedExpenses.length,
    };
  }

  // --- Categories Management ---
  public getCategories(): string[] {
    const state = this.readState();
    const custom = (state.customCategories || [])
      .map((c) => (c === 'Petrol' ? 'Fuel' : c))
      .filter(Boolean);
    const defaults = [
      'Transport',
      'Fuel',
      'Food',
      'Accommodation',
      'Tickets and activities',
      'Shopping',
      'Groceries',
      'Other',
    ];
    return Array.from(new Set([...defaults, ...custom]));
  }

  public addCategory(name: string): string[] {
    const clean = name.trim();
    if (!clean) return this.getCategories();
    const finalName = clean === 'Petrol' ? 'Fuel' : clean;
    const state = this.readState();
    const custom = state.customCategories || [];
    if (!custom.includes(finalName)) {
      state.customCategories = [...custom, finalName];
      this.writeState(state);
    }
    return this.getCategories();
  }

  public deleteCategory(name: string): string[] {
    const state = this.readState();
    if (state.customCategories) {
      state.customCategories = state.customCategories.filter((c) => c !== name);
      this.writeState(state);
    }
    return this.getCategories();
  }
}

export const tripStorage = new TripStorageService();
