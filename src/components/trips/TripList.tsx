import React, { useState } from 'react';
import { Trip } from '../../types';
import { tripStorage } from '../../storage/tripStorage';
import { calculateTripBalances } from '../../engine/calculation';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  MapPin,
  Calendar,
  Users,
  Receipt,
  ArrowRight,
  Copy,
  Pencil,
  Trash2,
  Search,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowDown,
} from 'lucide-react';

export interface TripListProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onRefreshTrips: () => void;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  onSelectTrip,
  onCreateTrip,
  onEditTrip,
  onRefreshTrips,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  const filteredTrips = trips.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      (t.destination && t.destination.toLowerCase().includes(q))
    );
  });

  const handleDuplicate = (tripId: string) => {
    try {
      tripStorage.duplicateTrip(tripId);
      onRefreshTrips();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = () => {
    if (!tripToDelete) return;
    try {
      tripStorage.deleteTrip(tripToDelete.id);
      onRefreshTrips();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 text-white">
      {/* Liquid Hero Section in Cyber Yellow */}
      <section className="relative bg-[#FDE047] text-black pt-8 sm:pt-12 pb-16 sm:pb-24 px-3 sm:px-6 lg:px-8 liquid-hero shadow-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/10 backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-black max-w-full">
            <Sparkles className="w-3.5 h-3.5 fill-black shrink-0" />
            <span className="truncate">Hyper-Accurate Paise-Level Calculations</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.98] sm:leading-[0.95] max-w-4xl break-words">
            TRACK. SPLIT. <br className="hidden sm:inline" />
            <span className="underline decoration-black decoration-wavy decoration-2">SETTLE DEBTS.</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl font-medium text-black/80 max-w-2xl leading-relaxed">
            Record every fuel, food, and hotel expense. Directly split costs among friends and settle by subtracting mutual debts between each person.
          </p>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="void"
              size="lg"
              onClick={onCreateTrip}
              icon={<Plus className="w-5 h-5 text-[#FDE047] stroke-[3]" />}
              className="bg-black text-white hover:bg-[#1A1A1A] shadow-2xl w-full sm:w-auto"
            >
              Start New Trip
            </Button>

            {trips.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('trips-section');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center justify-center font-bold tracking-tight rounded-full transition-all duration-200 cursor-pointer select-none active:scale-95 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 gap-2.5 shadow-2xl bg-white text-black hover:bg-neutral-100 border border-black/10 hover:scale-105 w-full sm:w-auto min-h-[48px]"
              >
                <ArrowDown className="w-5 h-5 text-black stroke-[3]" />
                <span>Your Trips</span>
                <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-xs font-bold">
                  {trips.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content in The Dark Void */}
      <main id="trips-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 scroll-mt-24">
        {/* Search & Filter Toolbar */}
        <div className="glass-panel-elevated rounded-2xl sm:rounded-[32px] p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-8">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search trips by title or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 text-white text-xs sm:text-sm rounded-full pl-11 pr-4 py-2.5 sm:py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold w-full sm:w-auto justify-end">
            <span>Showing {filteredTrips.length} of {trips.length} Trips</span>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          <div className="glass-panel rounded-[32px] p-12 text-center space-y-5 border border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-yellow-300">
              <CompassIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-white">No Trips Found</h3>
              <p className="text-sm text-neutral-400">
                {searchQuery
                  ? `No trips match "${searchQuery}". Try a different keyword.`
                  : "You haven't created any group trips yet. Start your first trip to track expenses!"}
              </p>
            </div>
            <div>
              <Button
                variant="cyber"
                size="md"
                onClick={onCreateTrip}
                icon={<Plus className="w-4 h-4 stroke-[3]" />}
              >
                Create Your First Trip
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const members = tripStorage.getMembers(trip.id);
              const expenses = tripStorage.getExpenses(trip.id);
              const calc = calculateTripBalances(members, expenses);

              const hasUnconfirmedChanges =
                trip.lastConfirmedRevision !== null &&
                trip.lastConfirmedRevision !== trip.revision;

              const isSettled = calc.isFullySettled;

              return (
                <div
                  key={trip.id}
                  onClick={() => onSelectTrip(trip.id)}
                  className="glass-panel group relative rounded-2xl sm:rounded-[32px] p-4 sm:p-6 flex flex-col justify-between hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer min-w-0"
                >
                  {/* Card Header */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-[#FDE047] transition-colors line-clamp-1 break-words">
                          {trip.title}
                        </h3>
                        {trip.destination && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <MapPin className="w-3.5 h-3.5 text-[#FDE047] shrink-0" />
                            <span className="line-clamp-1 break-words">{trip.destination}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      {isSettled ? (
                        <PillBadge variant="emerald" size="xs" icon={<CheckCircle2 className="w-3 h-3" />}>
                          Settled
                        </PillBadge>
                      ) : hasUnconfirmedChanges ? (
                        <PillBadge variant="cyber" size="xs" icon={<Clock className="w-3 h-3" />}>
                          Needs Reconfirm
                        </PillBadge>
                      ) : (
                        <PillBadge variant="rose" size="xs">
                          {calc.settlementTransfers.length} Transfers
                        </PillBadge>
                      )}
                    </div>

                    {/* Dates */}
                    {(trip.startDate || trip.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-white/5 rounded-xl px-3 py-1.5 w-fit">
                        <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                        <span>
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </span>
                      </div>
                    )}

                    {/* Trip Stat Highlights */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                          Total Spent
                        </span>
                        <span className="text-lg font-black text-[#FDE047]">
                          {formatINR(calc.totalTripPaise)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                          To Settle
                        </span>
                        <span className="text-lg font-black text-white">
                          {formatINR(calc.totalDebtPaise)}
                        </span>
                      </div>
                    </div>

                    {/* Member and expense counts */}
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 px-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-300" />
                        <span>{members.length} Members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-neutral-300" />
                        <span>{expenses.length} Expenses</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTrip(trip);
                        }}
                        className="p-2 sm:p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Edit trip details"
                        aria-label="Edit trip"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(trip.id);
                        }}
                        className="p-2 sm:p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Duplicate trip"
                        aria-label="Duplicate trip"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTripToDelete(trip);
                        }}
                        className="p-2 sm:p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                        title="Delete trip"
                        aria-label="Delete trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      variant="cyber"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrip(trip.id);
                      }}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Open Trip
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${tripToDelete?.title}"?`}
        message={`Are you sure you want to permanently delete this trip and all its recorded expenses and members? This action cannot be undone.`}
        confirmLabel="Delete Trip"
        isDestructive={true}
      />
    </div>
  );
};

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
