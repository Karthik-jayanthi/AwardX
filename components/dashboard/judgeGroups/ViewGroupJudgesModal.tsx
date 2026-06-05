import React, { useState } from 'react';
import { Button } from '../../Button';
import { Modal } from '../../Modal';
import { Judge, JudgeGroup } from '../../../services/models';

interface ViewGroupJudgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: JudgeGroup | null;
  judges: Judge[];
  groups: JudgeGroup[];
  onRemove: (judgeId: string) => Promise<void>;
  onMove: (judgeId: string, targetGroupId: string) => Promise<void>;
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Invited: 'bg-amber-100 text-amber-700 border-amber-200',
  Completed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const STATUS_LABEL: Record<string, string> = {
  Active: 'Active',
  Invited: 'Invitation Pending',
  Completed: 'Completed',
};

export const ViewGroupJudgesModal: React.FC<ViewGroupJudgesModalProps> = ({
  isOpen,
  onClose,
  group,
  judges,
  groups,
  onRemove,
  onMove,
}) => {
  const [busyJudgeId, setBusyJudgeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableMoveGroups = groups.filter((g) => g.id !== group?.id);

  const handleMove = async (judgeId: string, targetGroupId: string) => {
    if (!targetGroupId) return;
    setBusyJudgeId(judgeId);
    setError(null);
    try {
      await onMove(judgeId, targetGroupId);
    } catch (err: any) {
      setError(err?.message || 'Failed to move judge.');
    } finally {
      setBusyJudgeId(null);
    }
  };

  const handleRemove = async (judgeId: string) => {
    setBusyJudgeId(judgeId);
    setError(null);
    try {
      await onRemove(judgeId);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove judge from group.');
    } finally {
      setBusyJudgeId(null);
    }
  };

  const activeJudges = judges.filter((j) => j.status === 'Active' || j.status === 'Completed');
  const pendingJudges = judges.filter((j) => j.status === 'Invited');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group ? `${group.name}` : 'View Judges'}>
      <div className="space-y-4">
        {/* Header stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Active: {activeJudges.length}
          </div>
          {pendingJudges.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Pending: {pendingJudges.length}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {judges.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 text-center">
            No judges have been added to this group yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-0.5">
            {judges.map((judge) => {
              const statusClass = STATUS_STYLES[judge.status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
              const statusLabel = STATUS_LABEL[judge.status] ?? judge.status;

              return (
                <div
                  key={judge.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Judge info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {judge.avatar ? (
                      <img
                        src={judge.avatar}
                        alt={judge.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {judge.name?.charAt(0).toUpperCase() || 'J'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{judge.name}</div>
                      <div className="text-sm text-slate-500 truncate">{judge.email}</div>
                      {judge.role && (
                        <div className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-400">
                          {judge.role}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex flex-col gap-2 sm:items-end shrink-0">
                    <span className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusClass}`}>
                      {statusLabel}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {availableMoveGroups.length > 0 && (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) handleMove(judge.id, e.target.value);
                            e.target.value = '';
                          }}
                          disabled={busyJudgeId === judge.id}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="" disabled>Move to group…</option>
                          {availableMoveGroups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 text-xs"
                        onClick={() => handleRemove(judge.id)}
                        disabled={busyJudgeId === judge.id}
                      >
                        {busyJudgeId === judge.id ? 'Working…' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
