export const DEFAULT_EXPENSE_CATEGORIES = [
  'Transport',
  'Fuel',
  'Food',
  'Accommodation',
  'Tickets and activities',
  'Shopping',
  'Groceries',
  'Other',
] as const;

export type DefaultExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];

export type ExpenseCategory = DefaultExpenseCategory | string;

export const EXPENSE_CATEGORIES: string[] = [...DEFAULT_EXPENSE_CATEGORIES];

export interface Member {
  id: string;
  tripId: string;
  name: string;
  createdAt: string;
  archivedAt?: string | null;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amountPaise: number; // Stored in integer paise (e.g. ₹100.50 = 10050)
  payerMemberId: string;
  beneficiaryMemberIds: string[];
  description?: string;
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface SettlementTransfer {
  fromMemberId: string; // Person who sends money
  toMemberId: string;   // Person who receives money
  amountPaise: number;  // Net amount after subtracting mutual debts
  explanation: string;
  fromOwesToPaise?: number; // Gross amount 'from' owed 'to' before offset
  toOwesFromPaise?: number; // Gross amount 'to' owed 'from' before offset
}

export interface PairwiseDebt {
  memberAId: string;
  memberAName: string;
  memberBId: string;
  memberBName: string;
  aOwesBPaise: number;      // What A owes B for B's expenses
  bOwesAPaise: number;      // What B owes A for A's expenses
  netSenderId: string | null;
  netReceiverId: string | null;
  netAmountPaise: number;   // Difference between the two
  explanation: string;
}

export interface DirectFriendSettlement {
  otherMemberId: string;
  otherMemberName: string;
  theyOweMePaise: number;   // What the other friend owes this member
  iOweThemPaise: number;    // What this member owes the other friend
  netAmountPaise: number;   // Net difference
  direction: 'receive' | 'pay' | 'settled';
  explanation: string;
}

export interface TripConfirmationRecord {
  revision: number;
  confirmedAt: string; // ISO date string
  expenseCount: number;
  totalPaise: number;
  transfers: SettlementTransfer[];
}

export interface Trip {
  id: string;
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  revision: number;
  lastConfirmedRevision?: number | null;
  confirmationHistory: TripConfirmationRecord[];
}

export interface MemberExpenseSummary {
  memberId: string;
  name: string;
  isArchived: boolean;
  totalPaidPaise: number;       // Total amount spent out of pocket
  totalFairSharePaise: number;  // Total share of trip expenses consumed
  netBalancePaise: number;      // positive = gets back, negative = owes, 0 = settled
  expensesPaidCount: number;
  expensesBenefitedCount: number;
  status: 'gets_back' | 'owes' | 'settled';
  directSettlements: DirectFriendSettlement[];
}

export interface BeneficiaryShare {
  memberId: string;
  sharePaise: number;
}

export interface ExpenseShareDetail {
  expenseId: string;
  title: string;
  totalPaise: number;
  payerMemberId: string;
  beneficiaryShares: BeneficiaryShare[];
  remainderPaise: number;
  baseSharePaise: number;
  explanation: string;
}

export interface TripCalculationResult {
  tripId: string;
  totalTripPaise: number;
  memberSummaries: Record<string, MemberExpenseSummary>;
  expenseShares: Record<string, ExpenseShareDetail>;
  settlementTransfers: SettlementTransfer[];
  pairwiseDebts: PairwiseDebt[];
  isFullySettled: boolean;
  totalDebtPaise: number;
  validation: {
    isValid: boolean;
    sumPaidPaise: number;
    sumFairSharePaise: number;
    sumNetBalancePaise: number; // Must be strictly 0
    errors: string[];
  };
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  trips: Trip[];
  members: Member[];
  expenses: Expense[];
}
