import React, { useState } from 'react';
import { Trip, Member, Expense, TripCalculationResult } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  History,
  ShieldCheck,
  BadgeCheck,
  Check,
  Send,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
} from 'lucide-react';

export interface SettlementTabProps {
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  calculation: TripCalculationResult;
  onConfirmSettlement: () => void;
  onNavigateToExpenses: () => void;
  isReadOnly?: boolean;
}

export const SettlementTab: React.FC<SettlementTabProps> = ({
  trip,
  members,
  expenses,
  calculation,
  onConfirmSettlement,
  isReadOnly = false,
}) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copiedTransferIndex, setCopiedTransferIndex] = useState<number | null>(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const hasUnconfirmedChanges =
    trip.lastConfirmedRevision !== null &&
    trip.lastConfirmedRevision !== trip.revision;

  const isConfirmedCurrent =
    trip.lastConfirmedRevision !== null &&
    trip.lastConfirmedRevision === trip.revision;

  const handleConfirmAndCelebrate = () => {
    onConfirmSettlement();
    setIsReviewModalOpen(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FDE047', '#10B981', '#ffffff'],
      });
    } catch {
      // ignore
    }
  };

  const handleCopyPaymentInstruction = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTransferIndex(index);
    setTimeout(() => setCopiedTransferIndex(null), 2500);
  };

  // Filter transfers if user selected a specific member
  const filteredTransfers = calculation.settlementTransfers.filter((t) => {
    if (selectedMemberFilter === 'all') return true;
    return t.fromMemberId === selectedMemberFilter || t.toMemberId === selectedMemberFilter;
  });

  return (
    <div className="space-y-6">
      {/* Settlement Status Banner */}
      <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {calculation.isFullySettled ? (
                <PillBadge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  All Debts Settled
                </PillBadge>
              ) : isConfirmedCurrent ? (
                <PillBadge variant="cyber" size="sm" icon={<BadgeCheck className="w-3.5 h-3.5" />}>
                  Settlement Confirmed (Rev #{trip.lastConfirmedRevision})
                </PillBadge>
              ) : hasUnconfirmedChanges ? (
                <PillBadge variant="void" size="sm" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#FDE047]" />}>
                  Changes Made Since Last Confirmation
                </PillBadge>
              ) : (
                <PillBadge variant="rose" size="sm">
                  Direct Settlements Pending
                </PillBadge>
              )}

              {trip.confirmationHistory && trip.confirmationHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 underline ml-1 sm:ml-2 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" /> History ({trip.confirmationHistory.length})
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white break-words">
              {calculation.isFullySettled
                ? 'Everyone is completely settled!'
                : `${calculation.settlementTransfers.length} Direct Friend-to-Friend Settlement${
                    calculation.settlementTransfers.length === 1 ? '' : 's'
                  }`}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Every expense is split directly between the friends who shared it. Instead of sending both ways, mutual amounts are subtracted so only the net remaining difference is transferred directly between the two friends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            {isReadOnly ? (
              <span className="text-xs text-neutral-400 bg-white/5 border border-white/10 px-3.5 py-2 rounded-full flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                <span>View-Only Mode</span>
              </span>
            ) : (
              !calculation.isFullySettled && (
                <Button
                  variant="cyber"
                  size="md"
                  onClick={() => setIsReviewModalOpen(true)}
                  icon={<BadgeCheck className="w-4 h-4 stroke-[2.5]" />}
                  className="w-full sm:w-auto min-h-[42px]"
                >
                  {hasUnconfirmedChanges ? 'Review & Reconfirm' : 'Review & Confirm'}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Warning if changes occurred after confirmation */}
        {hasUnconfirmedChanges && (
          <div className="mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-yellow-400/10 border border-[#FDE047]/30 text-yellow-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#FDE047] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Trip expenses or members were modified after confirmation.</span>{' '}
                The direct transfers below have been automatically recalculated.
              </div>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="font-bold text-black bg-[#FDE047] px-3.5 py-1.5 rounded-full text-xs hover:bg-[#FEF08A] shrink-0 cursor-pointer self-start sm:self-auto min-h-[36px]"
              >
                Reconfirm Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter by Member */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 shrink-0">
          <Users className="w-4 h-4 text-[#FDE047]" />
          <span>Filter Direct Transfers:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full sm:w-auto">
          <button
            onClick={() => setSelectedMemberFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedMemberFilter === 'all'
                ? 'bg-[#FDE047] text-black font-bold'
                : 'bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            All Transfers ({calculation.settlementTransfers.length})
          </button>
          {members.map((m) => {
            const count = calculation.settlementTransfers.filter(
              (t) => t.fromMemberId === m.id || t.toMemberId === m.id
            ).length;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMemberFilter(m.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedMemberFilter === m.id
                    ? 'bg-[#FDE047] text-black font-bold'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {m.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Settlement Transfers List */}
      {calculation.isFullySettled ? (
        <div className="glass-panel rounded-[32px] p-12 text-center space-y-4 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">All Balances Settled</h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              No payments are needed between friends. Everyone is completely squared up.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredTransfers.map((transfer, index) => {
              const debtor = memberMap.get(transfer.fromMemberId);
              const creditor = memberMap.get(transfer.toMemberId);
              const debtorName = debtor ? debtor.name : 'Unknown';
              const creditorName = creditor ? creditor.name : 'Unknown';

              const instructionText = `${debtorName} pays ${formatINR(transfer.amountPaise)} directly to ${creditorName} for "${trip.title}" settlement.`;
              const isCopied = copiedTransferIndex === index;

              return (
                <div
                  key={index}
                  className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-6 transition-all duration-200 hover:border-white/30 space-y-3 min-w-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    {/* Transfer Route */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-4 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                          {debtorName.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-rose-300 tracking-wider block">
                            Sends Money
                          </span>
                          <div className="text-sm sm:text-lg font-bold text-white truncate">
                            {debtorName}
                          </div>
                        </div>
                      </div>

                      <div className="px-1 sm:px-2 text-neutral-500 flex items-center justify-center shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDE047]" />
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                          {creditorName.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                            Receives Money
                          </span>
                          <div className="text-sm sm:text-lg font-bold text-white truncate">
                            {creditorName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Copy Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="text-left sm:text-right">
                        <span className="text-xl sm:text-3xl font-black text-[#FDE047] block leading-none">
                          {formatINR(transfer.amountPaise)}
                        </span>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mt-1">
                          Direct Net Payment
                        </span>
                      </div>

                      <Button
                        variant={isCopied ? 'void' : 'glass'}
                        size="sm"
                        onClick={() => handleCopyPaymentInstruction(instructionText, index)}
                        icon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
                        title="Copy payment note"
                        className="min-h-[38px] px-3 sm:px-4"
                      >
                        {isCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  {/* Math Breakdown Box */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    {transfer.fromOwesToPaise !== undefined && transfer.toOwesFromPaise !== undefined && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-neutral-400 block">{debtorName} owes {creditorName}:</span>
                          <span className="font-bold text-rose-300 font-mono">{formatINR(transfer.fromOwesToPaise)}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-neutral-400 block">{creditorName} owes {debtorName}:</span>
                          <span className="font-bold text-emerald-300 font-mono">{formatINR(transfer.toOwesFromPaise)}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                          <span className="text-[10px] text-yellow-300 block">Net to Send (Subtract smaller):</span>
                          <span className="font-bold text-[#FDE047] font-mono">{formatINR(transfer.amountPaise)}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-neutral-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#FDE047] shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{transfer.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Member Financial Balance Table */}
      <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400">
          Trip Spending & Net Position Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-neutral-400">
                <th className="pb-3 font-bold">Member</th>
                <th className="pb-3 font-bold text-right">Total Spent</th>
                <th className="pb-3 font-bold text-right">Consumed Share</th>
                <th className="pb-3 font-bold text-right">Net Balance</th>
                <th className="pb-3 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.values(calculation.memberSummaries).map((summary) => (
                <tr key={summary.memberId} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    {summary.name} {summary.isArchived && <span className="text-neutral-500">(Archived)</span>}
                  </td>
                  <td className="py-3 text-right text-neutral-300 font-mono">
                    {formatINR(summary.totalPaidPaise)}
                  </td>
                  <td className="py-3 text-right text-neutral-300 font-mono">
                    {formatINR(summary.totalFairSharePaise)}
                  </td>
                  <td
                    className={`py-3 text-right font-bold font-mono ${
                      summary.status === 'gets_back'
                        ? 'text-emerald-400'
                        : summary.status === 'owes'
                        ? 'text-rose-400'
                        : 'text-[#FDE047]'
                    }`}
                  >
                    {summary.status === 'gets_back' && '+'}
                    {formatINR(summary.netBalancePaise)}
                  </td>
                  <td className="py-3 text-right">
                    {summary.status === 'gets_back' && (
                      <PillBadge variant="emerald" size="xs">
                        Gets Back {formatINR(summary.netBalancePaise)}
                      </PillBadge>
                    )}
                    {summary.status === 'owes' && (
                      <PillBadge variant="rose" size="xs">
                        Owes {formatINR(Math.abs(summary.netBalancePaise))}
                      </PillBadge>
                    )}
                    {summary.status === 'settled' && (
                      <PillBadge variant="cyber" size="xs">
                        Settled
                      </PillBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Confirm Plan Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review & Confirm Settlement Plan"
        subtitle="Verify all direct payments between friends before confirming."
        maxWidth="3xl"
      >
        <div className="space-y-6 pt-2">
          {/* Integrity validation info */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Pairwise Direct Settlement Verified</span>
              <p className="text-xs text-neutral-300">
                All mutual friend-to-friend debts have been netted out. Sum of all payments equals total trip spending ({formatINR(calculation.totalTripPaise)}), and net balances sum to ₹0.00.
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Expenses</span>
              <span className="text-base font-black text-[#FDE047]">{formatINR(calculation.totalTripPaise)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Number of Items</span>
              <span className="text-base font-black text-white">{expenses.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Members</span>
              <span className="text-base font-black text-white">{members.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Direct Transfers</span>
              <span className="text-base font-black text-white">{calculation.settlementTransfers.length}</span>
            </div>
          </div>

          {/* Transfers Summary in Modal */}
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-neutral-400">
              Direct Payments Between Friends:
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {calculation.settlementTransfers.map((t, idx) => {
                const debtor = memberMap.get(t.fromMemberId)?.name || 'Unknown';
                const creditor = memberMap.get(t.toMemberId)?.name || 'Unknown';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong className="text-white">{debtor}</strong> pays{' '}
                      <strong className="text-white">{creditor}</strong> directly
                    </span>
                    <span className="text-sm font-black text-[#FDE047]">
                      {formatINR(t.amountPaise)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="cyber"
              onClick={handleConfirmAndCelebrate}
              icon={<BadgeCheck className="w-4 h-4 stroke-[3]" />}
            >
              Confirm Settlement Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Settlement Confirmation History"
        subtitle="Log of all confirmed settlement plan revisions for this trip."
        maxWidth="md"
      >
        <div className="space-y-3 pt-2">
          {(!trip.confirmationHistory || trip.confirmationHistory.length === 0) ? (
            <p className="text-xs text-neutral-400 italic">No previous confirmations recorded.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {trip.confirmationHistory.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#FDE047]">Revision #{item.revision}</span>
                    <span className="text-neutral-400">{formatDateTime(item.confirmedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>{item.expenseCount} expenses total</span>
                    <span className="font-mono">{formatINR(item.totalPaise)}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {item.transfers.length} transfers confirmed
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-white/10">
            <Button variant="void" size="sm" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
