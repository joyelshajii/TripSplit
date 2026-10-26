import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { tripStorage } from '../../storage/tripStorage';
import { Download, Upload, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onDataChanged }) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const backup = tripStorage.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tripsplit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `Exported ${backup.trips.length} trips, ${backup.members.length} members, and ${backup.expenses.length} expenses successfully.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = tripStorage.importBackup(text, importMode);
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${result.tripsCount} trips, ${result.membersCount} members, and ${result.expensesCount} expenses!`,
        });
        onDataChanged();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to import backup file';
        setStatusMessage({ type: 'error', text: msg });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStatusMessage(null);
        onClose();
      }}
      title="Backup & Restore Data"
      subtitle="Export your trip data to a JSON file or restore from a previous backup."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            )}
            <p className="text-xs sm:text-sm">{statusMessage.text}</p>
          </div>
        )}

        {/* Export Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Download className="w-4 h-4 text-[#FDE047]" />
            <span>Export All Trips Data</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Download a portable JSON backup file containing all your trips, member records, expense history, and settlement confirmations.
          </p>
          <Button variant="cyber" size="sm" onClick={handleExport} icon={<Download className="w-4 h-4" />} className="w-full sm:w-auto">
            Download JSON Backup
          </Button>
        </div>

        {/* Import Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Upload className="w-4 h-4 text-[#FDE047]" />
            <span>Import Backup Data</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Restore trips from an existing JSON backup. Choose whether to merge with your current data or replace it.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="accent-[#FDE047]"
              />
              <span>Merge with existing (Safe ID collision protection)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-rose-500"
              />
              <span>Replace existing data</span>
            </label>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <Button
            variant="void"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Select Backup File to Import
          </Button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Trip data is stored securely in your browser's localStorage and never sent to external servers.</span>
        </div>
      </div>
    </Modal>
  );
};
