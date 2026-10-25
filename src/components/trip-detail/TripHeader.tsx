import React from 'react';
import { Trip } from '../../types';
import { TripCalculationResult } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import {
  MapPin,
  Calendar,
  Plus,
  ArrowLeft,
  LayoutDashboard,
  Receipt,
  Users,
  CheckCircle,
  FileBarChart,
  Clock,
  Sparkles,
  Pencil,
} from 'lucide-react';

export type TripTab = 'overview' | 'expenses' | 'members' | 'settlement' | 'reports';

export interface TripHeaderProps {
  trip: Trip;
  calculation: TripCalculationResult;
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  onBackToTrips: () => void;
  onAddExpense: () => void;
  onEditTrip: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  calculation,
  activeTab,
  onTabChange,
  onBackToTrips,
  onAddExpense,
  onEditTrip,
}) => {
  const hasUnconfirmedChanges =
    trip.lastConfirmedRevision !== null &&
    trip.lastConfirmedRevision !== trip.revision;

  return (
    <div className="no-print w-full">
      {/* Liquid Asymmetrical Hero in Cyber Yellow */}
      <section className="bg-[#FDE047] text-black pt-6 sm:pt-8 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8 liquid-hero shadow-xl overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Top back button and status */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
            <button
              onClick={onBackToTrips}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-black/10 hover:bg-black/20 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all active:scale-95 cursor-pointer min-h-[38px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Trips</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {calculation.isFullySettled ? (
                <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-black text-white border border-black/30 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-black">All Debts Settled</span>
                </span>
              ) : hasUnconfirmedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-black text-white border border-black/30 shadow-md">
                  <Clock className="w-3.5 h-3.5 text-[#FDE047]" />
                  <span>Reconfirmation Needed</span>
                </span>
              ) : trip.lastConfirmedRevision ? (
                <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-black text-white border border-black/30 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5 text-[#FDE047]" />
                  <span>Settlement Confirmed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-black text-white border border-black/30 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#FDE047] animate-pulse shrink-0" />
                  <span>
                    <strong className="text-[#FDE047] font-black">{calculation.settlementTransfers.length}</strong>{' '}
                    Transfers Pending
                  </span>
                </span>
              )}

              <button
                onClick={onEditTrip}
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-black/10 hover:bg-black/20 text-black px-3 sm:px-3.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer min-h-[38px]"
                title="Edit trip details"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Trip</span>
              </button>
            </div>
          </div>

          {/* Title and details */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="space-y-2 max-w-3xl min-w-0">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-black break-words">
                {trip.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-semibold text-black/80">
                {trip.destination && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <span className="break-words">{trip.destination}</span>
                  </div>
                )}
                {(trip.startDate || trip.endDate) && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <span>
                      {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action */}
            <div className="w-full md:w-auto shrink-0">
              <Button
                variant="void"
                size="lg"
                onClick={onAddExpense}
                icon={<Plus className="w-5 h-5 text-[#FDE047] stroke-[3]" />}
                className="bg-black text-white hover:bg-[#1A1A1A] shadow-2xl w-full md:w-auto"
              >
                Add Expense
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Pill Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 -mt-6 sm:-mt-7">
        <div className="glass-panel-elevated rounded-2xl sm:rounded-full p-1 sm:p-2 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all shrink-0 cursor-pointer min-h-[40px] ${
              activeTab === 'overview'
                ? 'bg-[#FDE047] text-black shadow-lg shadow-yellow-400/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onTabChange('expenses')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all shrink-0 cursor-pointer min-h-[40px] ${
              activeTab === 'expenses'
                ? 'bg-[#FDE047] text-black shadow-lg shadow-yellow-400/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expenses</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'expenses' ? 'bg-black text-white' : 'bg-white/15 text-white'
              }`}
            >
              {Object.keys(calculation.expenseShares).length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('members')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all shrink-0 cursor-pointer min-h-[40px] ${
              activeTab === 'members'
                ? 'bg-[#FDE047] text-black shadow-lg shadow-yellow-400/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'members' ? 'bg-black text-white' : 'bg-white/15 text-white'
              }`}
            >
              {trip.memberIds.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('settlement')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all shrink-0 cursor-pointer min-h-[40px] ${
              activeTab === 'settlement'
                ? 'bg-[#FDE047] text-black shadow-lg shadow-yellow-400/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Settlement</span>
            {calculation.settlementTransfers.length > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'settlement' ? 'bg-black text-white' : 'bg-white/15 text-white'
                }`}
              >
                {calculation.settlementTransfers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('reports')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all shrink-0 cursor-pointer min-h-[40px] ${
              activeTab === 'reports'
                ? 'bg-[#FDE047] text-black shadow-lg shadow-yellow-400/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
