import React from 'react';
import { Trip } from '../../types';
import { Button } from './Button';
import { Compass, Plus, Database, ChevronDown } from 'lucide-react';

export interface NavbarProps {
  currentTrip?: Trip;
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onGoToAllTrips: () => void;
  onCreateTrip: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTrip,
  trips,
  onSelectTrip,
  onGoToAllTrips,
  onCreateTrip,
  onOpenBackup,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button
            onClick={onGoToAllTrips}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FDE047] flex items-center justify-center text-black font-black text-lg sm:text-xl shadow-lg shadow-yellow-400/20 group-hover:scale-105 transition-transform shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">TripSplit</span>
                <span className="w-2 h-2 rounded-full bg-[#FDE047] inline-block animate-pulse shrink-0" />
              </div>
              <p className="hidden xs:block text-[9px] sm:text-[10px] tracking-widest uppercase font-bold text-neutral-400 truncate">
                Direct Debt Settlement
              </p>
            </div>
          </button>

          {/* Trip Selector (if active) */}
          {currentTrip && trips.length > 1 && (
            <div className="hidden md:flex items-center">
              <div className="h-6 w-[1px] bg-white/20 mr-4" />
              <div className="relative group">
                <select
                  value={currentTrip.id}
                  onChange={(e) => onSelectTrip(e.target.value)}
                  className="appearance-none bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-full pl-4 pr-9 py-2 border border-white/15 focus:outline-none focus:border-yellow-400 cursor-pointer"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#171717] text-white">
                      {t.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Button
            variant="void"
            size="sm"
            onClick={onOpenBackup}
            icon={<Database className="w-4 h-4 text-[#FDE047]" />}
            className="px-2.5 sm:px-4 py-1.5 min-h-[38px]"
            title="Import or Export JSON backup"
            aria-label="Data Backup"
          >
            <span className="hidden sm:inline">Data Backup</span>
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={onGoToAllTrips}
            className="inline-flex px-3 sm:px-4 py-1.5 min-h-[38px]"
            title="View all trips"
          >
            <span className="hidden xs:inline">All Trips</span>
            <span className="xs:hidden">Trips</span>
          </Button>

          <Button
            variant="cyber"
            size="sm"
            onClick={onCreateTrip}
            icon={<Plus className="w-4 h-4 stroke-[3]" />}
            className="px-3 sm:px-4 py-1.5 min-h-[38px]"
          >
            <span className="hidden xs:inline">New Trip</span>
            <span className="xs:hidden">New</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
