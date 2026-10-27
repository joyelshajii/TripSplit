import React, { useState } from 'react';
import { Trip } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Share2,
  Copy,
  Check,
  Eye,
  Edit3,
  MessageCircle,
  ShieldCheck,
  Info,
  Lock,
} from 'lucide-react';

export interface ShareTripModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  isReadOnly?: boolean;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  isOpen,
  trip,
  onClose,
  isReadOnly = false,
}) => {
  const [copiedType, setCopiedType] = useState<'collab' | 'view' | null>(null);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  // ONLY calculate the collaborator URL if the current user is an authorized collaborator
  const collabUrl = !isReadOnly
    ? `${baseUrl}?trip=${trip.id}${trip.editKey ? `&key=${trip.editKey}` : ''}`
    : '';
  const viewOnlyUrl = `${baseUrl}?trip=${trip.id}&view=readonly`;

  const copyToClipboard = async (url: string, type: 'collab' | 'view') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleShareWhatsApp = (url: string, isViewOnlyLink: boolean) => {
    const text = isViewOnlyLink
      ? `Check out the expenses and settlement summary for our trip "${trip.title}" on TeamSplit:\n${url}`
      : `Join and add your expenses for our trip "${trip.title}" on TeamSplit:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async (url: string, title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled share
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? 'Share View-Only Link' : 'Share Trip Link'}
    >
      <div className="space-y-5 text-white">
        {/* Intro Info Banner */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs text-neutral-300 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#FDE047] shrink-0 mt-0.5" />
          <div>
            {isReadOnly ? (
              <span>
                You are in <strong>View-Only mode</strong>. You can share this link so others can view expenses, balances, and download reports.
              </span>
            ) : (
              <span>
                Anyone with a link can open this trip in their browser. All expenses sync in real-time across devices!
              </span>
            )}
          </div>
        </div>

        {/* 1. Collaborator Link Card (ONLY VISIBLE TO AUTHORIZED COLLABORATORS) */}
        {!isReadOnly && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#FDE047]/30 hover:border-[#FDE047]/60 transition-colors space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-black text-[#FDE047] uppercase tracking-wider">
                <Edit3 className="w-4 h-4" />
                <span>Collaborator Link</span>
              </div>
              <span className="text-[10px] uppercase font-bold bg-[#FDE047]/20 text-[#FDE047] border border-[#FDE047]/30 px-2 py-0.5 rounded-full">
                Full Access
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              For travel companions. They can <strong>add their own expenses</strong>, edit items, add members, and settle up.
            </p>

            <div className="flex items-center gap-2 bg-[#0A0A0A] p-2 rounded-xl border border-white/10">
              <input
                type="text"
                readOnly
                value={collabUrl}
                className="bg-transparent text-xs text-neutral-300 w-full focus:outline-none select-all font-mono truncate"
              />
              <Button
                variant="cyber"
                size="sm"
                onClick={() => copyToClipboard(collabUrl, 'collab')}
                className="shrink-0"
                icon={
                  copiedType === 'collab' ? (
                    <Check className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-black" />
                  )
                }
              >
                {copiedType === 'collab' ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(collabUrl, false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={() =>
                    handleNativeShare(
                      collabUrl,
                      `Join ${trip.title} on TeamSplit`,
                      `Join and add expenses for "${trip.title}"`
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share...</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. View-Only Link Card (Clean Dark & Gold styling) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 transition-colors space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-black text-white uppercase tracking-wider">
              <Eye className="w-4 h-4 text-[#FDE047]" />
              <span>View-Only Link</span>
            </div>
            <span className="text-[10px] uppercase font-bold bg-white/10 text-neutral-300 border border-white/20 px-2 py-0.5 rounded-full">
              Read-Only
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            For spectators or auditors. Recipients can <strong>view balances, graphs, and download PDF reports</strong>, but cannot make any edits or add expenses.
          </p>

          <div className="flex items-center gap-2 bg-[#0A0A0A] p-2 rounded-xl border border-white/10">
            <input
              type="text"
              readOnly
              value={viewOnlyUrl}
              className="bg-transparent text-xs text-neutral-300 w-full focus:outline-none select-all font-mono truncate"
            />
            <Button
              variant="cyber"
              size="sm"
              onClick={() => copyToClipboard(viewOnlyUrl, 'view')}
              className="shrink-0"
              icon={
                copiedType === 'view' ? (
                  <Check className="w-3.5 h-3.5 text-black" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-black" />
                )
              }
            >
              {copiedType === 'view' ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleShareWhatsApp(viewOnlyUrl, true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() =>
                  handleNativeShare(
                    viewOnlyUrl,
                    `View ${trip.title} on TeamSplit`,
                    `View expenses and reports for "${trip.title}"`
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share...</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Real-time cloud sync is secured by Google Cloud Firestore.</span>
        </div>
      </div>
    </Modal>
  );
};
