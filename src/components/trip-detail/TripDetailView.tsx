import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { Trip, Member, Expense, ExpenseCategory } from '../../types';
import { tripStorage } from '../../storage/tripStorage';
import { calculateTripBalances } from '../../engine/calculation';
import { syncTripToCloud, subscribeToTripInCloud } from '../../services/cloudSync';
import { TripHeader, TripTab } from './TripHeader';
import { OverviewTab } from './OverviewTab';
import { ExpensesTab } from './ExpensesTab';
import { MembersTab } from './MembersTab';
import { SettlementTab } from './SettlementTab';
import { ReportsTab } from './ReportsTab';
import { ExpenseModal } from './ExpenseModal';
import { EditTripModal } from '../trips/EditTripModal';
import { ShareTripModal } from './ShareTripModal';
import { Eye, ShieldAlert } from 'lucide-react';

export interface TripDetailViewProps {
  tripId: string;
  onBackToTrips: () => void;
  onTripDataChanged: () => void;
  isReadOnly?: boolean;
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  tripId,
  onBackToTrips,
  onTripDataChanged,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<TripTab>('overview');
  const [reportMemberId, setReportMemberId] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Ensure view starts scrolled at the top when opening a trip or changing tabs
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [tripId, activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    return () => clearTimeout(timer);
  }, [tripId, activeTab]);

  // Read current trip, members, and expenses
  const trip = tripStorage.getTrip(tripId);
  const members = tripStorage.getMembers(tripId);
  const expenses = tripStorage.getExpenses(tripId);

  // Subscribe to real-time updates from cloud
  useEffect(() => {
    if (trip && !isReadOnly) {
      // Background sync to ensure remote has latest state
      syncTripToCloud(trip.id);
    }

    const unsubscribe = subscribeToTripInCloud(tripId, () => {
      onTripDataChanged();
    });

    return () => unsubscribe();
  }, [tripId, isReadOnly]);

  // Run pure calculation engine whenever members or expenses change
  const calculation = useMemo(() => {
    return calculateTripBalances(members, expenses);
  }, [members, expenses]);

  const handleViewMemberReport = (memberId: string) => {
    setReportMemberId(memberId);
    setActiveTab('reports');
  };

  if (!trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Trip Not Found</h2>
        <p className="text-neutral-400">The requested trip could not be located in storage.</p>
        <button
          onClick={onBackToTrips}
          className="text-[#FDE047] font-bold hover:underline cursor-pointer"
        >
          Return to All Trips
        </button>
      </div>
    );
  }

  const handleSaveExpense = (data: {
    title: string;
    amountPaise: number;
    payerMemberId: string;
    beneficiaryMemberIds: string[];
    category: ExpenseCategory;
    expenseDate: string;
    description?: string;
  }) => {
    if (isReadOnly) return;

    if (expenseToEdit) {
      tripStorage.updateExpense(expenseToEdit.id, data);
    } else {
      tripStorage.addExpense(trip.id, data);
    }
    setExpenseToEdit(null);
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  const handleDuplicateExpense = (expenseId: string) => {
    if (isReadOnly) return;
    tripStorage.duplicateExpense(expenseId);
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (isReadOnly) return;
    tripStorage.deleteExpense(expenseId);
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  const handleAddMember = (name: string) => {
    if (isReadOnly) return;
    tripStorage.addMember(trip.id, name);
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  const handleRenameMember = (memberId: string, newName: string) => {
    if (isReadOnly) return;
    tripStorage.renameMember(memberId, newName);
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  const handleRemoveMember = (memberId: string) => {
    if (isReadOnly) return { archived: false, message: 'Editing is disabled in view-only mode.' };
    const res = tripStorage.safeRemoveMember(memberId);
    onTripDataChanged();
    syncTripToCloud(trip.id);
    return res;
  };

  const handleConfirmSettlement = () => {
    if (isReadOnly) return;
    tripStorage.confirmSettlement(trip.id, calculation);
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  const handleTripUpdated = () => {
    onTripDataChanged();
    syncTripToCloud(trip.id);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 text-white">
      {/* Dynamic Header & Tab Navigation */}
      <TripHeader
        trip={trip}
        calculation={calculation}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBackToTrips={onBackToTrips}
        onAddExpense={() => {
          if (isReadOnly) return;
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onEditTrip={() => setIsEditTripModalOpen(true)}
        onShareTrip={() => setIsShareModalOpen(true)}
        isReadOnly={isReadOnly}
      />

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 min-w-0">
        {activeTab === 'overview' && (
          <OverviewTab
            trip={trip}
            members={members}
            expenses={expenses}
            calculation={calculation}
            onAddExpense={() => {
              if (isReadOnly) return;
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToSettlement={() => setActiveTab('settlement')}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            members={members}
            onAddExpense={() => {
              if (isReadOnly) return;
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              if (isReadOnly) return;
              setExpenseToEdit(exp);
              setIsExpenseModalOpen(true);
            }}
            onDuplicateExpense={handleDuplicateExpense}
            onDeleteExpense={handleDeleteExpense}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            members={members}
            expenses={expenses}
            memberSummaries={calculation.memberSummaries}
            onAddMember={handleAddMember}
            onRenameMember={handleRenameMember}
            onRemoveMember={handleRemoveMember}
            onEditExpense={(exp) => {
              if (isReadOnly) return;
              setExpenseToEdit(exp);
              setIsExpenseModalOpen(true);
            }}
            onViewMemberReport={handleViewMemberReport}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementTab
            trip={trip}
            members={members}
            expenses={expenses}
            calculation={calculation}
            onConfirmSettlement={handleConfirmSettlement}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            trip={trip}
            members={members}
            expenses={expenses}
            calculation={calculation}
            initialMemberId={reportMemberId}
          />
        )}
      </main>

      {/* Add / Edit Expense Modal (only if not readonly) */}
      {!isReadOnly && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          members={members}
          tripId={trip.id}
          expenseToEdit={expenseToEdit}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
          onSave={handleSaveExpense}
        />
      )}

      {/* Edit Trip Modal (only if not readonly) */}
      {!isReadOnly && (
        <EditTripModal
          isOpen={isEditTripModalOpen}
          trip={trip}
          onClose={() => setIsEditTripModalOpen(false)}
          onTripUpdated={handleTripUpdated}
        />
      )}

      {/* Share Trip Modal */}
      <ShareTripModal
        isOpen={isShareModalOpen}
        trip={trip}
        onClose={() => setIsShareModalOpen(false)}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};
