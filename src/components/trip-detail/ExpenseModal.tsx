import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Member, Expense, ExpenseCategory } from '../../types';
import { rupeesToPaise, paiseToRupees, formatINR } from '../../utils/currency';
import { calculateBeneficiaryShares } from '../../engine/calculation';
import { tripStorage } from '../../storage/tripStorage';
import { ManageCategoriesModal } from '../common/ManageCategoriesModal';
import {
  Receipt,
  Users,
  Check,
  Calendar,
  Tag,
  FileText,
  UserCheck,
  AlertCircle,
  Sparkles,
  Plus,
} from 'lucide-react';

export interface ExpenseModalProps {
  isOpen: boolean;
  members: Member[];
  tripId: string;
  expenseToEdit?: Expense | null;
  onClose: () => void;
  onSave: (expenseData: {
    title: string;
    amountPaise: number;
    payerMemberId: string;
    beneficiaryMemberIds: string[];
    category: ExpenseCategory;
    expenseDate: string;
    description?: string;
  }) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  members,
  expenseToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState<string>('');
  const [payerMemberId, setPayerMemberId] = useState<string>('');
  const [beneficiaryMemberIds, setBeneficiaryMemberIds] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');
  const [otherCategoryName, setOtherCategoryName] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [availableCategories, setAvailableCategories] = useState<string[]>(
    tripStorage.getCategories()
  );
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  // Initialize form when opening or editing
  useEffect(() => {
    const cats = tripStorage.getCategories();
    setAvailableCategories(cats);

    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmountRupees(paiseToRupees(expenseToEdit.amountPaise).toString());
      setPayerMemberId(expenseToEdit.payerMemberId);
      setBeneficiaryMemberIds(expenseToEdit.beneficiaryMemberIds);

      const editCat =
        (expenseToEdit.category as string) === 'Petrol'
          ? 'Fuel'
          : expenseToEdit.category;

      if (cats.includes(editCat)) {
        setCategory(editCat);
        setOtherCategoryName('');
      } else {
        // Ensure custom category is known
        tripStorage.addCategory(editCat);
        setAvailableCategories(tripStorage.getCategories());
        setCategory(editCat);
        setOtherCategoryName('');
      }

      setExpenseDate(expenseToEdit.expenseDate);
      setDescription(expenseToEdit.description || '');
      setError(null);
    } else {
      setTitle('');
      setAmountRupees('');
      setPayerMemberId('');
      setBeneficiaryMemberIds([]);
      setCategory(''); // NOT prefilled
      setOtherCategoryName('');
      setExpenseDate(''); // NOT prefilled
      setDescription('');
      setError(null);
    }
  }, [expenseToEdit, isOpen, members]);

  const activeMembers = useMemo(
    () => members.filter((m) => !m.archivedAt || beneficiaryMemberIds.includes(m.id)),
    [members, beneficiaryMemberIds]
  );

  const isEveryoneSelected =
    activeMembers.length > 0 &&
    activeMembers.every((m) => beneficiaryMemberIds.includes(m.id));

  const handleToggleEveryone = () => {
    if (isEveryoneSelected) {
      setBeneficiaryMemberIds([]);
    } else {
      setBeneficiaryMemberIds(activeMembers.map((m) => m.id));
    }
  };

  const handleToggleBeneficiary = (memberId: string) => {
    if (beneficiaryMemberIds.includes(memberId)) {
      setBeneficiaryMemberIds(beneficiaryMemberIds.filter((id) => id !== memberId));
    } else {
      setBeneficiaryMemberIds([...beneficiaryMemberIds, memberId]);
    }
  };

  // Live calculation preview
  const currentPaise = rupeesToPaise(amountRupees || '0');
  const preview = useMemo(() => {
    if (currentPaise <= 0 || beneficiaryMemberIds.length === 0) {
      return null;
    }
    return calculateBeneficiaryShares(currentPaise, beneficiaryMemberIds);
  }, [currentPaise, beneficiaryMemberIds]);

  const payerName = members.find((m) => m.id === payerMemberId)?.name || 'Unknown';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide an expense title.');
      return;
    }

    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (!payerMemberId) {
      setError('Please select who paid this expense.');
      return;
    }

    if (!category.trim()) {
      setError('Please select an expense category.');
      return;
    }

    let finalCategory = category.trim();
    if (category === 'Other') {
      const cleanOther = otherCategoryName.trim();
      if (!cleanOther) {
        setError('Please mention the category type name for "Other".');
        return;
      }
      finalCategory = cleanOther;
      tripStorage.addCategory(cleanOther);
    }

    if (!expenseDate.trim()) {
      setError('Please select an expense date.');
      return;
    }

    if (beneficiaryMemberIds.length === 0) {
      setError('Please select at least one beneficiary who benefits from this expense.');
      return;
    }

    onSave({
      title: cleanTitle,
      amountPaise: paise,
      payerMemberId,
      beneficiaryMemberIds,
      category: finalCategory,
      expenseDate: expenseDate.trim(),
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
        subtitle={
          expenseToEdit
            ? 'Modify expense details and recipient beneficiaries.'
            : 'Record who paid and select which friends benefited from the expense.'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Expense Title & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#FDE047]" />
                <span>
                  Expense Title <span className="text-[#FDE047]">*</span>
                </span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shell Fuel, Seafood Dinner, Entry Tickets"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
                Amount (₹) <span className="text-[#FDE047]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="1000.00"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full bg-[#1F1F1F] text-white text-base font-bold rounded-2xl pl-9 pr-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Payer, Category & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#FDE047]" />
                <span>
                  Who Paid? <span className="text-[#FDE047]">*</span>
                </span>
              </label>
              <select
                required
                value={payerMemberId}
                onChange={(e) => setPayerMemberId(e.target.value)}
                className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors cursor-pointer"
              >
                <option value="" disabled className="bg-[#171717] text-neutral-400">
                  -- Select who paid --
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#171717] text-white">
                    {m.name} {m.archivedAt ? '(Archived)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FDE047]" />
                  <span>
                    Category <span className="text-[#FDE047]">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsManageCategoriesOpen(true)}
                  className="text-[11px] text-[#FDE047] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                  title="Add or manage categories"
                >
                  <Plus className="w-3 h-3" /> Manage
                </button>
              </div>
              <select
                required
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__manage__') {
                    setIsManageCategoriesOpen(true);
                  } else {
                    setCategory(val);
                  }
                }}
                className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors cursor-pointer"
              >
                <option value="" disabled className="bg-[#171717] text-neutral-400">
                  -- Select Category --
                </option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#171717] text-white">
                    {cat}
                  </option>
                ))}
                <option value="__manage__" className="bg-[#262626] text-[#FDE047] font-bold">
                  + Manage / Add Categories...
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FDE047]" />
                <span>
                  Expense Date <span className="text-[#FDE047]">*</span>
                </span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors cursor-pointer"
              />
            </div>

            {/* When 'Other' is selected, mention category type name */}
            {category === 'Other' && (
              <div className="sm:col-span-3 pt-1 space-y-1.5 animate-fadeIn">
                <label className="block text-xs uppercase tracking-widest font-bold text-[#FDE047] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    Mention Category Type Name <span className="text-rose-400">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={otherCategoryName}
                  onChange={(e) => setOtherCategoryName(e.target.value)}
                  placeholder="e.g. Scuba Diving, Boat Rental, Toll Tax, Souvenirs..."
                  className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-[#FDE047]/40 focus:outline-none focus:border-[#FDE047] transition-colors shadow-inner"
                />
                <p className="text-[11px] text-neutral-400">
                  Specify what type of expense this is. It will be recorded and saved.
                </p>
              </div>
            )}
          </div>

          {/* BENEFICIARY SELECTION */}
          <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FDE047]" />
                  <span className="text-xs uppercase tracking-widest font-bold text-white">
                    Who Was This Expense For? (Beneficiaries){' '}
                    <span className="text-[#FDE047]">*</span>
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Pick only the friends who benefited from this spending.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleEveryone}
                className="text-xs text-[#FDE047] hover:underline font-bold self-start sm:self-auto cursor-pointer"
              >
                {isEveryoneSelected ? 'Deselect All' : 'Select Everyone'}
              </button>
            </div>

            {/* Beneficiaries Selection Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {activeMembers.map((member) => {
                const isSelected = beneficiaryMemberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleToggleBeneficiary(member.id)}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-[#FDE047]/10 border-[#FDE047] text-white'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate mr-2">
                      {member.name} {member.id === payerMemberId ? '(Payer)' : ''}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'bg-[#FDE047] border-[#FDE047] text-black'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* LIVE CALCULATION PREVIEW */}
            {preview && (
              <div className="mt-3 p-3.5 rounded-2xl bg-[#0A0A0A] border border-[#FDE047]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <Sparkles className="w-4 h-4 text-[#FDE047] shrink-0" />
                  <span>
                    Each of the <strong>{beneficiaryMemberIds.length}</strong> selected person(s) owes{' '}
                    <strong>{payerName}</strong>:
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-sm font-bold font-mono text-[#FDE047]">
                    {formatINR(preview.baseShare)}
                  </span>
                  {preview.remainder > 0 && (
                    <span className="text-[10px] text-neutral-400 block">
                      (+1p distributed across {preview.remainder} members for exact balance)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional Note / Description */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>Note / Description (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI, bill attached, includes toll"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <Button variant="glass" size="sm" type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="cyber" size="sm" type="submit" className="w-full sm:w-auto">
              {expenseToEdit ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => {
          setIsManageCategoriesOpen(false);
          setAvailableCategories(tripStorage.getCategories());
        }}
        onCategorySelected={(newCat) => {
          setAvailableCategories(tripStorage.getCategories());
          setCategory(newCat);
        }}
      />
    </>
  );
};
