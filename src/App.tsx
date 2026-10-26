import React, { useState, useEffect } from 'react';
import { Trip } from './types';
import { tripStorage } from './storage/tripStorage';
import { Navbar } from './components/common/Navbar';
import { TripList } from './components/trips/TripList';
import { TripDetailView } from './components/trip-detail/TripDetailView';
import { CreateTripModal } from './components/trips/CreateTripModal';
import { EditTripModal } from './components/trips/EditTripModal';
import { BackupModal } from './components/common/BackupModal';

export function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Load trips from storage on mount
  const refreshTrips = () => {
    const list = tripStorage.getTrips();
    setTrips(list);
  };

  useEffect(() => {
    refreshTrips();
  }, []);

  const currentTrip = trips.find((t) => t.id === selectedTripId);

  const handleGoToAllTrips = () => {
    if (selectedTripId) {
      setSelectedTripId(null);
      // Wait for TripList to render in DOM, then smoothly scroll to trips section
      setTimeout(() => {
        const element = document.getElementById('trips-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }
      }, 50);
    } else {
      // Already on the trips view, smoothly scroll down to the trips section
      const element = document.getElementById('trips-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }
  };

  const handleSelectTrip = (id: string) => {
    setSelectedTripId(id);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const handleTripCreated = (newTrip: Trip) => {
    refreshTrips();
    handleSelectTrip(newTrip.id);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#FDE047] selection:text-black">
      {/* Global Navbar */}
      <Navbar
        currentTrip={currentTrip}
        trips={trips}
        onSelectTrip={handleSelectTrip}
        onGoToAllTrips={handleGoToAllTrips}
        onCreateTrip={() => setIsCreateModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {selectedTripId ? (
          <TripDetailView
            tripId={selectedTripId}
            onBackToTrips={() => {
              handleGoToAllTrips();
              refreshTrips();
            }}
            onTripDataChanged={refreshTrips}
          />
        ) : (
          <TripList
            trips={trips}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={() => setIsCreateModalOpen(true)}
            onEditTrip={(trip) => setTripToEdit(trip)}
            onRefreshTrips={refreshTrips}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="no-print border-t border-white/10 py-6 sm:py-8 bg-[#070707] text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-bold text-white">TripSplit</span>
            <span>• Smart Group Trip Expense & Debt Settlement Engine</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-neutral-500 text-[11px] sm:text-xs">
            <span>Client-side persistent storage</span>
            <span>•</span>
            <span>Zero floating point rounding error</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTripCreated={handleTripCreated}
      />

      <EditTripModal
        isOpen={!!tripToEdit}
        trip={tripToEdit || undefined}
        onClose={() => setTripToEdit(null)}
        onTripUpdated={() => {
          refreshTrips();
          setTripToEdit(null);
        }}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={refreshTrips}
      />
    </div>
  );
}

export default App;
