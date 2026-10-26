import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { tripStorage } from '../../storage/tripStorage';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../types';
import { Tag, Plus, Trash2, Check, Lock, Sparkles } from 'lucide-react';

export interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelected?: (categoryName: string) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  onCategorySelected,
}) => {
  const [categories, setCategories] = useState<string[]>(tripStorage.getCategories());
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultCategorySet = new Set<string>(DEFAULT_EXPENSE_CATEGORIES);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const clean = newCatName.trim();
    if (!clean) {
      setError('Please enter a category name.');
      return;
    }

    if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      setError(`Category "${clean}" already exists.`);
      return;
    }

    const updated = tripStorage.addCategory(clean);
    setCategories(updated);
    setNewCatName('');
    setSuccessMsg(`Added "${clean}" successfully!`);

    if (onCategorySelected) {
      onCategorySelected(clean);
    }
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleDeleteCategory = (catName: string) => {
    if (defaultCategorySet.has(catName)) return;
    const updated = tripStorage.deleteCategory(catName);
    setCategories(updated);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Expense Categories"
      subtitle="Create custom categories for your trip or remove categories you no longer need."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {/* Add New Category Form */}
        <form onSubmit={handleAddCategory} className="space-y-3">
          <label className="block text-xs uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#FDE047]" />
            <span>Create New Category</span>
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Toll Tax, Parking, Sightseeing, Medical..."
                className="w-full bg-[#1F1F1F] text-white text-sm rounded-2xl pl-10 pr-4 py-2.5 border border-white/10 focus:outline-none focus:border-[#FDE047] transition-colors"
              />
            </div>
            <Button variant="cyber" size="sm" type="submit" icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
          {successMsg && (
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </p>
          )}
        </form>

        {/* Existing Categories List */}
        <div className="space-y-3">
          <span className="text-xs uppercase tracking-widest font-bold text-neutral-400 block">
            Available Categories ({categories.length})
          </span>

          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isDefault = defaultCategorySet.has(cat);
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isDefault
                      ? 'bg-white/5 border-white/10 text-neutral-200'
                      : 'bg-[#FDE047]/10 border-[#FDE047]/30 text-[#FDE047]'
                  }`}
                >
                  <span
                    onClick={() => {
                      if (onCategorySelected) {
                        onCategorySelected(cat);
                        onClose();
                      }
                    }}
                    className={onCategorySelected ? 'cursor-pointer hover:underline' : ''}
                    title={onCategorySelected ? 'Click to select this category' : undefined}
                  >
                    {cat}
                  </span>

                  {isDefault ? (
                    <span title="Standard default category">
                      <Lock className="w-3 h-3 text-neutral-500" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 -mr-1 hover:text-rose-400 text-neutral-400 transition-colors cursor-pointer rounded-full"
                      title={`Remove "${cat}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button variant="glass" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
