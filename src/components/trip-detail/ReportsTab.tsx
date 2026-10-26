import React, { useState, useEffect } from 'react';
import { Trip, Member, Expense, TripCalculationResult } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, formatDateTime } from '../../utils/date';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import {
  Printer,
  FileText,
  User,
  Calendar,
  MapPin,
  Users,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Eye,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
} from 'lucide-react';

export interface ReportsTabProps {
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  calculation: TripCalculationResult;
  initialMemberId?: string | null;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  trip,
  members,
  expenses,
  calculation,
  initialMemberId,
}) => {
  const [reportType, setReportType] = useState<'group' | 'individual'>(
    initialMemberId ? 'individual' : 'group'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || members[0]?.id || ''
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const reportDate = formatDateTime(new Date().toISOString());

  // Update selection if parent passes a new initialMemberId
  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
      setReportType('individual');
    }
  }, [initialMemberId]);

  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const selectedMember = memberMap.get(selectedMemberId) || members[0];
  const selectedMemberSummary = selectedMember
    ? calculation.memberSummaries[selectedMember.id]
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {reportType === 'group' ? (
                <FileText className="w-5 h-5 text-[#FDE047] shrink-0" />
              ) : (
                <User className="w-5 h-5 text-[#FDE047] shrink-0" />
              )}
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {reportType === 'group'
                  ? 'Printable Full Trip Settlement Report'
                  : `Individual Settlement Report: ${selectedMember?.name || 'Member'}`}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {reportType === 'group'
                ? 'Complete formal A4 settlement ledger including expense receipts, member positions, direct mutual debt netting, and payment instructions.'
                : `Personalized A4 settlement slip for ${selectedMember?.name || 'this member'} showing what to send, what to get, and personal totals.`}
            </p>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              variant="glass"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              icon={<Eye className="w-4 h-4" />}
              className="w-full sm:w-auto min-h-[38px]"
            >
              {isPreviewMode ? 'Exit Preview' : 'Print Preview'}
            </Button>

            <Button
              variant="cyber"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
              className="w-full sm:w-auto min-h-[38px]"
            >
              {reportType === 'group'
                ? 'Print Group Report'
                : `Print ${selectedMember?.name || 'Personal'} Report`}
            </Button>
          </div>
        </div>

        {/* Report Type Selector & Member Quick Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center p-1 rounded-2xl sm:rounded-full bg-white/5 border border-white/10 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setReportType('group')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                reportType === 'group'
                  ? 'bg-[#FDE047] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Group Report</span>
            </button>
            <button
              type="button"
              onClick={() => setReportType('individual')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                reportType === 'individual'
                  ? 'bg-[#FDE047] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Individual Friend Report</span>
            </button>
          </div>

          {reportType === 'individual' && (
            <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth py-1 w-full sm:w-auto max-w-full gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1 shrink-0">
                Select Friend:
              </span>
              {members.map((m) => {
                const s = calculation.memberSummaries[m.id];
                const isSelected = m.id === selectedMemberId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#FDE047] text-black shadow-md scale-105'
                        : 'bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <span>{m.name}</span>
                    {s && (
                      <span className="text-[10px] opacity-80 font-mono">
                        ({s.status === 'gets_back' ? '+' : s.status === 'owes' ? '-' : ''}
                        {formatINR(Math.abs(s.netBalancePaise))})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FULL GROUP REPORT CONTAINER                                            */}
      {/* ========================================================================= */}
      {reportType === 'group' && (
        <div
          className={`bg-white text-slate-900 rounded-2xl sm:rounded-[28px] p-4 sm:p-10 md:p-12 shadow-2xl transition-all print-report-container min-w-0 ${
            isPreviewMode ? 'ring-4 ring-[#FDE047]' : ''
          }`}
        >
          {/* SECTION A: TRIP INFORMATION */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Official Group Settlement Statement
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {trip.title}
                </h1>
                {trip.destination && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trip.destination}</span>
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right space-y-1 text-xs text-slate-600">
                <div>
                  <strong>Generated On:</strong> {reportDate}
                </div>
                {(trip.startDate || trip.endDate) && (
                  <div>
                    <strong>Trip Dates:</strong> {formatDate(trip.startDate)} —{' '}
                    {formatDate(trip.endDate)}
                  </div>
                )}
                <div>
                  <strong>Settlement Status:</strong>{' '}
                  <span className="font-bold text-slate-900">
                    {calculation.isFullySettled
                      ? 'Fully Settled'
                      : trip.lastConfirmedRevision
                      ? `Confirmed (Rev #${trip.lastConfirmedRevision})`
                      : 'Unconfirmed Proposal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Trip Members ({members.length}):</span>
              {members.map((m) => (
                <span
                  key={m.id}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium"
                >
                  {m.name} {m.archivedAt ? '(Archived)' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* SECTION B: OVERALL FINANCIAL SUMMARY */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Section B: Overall Financial Summary
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Total Spending
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatINR(calculation.totalTripPaise)}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Expenses Logged
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {expenses.length}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Members</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {members.length}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Transfers Needed
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {calculation.settlementTransfers.length}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Amount To Settle
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  {formatINR(calculation.totalDebtPaise)}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: DETAILED EXPENSE LEDGER */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Section C: Detailed Expense Ledger
            </h2>

            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No expenses recorded for this trip.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5 border-b border-slate-300">#</th>
                      <th className="p-2.5 border-b border-slate-300">Title & Category</th>
                      <th className="p-2.5 border-b border-slate-300">Date</th>
                      <th className="p-2.5 border-b border-slate-300">Paid By</th>
                      <th className="p-2.5 border-b border-slate-300 text-right">Total Amount</th>
                      <th className="p-2.5 border-b border-slate-300">Beneficiaries & Shares</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {expenses.map((exp, index) => {
                      const payer = memberMap.get(exp.payerMemberId)?.name || 'Unknown';
                      const detail = calculation.expenseShares[exp.id];

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-500">{index + 1}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{exp.title}</div>
                            <div className="text-[10px] text-slate-500">{exp.category}</div>
                            {exp.description && (
                              <div className="text-[10px] text-slate-600 italic mt-0.5">
                                {exp.description}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600 whitespace-nowrap">
                            {formatDate(exp.expenseDate)}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900">{payer}</td>
                          <td className="p-2.5 text-right font-bold font-mono text-slate-900">
                            {formatINR(exp.amountPaise)}
                          </td>
                          <td className="p-2.5">
                            {detail ? (
                              <div className="space-y-0.5 text-[11px]">
                                <div>
                                  <span className="font-medium text-slate-700">
                                    {detail.beneficiaryShares.length} people:
                                  </span>{' '}
                                  {detail.beneficiaryShares.map((s, i) => {
                                    const name = memberMap.get(s.memberId)?.name || 'Unknown';
                                    return (
                                      <span key={s.memberId}>
                                        {name} ({formatINR(s.sharePaise)})
                                        {i < detail.beneficiaryShares.length - 1 ? ', ' : ''}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span>{exp.beneficiaryMemberIds.length} members</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION D: OUTGOING PAYMENTS BY FRIEND (WHAT EACH PERSON HAS TO SEND) */}
          <div className="mb-8">
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Section D: Outgoing Payments by Friend (What Each Person Has to Send)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Under each person&apos;s name, this section lists exactly how much money that friend must send to each other person.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => {
                // Find all outgoing transfers where this member is the sender
                const outgoingTransfers = calculation.settlementTransfers.filter(
                  (t) => t.fromMemberId === m.id && t.amountPaise > 0
                );
                const totalOutgoing = outgoingTransfers.reduce(
                  (sum, t) => sum + t.amountPaise,
                  0
                );

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 break-inside-avoid"
                  >
                    {/* Person's Name as the Title */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.archivedAt && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Archived)
                          </span>
                        )}
                      </h3>
                      {outgoingTransfers.length > 0 ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {outgoingTransfers.length} Payment{outgoingTransfers.length > 1 ? 's' : ''} to Send
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Nothing to send
                        </span>
                      )}
                    </div>

                    {/* Amount to send under this person's name */}
                    {outgoingTransfers.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-1.5">
                        Nothing to send
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {outgoingTransfers.map((t, idx) => {
                          const recipient = memberMap.get(t.toMemberId)?.name || 'Unknown';
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0"
                            >
                              <span className="text-slate-700">
                                Send to <strong className="text-slate-900">{recipient}</strong>:
                              </span>
                              <span className="font-bold font-mono text-rose-700 text-sm">
                                {formatINR(t.amountPaise)}
                              </span>
                            </div>
                          );
                        })}

                        {outgoingTransfers.length > 1 && (
                          <div className="pt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-800 border-t border-slate-200">
                            <span>Total to send:</span>
                            <span className="font-mono text-rose-700">
                              {formatINR(totalOutgoing)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION E: MEMBER-WISE FINANCIAL BREAKDOWN */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Section E: Member-Wise Financial Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5 border-b border-slate-300">Member Name</th>
                    <th className="p-2.5 border-b border-slate-300 text-right">Total Spent</th>
                    <th className="p-2.5 border-b border-slate-300 text-right">Consumed Share</th>
                    <th className="p-2.5 border-b border-slate-300 text-right">Net Balance</th>
                    <th className="p-2.5 border-b border-slate-300 text-right">
                      Financial Position
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.values(calculation.memberSummaries).map((summary) => (
                    <tr key={summary.memberId} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {summary.name} {summary.isArchived && '(Archived)'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-slate-800">
                        {formatINR(summary.totalPaidPaise)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-slate-800">
                        {formatINR(summary.totalFairSharePaise)}
                      </td>
                      <td
                        className={`p-2.5 text-right font-mono font-bold ${
                          summary.status === 'gets_back'
                            ? 'text-emerald-700'
                            : summary.status === 'owes'
                            ? 'text-rose-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {summary.status === 'gets_back' && '+'}
                        {formatINR(summary.netBalancePaise)}
                      </td>
                      <td className="p-2.5 text-right font-semibold">
                        {summary.status === 'gets_back' && (
                          <span className="text-emerald-700">
                            Gets Back {formatINR(summary.netBalancePaise)}
                          </span>
                        )}
                        {summary.status === 'owes' && (
                          <span className="text-rose-700">
                            Owes {formatINR(Math.abs(summary.netBalancePaise))}
                          </span>
                        )}
                        {summary.status === 'settled' && (
                          <span className="text-slate-600">Settled (₹0.00)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION F: STEP-BY-STEP CALCULATION AUDIT TRAIL */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Section F: Direct Pairwise Calculation Audit Trail
            </h2>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                TripSplit uses a direct pairwise split method. Whenever a friend spends money, the
                cost is split among the beneficiaries. Mutual debts between any two friends are
                subtracted from each other so only the net difference is transferred directly.
              </p>

              <div className="space-y-2">
                <strong className="text-slate-900 block text-[11px] uppercase tracking-wider">
                  1. Per-Expense Split Breakdown:
                </strong>
                {expenses.map((exp) => {
                  const detail = calculation.expenseShares[exp.id];
                  if (!detail) return null;
                  const payer = memberMap.get(exp.payerMemberId)?.name || 'Unknown';
                  return (
                    <div key={exp.id} className="pl-3 border-l-2 border-slate-300">
                      <span className="font-bold text-slate-900">{exp.title}:</span> {payer} spent{' '}
                      {formatINR(exp.amountPaise)} for {detail.beneficiaryShares.length} person(s).{' '}
                      Each beneficiary owes {payer}:{' '}
                      <strong>{formatINR(detail.baseSharePaise)}</strong>
                      {detail.remainderPaise > 0 &&
                        ` (with ${detail.remainderPaise} paise remainder distributed deterministically)`}
                      .
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2">
                <strong className="text-slate-900 block text-[11px] uppercase tracking-wider">
                  2. Direct Friend-to-Friend Net Offsets (Subtracting Mutual Debts):
                </strong>
                {calculation.pairwiseDebts.map((pd, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-slate-300">
                    <span className="font-bold text-slate-900">
                      Between {pd.memberAName} and {pd.memberBName}:
                    </span>{' '}
                    {pd.explanation}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION G: DIRECT SETTLEMENT INSTRUCTIONS */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Section G: Direct Settlement Instructions
            </h2>

            {calculation.isFullySettled ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                ✓ All trip participants are fully settled. No payments need to be made.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5 border-b border-slate-300">Transfer #</th>
                      <th className="p-2.5 border-b border-slate-300">Person Paying</th>
                      <th className="p-2.5 border-b border-slate-300">Person Receiving</th>
                      <th className="p-2.5 border-b border-slate-300 text-right">Net Amount</th>
                      <th className="p-2.5 border-b border-slate-300">Direct Offset Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {calculation.settlementTransfers.map((t, idx) => {
                      const debtor = memberMap.get(t.fromMemberId)?.name || 'Unknown';
                      const creditor = memberMap.get(t.toMemberId)?.name || 'Unknown';

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-rose-700">{debtor}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{creditor}</td>
                          <td className="p-2.5 text-right font-black font-mono text-slate-900">
                            {formatINR(t.amountPaise)}
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                            {t.explanation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION H: FINAL SUMMARY STATEMENT */}
          <div className="pt-6 border-t-2 border-slate-900 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900">
                TripSplit Expense Report Signature & Verification
              </span>
              <p className="text-[11px] text-slate-500">
                Generated automatically by TripSplit. Integer-paise precision verified with zero mathematical rounding drift.
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-slate-900">
                Total Cleared: {formatINR(calculation.totalDebtPaise)}
              </div>
              <div className="text-[10px] text-slate-500">Report Stamp: {trip.id}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INDIVIDUAL FRIEND REPORT CONTAINER                                     */}
      {/* ========================================================================= */}
      {reportType === 'individual' && selectedMember && selectedMemberSummary && (
        <div
          className={`bg-white text-slate-900 rounded-2xl sm:rounded-[28px] p-4 sm:p-10 md:p-12 shadow-2xl transition-all print-report-container min-w-0 ${
            isPreviewMode ? 'ring-4 ring-[#FDE047]' : ''
          }`}
        >
          {/* INDIVIDUAL HEADER */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  <span>Personal Settlement Statement</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Statement for {selectedMember.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="font-bold text-slate-900">{trip.title}</span>
                  {trip.destination && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.destination}
                      </span>
                    </>
                  )}
                  {(trip.startDate || trip.endDate) && (
                    <>
                      <span>•</span>
                      <span>
                        {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1.5 text-xs text-slate-600">
                <div>
                  <strong>Report Date:</strong> {reportDate}
                </div>
                <div>
                  <strong>Personal Position:</strong>{' '}
                  {selectedMemberSummary.status === 'gets_back' && (
                    <span className="font-bold text-emerald-700">
                      Gets Back {formatINR(selectedMemberSummary.netBalancePaise)}
                    </span>
                  )}
                  {selectedMemberSummary.status === 'owes' && (
                    <span className="font-bold text-rose-700">
                      Owes {formatINR(Math.abs(selectedMemberSummary.netBalancePaise))}
                    </span>
                  )}
                  {selectedMemberSummary.status === 'settled' && (
                    <span className="font-bold text-slate-700">Fully Settled (₹0.00)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INDIVIDUAL SECTION 1: MONEY TO SEND (OUTGOING PAYMENTS) */}
          {(() => {
            const outgoing = calculation.settlementTransfers.filter(
              (t) => t.fromMemberId === selectedMember.id && t.amountPaise > 0
            );
            const totalToSend = outgoing.reduce((sum, t) => sum + t.amountPaise, 0);

            return (
              <div className="mb-8">
                <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      1. Money You Have to Send (Outgoing Payments)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Amounts you must transfer directly to your friends after netting mutual expenses.
                    </p>
                  </div>
                  {outgoing.length > 0 && (
                    <span className="text-xs font-bold text-rose-700">
                      Total: {formatINR(totalToSend)}
                    </span>
                  )}
                </div>

                {outgoing.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Nothing to send!</strong> You do not owe money to anyone for this trip.
                    </span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5 border-b border-slate-300">#</th>
                          <th className="p-2.5 border-b border-slate-300">Send To (Friend)</th>
                          <th className="p-2.5 border-b border-slate-300 text-right">
                            Amount to Send
                          </th>
                          <th className="p-2.5 border-b border-slate-300">
                            Direct Mutual Offset Explanation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {outgoing.map((t, idx) => {
                          const recipient = memberMap.get(t.toMemberId)?.name || 'Unknown';
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900 text-sm">
                                {recipient}
                              </td>
                              <td className="p-2.5 text-right font-black font-mono text-rose-700 text-base">
                                {formatINR(t.amountPaise)}
                              </td>
                              <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                                {t.explanation}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td colSpan={2} className="p-2.5 text-slate-800 uppercase text-[10px]">
                            Total Outgoing Payments to Send
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-rose-700 text-base">
                            {formatINR(totalToSend)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* INDIVIDUAL SECTION 2: MONEY TO GET (INCOMING PAYMENTS) */}
          {(() => {
            const incoming = calculation.settlementTransfers.filter(
              (t) => t.toMemberId === selectedMember.id && t.amountPaise > 0
            );
            const totalToGet = incoming.reduce((sum, t) => sum + t.amountPaise, 0);

            return (
              <div className="mb-8">
                <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      2. Money You Have to Get (Incoming Payments)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Amounts your friends must transfer directly to you after netting mutual expenses.
                    </p>
                  </div>
                  {incoming.length > 0 && (
                    <span className="text-xs font-bold text-emerald-700">
                      Total: {formatINR(totalToGet)}
                    </span>
                  )}
                </div>

                {incoming.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                    No incoming payments to collect. Friends do not owe money to you.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5 border-b border-slate-300">#</th>
                          <th className="p-2.5 border-b border-slate-300">Receive From (Friend)</th>
                          <th className="p-2.5 border-b border-slate-300 text-right">
                            Amount to Receive
                          </th>
                          <th className="p-2.5 border-b border-slate-300">
                            Direct Mutual Offset Explanation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {incoming.map((t, idx) => {
                          const sender = memberMap.get(t.fromMemberId)?.name || 'Unknown';
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900 text-sm">{sender}</td>
                              <td className="p-2.5 text-right font-black font-mono text-emerald-700 text-base">
                                {formatINR(t.amountPaise)}
                              </td>
                              <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                                {t.explanation}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td colSpan={2} className="p-2.5 text-slate-800 uppercase text-[10px]">
                            Total Incoming Payments to Receive
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-emerald-700 text-base">
                            {formatINR(totalToGet)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* INDIVIDUAL SECTION 3: PERSONAL FINANCIAL SUMMARY */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              3. Personal Financial Overview for {selectedMember.name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Total Spent by You
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatINR(selectedMemberSummary.totalPaidPaise)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Out-of-pocket for {selectedMemberSummary.expensesPaidCount} expense(s)
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Your Consumed Share
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatINR(selectedMemberSummary.totalFairSharePaise)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Benefited from {selectedMemberSummary.expensesBenefitedCount} expense(s)
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Net Balance Position
                </span>
                <div
                  className={`text-2xl font-black ${
                    selectedMemberSummary.status === 'gets_back'
                      ? 'text-emerald-700'
                      : selectedMemberSummary.status === 'owes'
                      ? 'text-rose-700'
                      : 'text-slate-900'
                  }`}
                >
                  {selectedMemberSummary.status === 'gets_back' && '+'}
                  {formatINR(selectedMemberSummary.netBalancePaise)}
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  {selectedMemberSummary.status === 'gets_back' && 'You get back money in total'}
                  {selectedMemberSummary.status === 'owes' && 'You owe money in total'}
                  {selectedMemberSummary.status === 'settled' && 'Your balance is zero (settled)'}
                </div>
              </div>
            </div>
          </div>

          {/* INDIVIDUAL SECTION 4: ITEMIZED EXPENSES BREAKDOWN */}
          <div className="mb-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              4. Itemized Activity for {selectedMember.name}
            </h2>

            {/* A. Expenses Paid by this Member */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">
                A. Expenses Paid Directly by {selectedMember.name} (
                {
                  expenses.filter((e) => e.payerMemberId === selectedMember.id).length
                }
                )
              </h3>
              {expenses.filter((e) => e.payerMemberId === selectedMember.id).length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  {selectedMember.name} did not pay for any expenses directly.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border-b border-slate-300">Expense Title</th>
                        <th className="p-2 border-b border-slate-300">Category</th>
                        <th className="p-2 border-b border-slate-300">Date</th>
                        <th className="p-2 border-b border-slate-300 text-right">Amount Paid</th>
                        <th className="p-2 border-b border-slate-300">Beneficiaries</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {expenses
                        .filter((e) => e.payerMemberId === selectedMember.id)
                        .map((exp) => (
                          <tr key={exp.id}>
                            <td className="p-2 font-bold text-slate-900">{exp.title}</td>
                            <td className="p-2 text-slate-600">{exp.category}</td>
                            <td className="p-2 text-slate-600 whitespace-nowrap">
                              {formatDate(exp.expenseDate)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {formatINR(exp.amountPaise)}
                            </td>
                            <td className="p-2 text-slate-600 text-[11px]">
                              {exp.beneficiaryMemberIds.length} person(s) (
                              {exp.beneficiaryMemberIds
                                .map((id) => memberMap.get(id)?.name || id)
                                .join(', ')}
                              )
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* B. Expenses Benefiting this Member */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">
                B. Expenses Shared by / Benefiting {selectedMember.name} (
                {
                  expenses.filter((e) => e.beneficiaryMemberIds.includes(selectedMember.id)).length
                }
                )
              </h3>
              {expenses.filter((e) => e.beneficiaryMemberIds.includes(selectedMember.id)).length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  {selectedMember.name} did not participate in any shared expenses.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] print:min-w-0 text-left text-xs border border-slate-300 print-table">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border-b border-slate-300">Expense Title</th>
                        <th className="p-2 border-b border-slate-300">Paid By</th>
                        <th className="p-2 border-b border-slate-300">Date</th>
                        <th className="p-2 border-b border-slate-300 text-right">Total Expense</th>
                        <th className="p-2 border-b border-slate-300 text-right">Your Fair Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {expenses
                        .filter((e) => e.beneficiaryMemberIds.includes(selectedMember.id))
                        .map((exp) => {
                          const payer = memberMap.get(exp.payerMemberId)?.name || 'Unknown';
                          const detail = calculation.expenseShares[exp.id];
                          const myShare = detail?.beneficiaryShares.find(
                            (s) => s.memberId === selectedMember.id
                          )?.sharePaise;

                          return (
                            <tr key={exp.id}>
                              <td className="p-2 font-bold text-slate-900">{exp.title}</td>
                              <td className="p-2 text-slate-700 font-semibold">{payer}</td>
                              <td className="p-2 text-slate-600 whitespace-nowrap">
                                {formatDate(exp.expenseDate)}
                              </td>
                              <td className="p-2 text-right font-mono text-slate-700">
                                {formatINR(exp.amountPaise)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">
                                {myShare !== undefined ? formatINR(myShare) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* INDIVIDUAL SIGN-OFF FOOTER */}
          <div className="pt-6 border-t-2 border-slate-900 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="font-bold text-slate-900">
                Member Settlement Slip • {selectedMember.name}
              </span>
              <p className="text-[11px] text-slate-500">
                TripSplit Direct Netting Engine. Calculated with zero mathematical drift.
              </p>
            </div>

            <div className="w-full sm:w-64 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <div className="text-[11px] text-slate-500 mb-4">
                Signature / Confirmation:
              </div>
              <div className="border-b border-slate-400 h-6"></div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{selectedMember.name}</span>
                <span>Date: _____________</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
