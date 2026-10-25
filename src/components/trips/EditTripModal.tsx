import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MapPin, Calendar, FileText, Check } from 'lucide-react';
import { Trip } from '../../types';
import { tripStorage } from '../../storage/tripStorage';

export interface EditTripModalProps {
  isOpen: boolean;
  trip?: Trip;
  onClose: () => void;
  onTripUpdated: (updated: Trip) => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  isOpen,
  trip,
  onClose,
  onTripUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trip) {
      setTitle(trip.title);
      setDestination(trip.destination || '');
      setStartDate(trip.startDate || '');
      setEndDate(trip.endDate || '');
      setDescription(trip.description || '');
      setError(null);
    }
  }, [trip, isOpen]);

  if (!trip) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide a trip title.');
      return;
    }

    try {
      const updated = tripStorage.updateTrip(trip.id, {
        title: cleanTitle,
        destination: destination.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description.trim() || undefined,
      });

      onTripUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trip Details"
      subtitle="Update trip name, travel destination, dates, and notes."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
            Trip Title <span className="text-[#FDE047]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>Destination</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>Description or Notes</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} type="button" className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="cyber" type="submit" icon={<Check className="w-4 h-4" />} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
