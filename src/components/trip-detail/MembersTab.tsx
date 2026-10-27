import React, { useState } from 'react';
import { Member, Expense, MemberExpenseSummary } from '../../types';
import { formatINR } from '../../utils/currency';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MemberDetailModal } from './MemberDetailModal';
import {
  Users,
  Plus,
  Pencil,
  Archive,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Receipt,
  UserCheck,
  AlertCircle,
  Eye,
  Printer,
} from 'lucide-react';

export interface MembersTabProps {
  members: Member[];
  expenses: Expense[];
  memberSummaries: Record<string, MemberExpenseSummary>;
  onAddMember: (name: string) => void;
  onRenameMember: (memberId: string, newName: string) => void;
  onRemoveMember: (memberId: string) => { archived: boolean; message: string };
  onEditExpense: (expense: Expense) => void;
  onViewMemberReport?: (memberId: string) => void;
  isReadOnly?: boolean;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  expenses,
  memberSummaries,
  onAddMember,
  onRenameMember,
  onRemoveMember,
  onEditExpense,
  onViewMemberReport,
  isReadOnly = false,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [memberToRename, setMemberToRename] = useState<Member | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removalStatus, setRemovalStatus] = useState<string | null>(null);

  const [inspectingMember, setInspectingMember] = useState<Member | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const clean = newMemberName.trim();
    if (!clean) {
      setAddError('Member name cannot be blank.');
      return;
    }
    try {
      onAddMember(clean);
      setNewMemberName('');
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToRename) return;
    setRenameError(null);
    const clean = renameValue.trim();
    if (!clean) {
      setRenameError('Member name cannot be blank.');
      return;
    }
    try {
      onRenameMember(memberToRename.id, clean);
      setMemberToRename(null);
    } catch (err: unknown) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename member');
    }
  };

  const handleRemoveConfirm = () => {
    if (!memberToRemove) return;
    try {
      const res = onRemoveMember(memberToRemove.id);
      setRemovalStatus(res.message);
      setMemberToRemove(null);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Add Button */}
      <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FDE047]" />
            <h3 className="text-base sm:text-lg font-bold text-white">Trip Members ({members.length})</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            View each member's actual payments, fair share calculation, and net settlement position.
          </p>
        </div>

        {!isReadOnly && (
          <Button
            variant="cyber"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4 stroke-[3]" />}
            className="w-full sm:w-auto min-h-[40px]"
          >
            Add New Member
          </Button>
        )}
      </div>

      {removalStatus && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{removalStatus}</p>
          </div>
          <button
            type="button"
            onClick={() => setRemovalStatus(null)}
            className="text-neutral-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const summary = memberSummaries[member.id] || {
            memberId: member.id,
            name: member.name,
            isArchived: !!member.archivedAt,
            totalPaidPaise: 0,
            totalFairSharePaise: 0,
            netBalancePaise: 0,
            expensesPaidCount: 0,
            expensesBenefitedCount: 0,
            status: 'settled',
          };

          return (
            <div
              key={member.id}
              className={`glass-panel group relative rounded-2xl sm:rounded-[32px] p-4 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/40 hover:shadow-2xl min-w-0 ${
                member.archivedAt ? 'opacity-60 bg-white/5' : ''
              }`}
            >
              {/* Member Card Header */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-xl font-bold tracking-tight text-white group-hover:text-[#FDE047] transition-colors truncate">
                        {member.name}
                      </h4>
                      {member.archivedAt && (
                        <PillBadge variant="neutral" size="xs">
                          Archived
                        </PillBadge>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 block">
                      Paid for {summary.expensesPaidCount} expense(s)
                    </span>
                  </div>

                  {/* Status Pill Badge */}
                  {summary.status === 'gets_back' && (
                    <PillBadge variant="emerald" size="xs" icon={<ArrowUpRight className="w-3 h-3" />}>
                      Gets Back
                    </PillBadge>
                  )}
                  {summary.status === 'owes' && (
                    <PillBadge variant="rose" size="xs" icon={<ArrowDownLeft className="w-3 h-3" />}>
                      Owes
                    </PillBadge>
                  )}
                  {summary.status === 'settled' && (
                    <PillBadge variant="cyber" size="xs" icon={<CheckCircle2 className="w-3 h-3" />}>
                      Settled
                    </PillBadge>
                  )}
                </div>

                {/* Balance & Spending Stats */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 min-w-0">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-400 tracking-wider block truncate">
                      Spent
                    </span>
                    <span className="text-sm sm:text-lg font-black text-white truncate block">
                      {formatINR(summary.totalPaidPaise)}
                    </span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 min-w-0">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-400 tracking-wider block truncate">
                      Consumed Share
                    </span>
                    <span className="text-sm sm:text-lg font-black text-neutral-200 truncate block">
                      {formatINR(summary.totalFairSharePaise)}
                    </span>
                  </div>
                </div>

                {/* Net Balance Highlight */}
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-300">
                    Net Balance:
                  </span>
                  <span
                    className={`text-sm sm:text-base font-black truncate ${
                      summary.status === 'gets_back'
                        ? 'text-emerald-400'
                        : summary.status === 'owes'
                        ? 'text-rose-400'
                        : 'text-[#FDE047]'
                    }`}
                  >
                    {summary.status === 'gets_back' && '+'}
                    {formatINR(summary.netBalancePaise)}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {!isReadOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMemberToRename(member);
                          setRenameValue(member.name);
                        }}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Rename member"
                        aria-label="Rename member"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMemberToRemove(member)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                        title="Remove or archive member"
                        aria-label="Remove or archive member"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {onViewMemberReport && (
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => onViewMemberReport(member.id)}
                      icon={<Printer className="w-3.5 h-3.5 text-[#FDE047]" />}
                      title={`Print personal report for ${member.name}`}
                    >
                      Report
                    </Button>
                  )}

                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setInspectingMember(member)}
                    icon={<Eye className="w-3.5 h-3.5 text-neutral-300" />}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
        }}
        title="Add New Member"
        subtitle="Add a friend to this trip. Existing historical expenses will remain unchanged."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5 pt-2">
          {addError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {addError}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
              Member Name <span className="text-[#FDE047]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. David, Priya, Rahul"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="cyber" type="submit" icon={<Plus className="w-4 h-4" />}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Member Modal */}
      <Modal
        isOpen={!!memberToRename}
        onClose={() => {
          setMemberToRename(null);
          setRenameError(null);
        }}
        title={`Rename "${memberToRename?.name}"`}
        subtitle="Updating the member name preserves all historical allocations and calculations."
        maxWidth="md"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-5 pt-2">
          {renameError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {renameError}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
              New Name <span className="text-[#FDE047]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" onClick={() => setMemberToRename(null)} type="button">
              Cancel
            </Button>
            <Button variant="cyber" type="submit">
              Save Name
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove / Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title={`Remove or Archive "${memberToRemove?.name}"?`}
        message={`If ${memberToRemove?.name} has recorded expenses or received allocated shares, they will be safely archived to protect historical settlement math. If they have no expenses, they will be deleted.`}
        confirmLabel="Proceed"
        isDestructive={false}
      />

      {/* Detailed Member Inspector Modal */}
      <MemberDetailModal
        isOpen={!!inspectingMember}
        member={inspectingMember}
        summary={inspectingMember ? memberSummaries[inspectingMember.id] : null}
        allExpenses={expenses}
        allMembers={members}
        onClose={() => setInspectingMember(null)}
        onEditExpense={onEditExpense}
        onViewMemberReport={onViewMemberReport}
      />
    </div>
  );
};
