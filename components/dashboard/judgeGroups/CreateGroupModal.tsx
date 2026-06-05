import React, { useEffect, useState } from 'react';
import { Button } from '../../Button';
import { Modal } from '../../Modal';
import { JudgeGroup } from '../../../services/models';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; description?: string }) => Promise<void>;
  existingGroups: JudgeGroup[];
  initialGroup?: JudgeGroup | null;
  isSaving?: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingGroups,
  initialGroup,
  isSaving = false,
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialGroup?.name ?? '');
      setDescription(initialGroup?.description ?? '');
      setError(null);
    }
  }, [isOpen, initialGroup]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Group name cannot be empty.');
      return;
    }

    const duplicate = existingGroups.some((group) =>
      group.name.trim().toLowerCase() === trimmedName.toLowerCase() && group.id !== initialGroup?.id,
    );
    if (duplicate) {
      setError('A group with that name already exists.');
      return;
    }

    try {
      setError(null);
      await onSave({ name: trimmedName, description: description.trim() || undefined });
    } catch (err: any) {
      setError(err?.message || 'Failed to save group.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialGroup ? 'Edit Judge Group' : 'Create Judge Group'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Group Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description <span className="text-slate-400">(optional)</span></label>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialGroup ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
