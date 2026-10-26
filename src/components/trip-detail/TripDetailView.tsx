import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { Trip, Member, Expense, ExpenseCategory } from '../../types';
import { tripStorage } from '../../storage/tripStorage';
import { calculateTripBalances } from '../../engine/calculation';
import { TripHeader, TripTab } from './TripHeader';
import { OverviewTab } from './OverviewTab';
import { ExpensesTab } from './ExpensesTab';
import { MembersTab } from './MembersTab';
import { SettlementTab } from './SettlementTab';
import { ReportsTab } from './ReportsTab';
import { ExpenseModal } from './ExpenseModal';
import { EditTripModal } from '../trips/EditTripModal';

export interface TripDetailViewProps {
  tripId: string;
  onBackToTrips: () => void;
  onTripDataChanged: () => void;
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  tripId,
  onBackToTrips,
  onTripDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<TripTab>('overview');
  const [reportMemberId, setReportMemberId] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);

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

  const handleViewMemberReport = (memberId: string) => {
    setReportMemberId(memberId);
    setActiveTab('reports');
  };

  // Read current trip, members, and expenses
  const trip = tripStorage.getTrip(tripId);
  const members = tripStorage.getMembers(tripId);
  const expenses = tripStorage.getExpenses(tripId);

  // Run pure calculation engine whenever members or expenses change
  const calculation = useMemo(() => {
    return calculateTripBalances(members, expenses);
  }, [members, expenses]);

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
    if (expenseToEdit) {
      tripStorage.updateExpense(expenseToEdit.id, data);
    } else {
      tripStorage.addExpense(trip.id, data);
    }
    setExpenseToEdit(null);
    onTripDataChanged();
  };

  const handleDuplicateExpense = (expenseId: string) => {
    tripStorage.duplicateExpense(expenseId);
    onTripDataChanged();
  };

  const handleDeleteExpense = (expenseId: string) => {
    tripStorage.deleteExpense(expenseId);
    onTripDataChanged();
  };

  const handleAddMember = (name: string) => {
    tripStorage.addMember(trip.id, name);
    onTripDataChanged();
  };

  const handleRenameMember = (memberId: string, newName: string) => {
    tripStorage.renameMember(memberId, newName);
    onTripDataChanged();
  };

  const handleRemoveMember = (memberId: string) => {
    const res = tripStorage.safeRemoveMember(memberId);
    onTripDataChanged();
    return res;
  };

  const handleConfirmSettlement = () => {
    tripStorage.confirmSettlement(trip.id, calculation);
    onTripDataChanged();
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
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onEditTrip={() => setIsEditTripModalOpen(true)}
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
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToSettlement={() => setActiveTab('settlement')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            members={members}
            onAddExpense={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setExpenseToEdit(exp);
              setIsExpenseModalOpen(true);
            }}
            onDuplicateExpense={handleDuplicateExpense}
            onDeleteExpense={handleDeleteExpense}
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
              setExpenseToEdit(exp);
              setIsExpenseModalOpen(true);
            }}
            onViewMemberReport={handleViewMemberReport}
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

      {/* Add / Edit Expense Modal */}
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

      {/* Edit Trip Modal */}
      <EditTripModal
        isOpen={isEditTripModalOpen}
        trip={trip}
        onClose={() => setIsEditTripModalOpen(false)}
        onTripUpdated={() => onTripDataChanged()}
      />
    </div>
  );
};
