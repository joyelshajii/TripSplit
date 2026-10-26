import React from 'react';
import { Modal } from '../common/Modal';
import { PillBadge } from '../common/PillBadge';
import { Button } from '../common/Button';
import { Member, Expense, MemberExpenseSummary } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CheckCircle2,
  Sparkles,
  Printer,
} from 'lucide-react';

export interface MemberDetailModalProps {
  isOpen: boolean;
  member?: Member | null;
  summary?: MemberExpenseSummary | null;
  allExpenses: Expense[];
  allMembers: Member[];
  onClose: () => void;
  onEditExpense: (expense: Expense) => void;
  onViewMemberReport?: (memberId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  member,
  summary,
  allExpenses,
  allMembers,
  onClose,
  onEditExpense,
  onViewMemberReport,
}) => {
  if (!member || !summary) return null;

  const memberMap = new Map<string, Member>();
  allMembers.forEach((m) => memberMap.set(m.id, m));

  // Individual expenses paid by this member
  const paidExpenses = allExpenses.filter((e) => e.payerMemberId === member.id);

  // Individual expenses this member benefited from
  const benefitedExpenses = allExpenses.filter((e) =>
    e.beneficiaryMemberIds.includes(member.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.name}'s Ledger & Split Details`}
      subtitle={`Detailed direct breakdown of what ${member.name} spent, what was consumed, and direct offsets with each friend.`}
      maxWidth="3xl"
    >
      <div className="space-y-6 pt-2">
        {/* Member Financial Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-5 rounded-2xl sm:rounded-[28px] bg-white/5 border border-white/10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Total Spent
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatINR(summary.totalPaidPaise)}
            </div>
            <span className="text-[11px] text-neutral-400">
              {summary.expensesPaidCount} expense(s) paid
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Consumed Share
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatINR(summary.totalFairSharePaise)}
            </div>
            <span className="text-[11px] text-neutral-400">
              Personal share in {summary.expensesBenefitedCount} expense(s)
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Net Balance
            </span>
            <div
              className={`text-xl sm:text-2xl font-black ${
                summary.status === 'gets_back'
                  ? 'text-emerald-400'
                  : summary.status === 'owes'
                  ? 'text-rose-400'
                  : 'text-[#FDE047]'
              }`}
            >
              {summary.status === 'gets_back' && '+'}
              {formatINR(summary.netBalancePaise)}
            </div>
            <div>
              {summary.status === 'gets_back' && (
                <PillBadge variant="emerald" size="xs">
                  Gets back {formatINR(summary.netBalancePaise)}
                </PillBadge>
              )}
              {summary.status === 'owes' && (
                <PillBadge variant="rose" size="xs">
                  Owes {formatINR(Math.abs(summary.netBalancePaise))}
                </PillBadge>
              )}
              {summary.status === 'settled' && (
                <PillBadge variant="cyber" size="xs">
                  Fully Settled
                </PillBadge>
              )}
            </div>
          </div>
        </div>

        {/* Direct Friend-to-Friend Relations Section */}
        {summary.directSettlements && summary.directSettlements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FDE047]" />
              <h4 className="text-xs uppercase tracking-widest font-bold text-white">
                Direct Offsets with Each Friend
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {summary.directSettlements.map((ds, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-bold text-white">
                      With {ds.otherMemberName}:
                    </span>
                    <div>
                      {ds.direction === 'receive' && (
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {ds.otherMemberName} sends {member.name} {formatINR(ds.netAmountPaise)}
                        </span>
                      )}
                      {ds.direction === 'pay' && (
                        <span className="text-xs font-bold text-rose-400 font-mono">
                          {member.name} sends {ds.otherMemberName} {formatINR(ds.netAmountPaise)}
                        </span>
                      )}
                      {ds.direction === 'settled' && (
                        <span className="text-xs font-bold text-neutral-400">
                          Mutual debts equal (₹0.00 to send)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-neutral-400">
                    <span>
                      {ds.otherMemberName} owes {member.name}:{' '}
                      <strong className="text-white">{formatINR(ds.theyOweMePaise)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {member.name} owes {ds.otherMemberName}:{' '}
                      <strong className="text-white">{formatINR(ds.iOweThemPaise)}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Paid By Member */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#FDE047]" />
              <h4 className="text-xs uppercase tracking-widest font-bold text-white">
                Expenses Paid by {member.name} ({paidExpenses.length})
              </h4>
            </div>
            <span className="text-xs font-bold text-[#FDE047]">
              Total: {formatINR(summary.totalPaidPaise)}
            </span>
          </div>

          {paidExpenses.length === 0 ? (
            <p className="text-xs text-neutral-400 italic bg-white/5 p-4 rounded-2xl border border-white/5">
              {member.name} has not paid for any expenses yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {paidExpenses.map((exp) => {
                const beneficiaryNames = exp.beneficiaryMemberIds
                  .map((id) => memberMap.get(id)?.name || 'Unknown')
                  .join(', ');

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {exp.title}
                        </span>
                        <PillBadge variant="void" size="xs">
                          {exp.category}
                        </PillBadge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>{formatDate(exp.expenseDate)}</span>
                        <span>•</span>
                        <span className="truncate">For: {beneficiaryNames}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-[#FDE047] block">
                        {formatINR(exp.amountPaise)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditExpense(exp);
                        }}
                        className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expenses Benefited By Member */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs uppercase tracking-widest font-bold text-white">
                Consumed Share in Other Expenses ({benefitedExpenses.length})
              </h4>
            </div>
            <span className="text-xs font-bold text-white">
              Total: {formatINR(summary.totalFairSharePaise)}
            </span>
          </div>

          {benefitedExpenses.length === 0 ? (
            <p className="text-xs text-neutral-400 italic bg-white/5 p-4 rounded-2xl border border-white/5">
              {member.name} has not been included on any expenses.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {benefitedExpenses.map((exp) => {
                const payerName = memberMap.get(exp.payerMemberId)?.name || 'Unknown';
                const shareAmount = Math.floor(exp.amountPaise / exp.beneficiaryMemberIds.length);

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate">
                          {exp.title}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (Paid by {payerName}: {formatINR(exp.amountPaise)})
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {formatDate(exp.expenseDate)} • Split across {exp.beneficiaryMemberIds.length} people
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        {formatINR(shareAmount)}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Personal share
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {onViewMemberReport && (
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs text-neutral-400">
              Need a physical slip or PDF statement for {member.name}?
            </span>
            <Button
              variant="cyber"
              size="sm"
              onClick={() => {
                onClose();
                onViewMemberReport(member.id);
              }}
              icon={<Printer className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Print Personal Report
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
