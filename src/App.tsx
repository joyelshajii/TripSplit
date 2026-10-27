import React, { useState, useEffect } from 'react';
import { Trip } from './types';
import { tripStorage } from './storage/tripStorage';
import { fetchTripFromCloud, syncTripToCloud, syncAllLocalTrips } from './services/cloudSync';
import { canUserEditTrip, saveTripEditKey } from './services/tripPermissions';
import { Navbar } from './components/common/Navbar';
import { TripList } from './components/trips/TripList';
import { TripDetailView } from './components/trip-detail/TripDetailView';
import { CreateTripModal } from './components/trips/CreateTripModal';
import { EditTripModal } from './components/trips/EditTripModal';
import { BackupModal } from './components/common/BackupModal';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './components/common/Button';

export function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [urlKey, setUrlKey] = useState<string | null>(null);
  const [isExplicitViewOnly, setIsExplicitViewOnly] = useState<boolean>(false);
  const [isLoadingCloudTrip, setIsLoadingCloudTrip] = useState<boolean>(false);
  const [cloudErrorMessage, setCloudErrorMessage] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Load trips from storage
  const refreshTrips = () => {
    const list = tripStorage.getTrips();
    setTrips(list);
  };

  // On mount: check URL parameters and listen for browser back/forward navigation
  useEffect(() => {
    refreshTrips();
    // Sync any existing local trips to Firestore
    syncAllLocalTrips();

    const readUrlState = async () => {
      const params = new URLSearchParams(window.location.search);
      const tripId = params.get('trip');
      const key = params.get('key');
      const view = params.get('view');
      const forceView = view === 'readonly' || view === '1' || view === 'view';

      setUrlKey(key);
      setIsExplicitViewOnly(forceView);

      if (tripId) {
        if (key && !forceView) {
          saveTripEditKey(tripId, key);
        }

        const localTrip = tripStorage.getTrip(tripId);
        if (localTrip) {
          setSelectedTripId(tripId);
          setCloudErrorMessage(null);
          // Also fetch fresh from cloud in background to merge any new items
          fetchTripFromCloud(tripId).then((res) => {
            if (res.success) refreshTrips();
          });
        } else {
          // Trip not found locally — fetch from Firebase Firestore!
          setIsLoadingCloudTrip(true);
          setCloudErrorMessage(null);
          setSelectedTripId(null);
          const res = await fetchTripFromCloud(tripId);
          setIsLoadingCloudTrip(false);

          if (res.success && res.trip) {
            refreshTrips();
            setSelectedTripId(tripId);
          } else {
            setSelectedTripId(null);
            setCloudErrorMessage(
              res.error || 'The requested trip could not be found or cloud database is unreachable.'
            );
          }
        }
      } else {
        setSelectedTripId(null);
        setCloudErrorMessage(null);
      }
    };

    readUrlState();

    const handlePopState = () => {
      readUrlState();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentTrip = trips.find((t) => t.id === selectedTripId);

  // Determine if the current user has view-only rights or collaborator edit rights
  const isReadOnly = currentTrip
    ? !canUserEditTrip(currentTrip, urlKey, isExplicitViewOnly)
    : false;

  const handleGoToAllTrips = () => {
    setSelectedTripId(null);
    setCloudErrorMessage(null);
    window.history.pushState({}, '', window.location.pathname);

    setTimeout(() => {
      const element = document.getElementById('trips-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSelectTrip = (id: string, customKey?: string) => {
    setSelectedTripId(id);
    setCloudErrorMessage(null);

    const trip = tripStorage.getTrip(id);
    const key = customKey || trip?.editKey || urlKey;
    const searchParams = new URLSearchParams();
    searchParams.set('trip', id);
    if (key && !isExplicitViewOnly) {
      searchParams.set('key', key);
    } else if (isExplicitViewOnly) {
      searchParams.set('view', 'readonly');
    }

    window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const handleTripCreated = (newTrip: Trip) => {
    refreshTrips();
    syncTripToCloud(newTrip.id);
    handleSelectTrip(newTrip.id, newTrip.editKey);
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
      <div className="flex-1 flex flex-col">
        {isLoadingCloudTrip ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="w-10 h-10 text-[#FDE047] animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Opening Shared Trip</h3>
              <p className="text-xs text-neutral-400">Fetching trip expenses from cloud database...</p>
            </div>
          </div>
        ) : cloudErrorMessage ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 rounded-3xl bg-[#141414] border border-rose-500/30 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Trip Not Found</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{cloudErrorMessage}</p>
              </div>
              <Button
                variant="cyber"
                size="md"
                onClick={handleGoToAllTrips}
                className="w-full"
              >
                Go to My Trips
              </Button>
            </div>
          </div>
        ) : selectedTripId ? (
          <TripDetailView
            tripId={selectedTripId}
            onBackToTrips={() => {
              handleGoToAllTrips();
              refreshTrips();
            }}
            onTripDataChanged={refreshTrips}
            isReadOnly={isReadOnly}
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
            <span>Real-time Cloud Sync Enabled</span>
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
