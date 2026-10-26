import React, { useState } from 'react';
import { Expense, Member, ExpenseCategory } from '../../types';
import { tripStorage } from '../../storage/tripStorage';
import { ManageCategoriesModal } from '../common/ManageCategoriesModal';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Receipt,
  Search,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Calendar,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';

export interface ExpensesTabProps {
  expenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDuplicateExpense: (expenseId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  members,
  onAddExpense,
  onEditExpense,
  onDuplicateExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayer, setSelectedPayer] = useState<string>('all');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    tripStorage.getCategories()
  );

  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const filteredExpenses = expenses.filter((exp) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = exp.title.toLowerCase().includes(q);
      const matchesDesc = exp.description?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
      return false;
    }

    // Payer filter
    if (selectedPayer !== 'all' && exp.payerMemberId !== selectedPayer) {
      return false;
    }

    return true;
  });

  const totalFilteredPaise = filteredExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

  const handleDeleteConfirm = () => {
    if (!expenseToDelete) return;
    onDeleteExpense(expenseToDelete.id);
    setExpenseToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="glass-panel rounded-2xl sm:rounded-[32px] p-3.5 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 text-white text-xs sm:text-sm rounded-full pl-11 pr-4 py-2.5 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          {/* Filters & Add Expense */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-white/5 text-white text-xs rounded-full px-3 sm:px-4 py-2 sm:py-2.5 min-h-[38px] border border-white/15 focus:outline-none focus:border-[#FDE047] cursor-pointer"
            >
              <option value="all" className="bg-[#171717] text-white">
                All Categories
              </option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#171717] text-white">
                  {cat}
                </option>
              ))}
            </select>

            {/* Manage Categories Button */}
            <button
              type="button"
              onClick={() => setIsManageCategoriesOpen(true)}
              className="w-full sm:w-auto px-3 sm:px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white border border-white/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
              title="Add or manage categories"
            >
              <Tag className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>Categories</span>
            </button>

            {/* Payer filter */}
            <select
              value={selectedPayer}
              onChange={(e) => setSelectedPayer(e.target.value)}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto bg-white/5 text-white text-xs rounded-full px-3 sm:px-4 py-2 sm:py-2.5 min-h-[38px] border border-white/15 focus:outline-none focus:border-[#FDE047] cursor-pointer"
            >
              <option value="all" className="bg-[#171717] text-white">
                All Payers
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#171717] text-white">
                  Paid by {m.name}
                </option>
              ))}
            </select>

            <Button
              variant="cyber"
              size="sm"
              onClick={onAddExpense}
              icon={<Plus className="w-4 h-4 stroke-[3]" />}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto min-h-[38px]"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Filter Stats */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 text-xs text-neutral-400 pt-2 border-t border-white/10 px-1">
          <span>
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </span>
          <span className="font-bold text-white">
            Subtotal: <span className="text-[#FDE047]">{formatINR(totalFilteredPaise)}</span>
          </span>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-panel rounded-[32px] p-12 text-center space-y-4 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-yellow-300">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-white">No Expenses Recorded</h3>
            <p className="text-xs text-neutral-400">
              {searchQuery || selectedCategory !== 'all' || selectedPayer !== 'all'
                ? 'No expenses match the selected filters. Try resetting your search.'
                : 'Start adding expenses like fuel, meals, or hotel stays to compute fair shares.'}
            </p>
          </div>
          <Button variant="cyber" size="sm" onClick={onAddExpense} icon={<Plus className="w-4 h-4" />}>
            Record First Expense
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((exp) => {
            const payer = memberMap.get(exp.payerMemberId);
            const payerName = payer ? payer.name : 'Unknown';
            const beneficiaries = exp.beneficiaryMemberIds
              .map((id) => memberMap.get(id)?.name || 'Unknown')
              .filter(Boolean);

            const isExpanded = expandedExpenseId === exp.id;
            const sharePerPerson = Math.floor(exp.amountPaise / exp.beneficiaryMemberIds.length);
            const remainder = exp.amountPaise % exp.beneficiaryMemberIds.length;

            return (
              <div
                key={exp.id}
                className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-6 transition-all duration-200 hover:border-white/30 space-y-3 min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Left: Title, Date, Category */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-white truncate break-words">
                        {exp.title}
                      </h4>
                      <PillBadge variant="glass" size="xs">
                        {exp.category}
                      </PillBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{formatDate(exp.expenseDate)}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-white font-medium">
                        <User className="w-3.5 h-3.5 text-[#FDE047] shrink-0" />
                        <span className="truncate">Paid by {payerName}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>
                          {exp.beneficiaryMemberIds.length === members.length
                            ? 'Everyone (All members)'
                            : `${exp.beneficiaryMemberIds.length} Beneficiaries`}
                        </span>
                      </div>
                    </div>

                    {exp.description && (
                      <p className="text-xs text-neutral-400 pt-1 line-clamp-2 break-words">
                        {exp.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Amount & Action buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-lg sm:text-2xl font-black text-[#FDE047] block leading-none">
                        {formatINR(exp.amountPaise)}
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mt-1">
                        ~{formatINR(sharePerPerson)} / person
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="View split breakdown"
                        aria-label="View split breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Edit expense"
                        aria-label="Edit expense"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateExpense(exp.id)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Duplicate expense"
                        aria-label="Duplicate expense"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                        title="Delete expense"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Breakdown details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-white/10 text-xs space-y-2 animate-in fade-in duration-200">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                      Beneficiary Allocation Breakdown:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {beneficiaries.map((name, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-200 flex items-center gap-2"
                        >
                          <span className="font-semibold">{name}:</span>
                          <span className="text-[#FDE047] font-bold">
                            {formatINR(sharePerPerson + (i < remainder ? 1 : 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                    {remainder > 0 && (
                      <p className="text-[10px] text-neutral-500 italic">
                        * Includes {remainder} paise remainder distributed deterministically to ensure zero rounding error.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Expense Dialog */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${expenseToDelete?.title}"?`}
        message={`Are you sure you want to delete this expense of ${
          expenseToDelete ? formatINR(expenseToDelete.amountPaise) : ''
        }? Deleting it will immediately recalculate all member balances and settlement transfers.`}
        confirmLabel="Delete Expense"
        isDestructive={true}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => {
          setIsManageCategoriesOpen(false);
          setAvailableCategories(tripStorage.getCategories());
        }}
      />
    </div>
  );
};
