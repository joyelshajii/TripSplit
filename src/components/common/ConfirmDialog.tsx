import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-6 pt-2">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className={`p-2.5 rounded-full shrink-0 ${isDestructive ? 'bg-rose-500/20 text-rose-400' : 'bg-yellow-400/20 text-yellow-300'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} type="button" className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'cyber'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            type="button"
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
