import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Plus, Trash2, Users, MapPin, Calendar, FileText, Compass } from 'lucide-react';
import { Trip } from '../../types';
import { tripStorage } from '../../storage/tripStorage';
import { getTodayDateString } from '../../utils/date';

export interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: (newTrip: Trip) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated,
}) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>(['', '']);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = () => {
    setMembers([...members, '']);
  };

  const handleMemberChange = (index: number, val: string) => {
    const updated = [...members];
    updated[index] = val;
    setMembers(updated);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length <= 2) {
      setError('A trip requires at least two members.');
      return;
    }
    setError(null);
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide a trip title.');
      return;
    }

    const cleanMembers = members.map((m) => m.trim()).filter(Boolean);
    if (cleanMembers.length < 2) {
      setError('Please add at least two members for the trip.');
      return;
    }

    try {
      const newTrip = tripStorage.createTrip({
        title: cleanTitle,
        destination: destination.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description.trim() || undefined,
        memberNames: cleanMembers,
      });

      // Reset
      setTitle('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setMembers(['', '']);
      setError(null);

      onTripCreated(newTrip);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Trip"
      subtitle="Set up your group, define participants, and start logging shared expenses."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Trip Title */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
            Trip Title <span className="text-[#FDE047]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. Manali Snow Expedition, Goa Weekend Getaway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
            />
          </div>
        </div>

        {/* Destination & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>Destination</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Manali, India"
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

        {/* Members Management */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FDE047]" />
              <span className="text-xs uppercase tracking-widest font-bold text-white">
                Trip Members ({members.length}) <span className="text-[#FDE047]">*</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddMember}
              className="text-xs text-[#FDE047] hover:underline font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>

          <p className="text-[11px] text-neutral-400">
            Add everyone participating in this trip. You can also add more members later during the trip.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {members.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder={`Member ${idx + 1} Name`}
                  value={name}
                  onChange={(e) => handleMemberChange(idx, e.target.value)}
                  className="w-full bg-[#1F1F1F] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
                />
                {members.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>Description or Notes (Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Brief itinerary notes, hotel details, or trip goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} type="button" className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="cyber" type="submit" icon={<Compass className="w-4 h-4" />} className="w-full sm:w-auto">
            Create Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
};
