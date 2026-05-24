import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Round } from '../../../types/scheduleRounds';
import {
  SCHEDULER_ROUND_TYPES,
  shortlistConfigToCriteria,
  roundUsesShortlist,
} from '../../../lib/roundScheduleUtils';

interface SimpleRoundEditorProps {
  round: Round;
  onSave: (round: Round) => Promise<void>;
  onClose: () => void;
}

export const SimpleRoundEditor: React.FC<SimpleRoundEditorProps> = ({ round, onSave, onClose }) => {
  const [form, setForm] = useState(round);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(round);
    setError(null);
  }, [round]);

  const startIso =
    form.startCondition.type === 'fixed_datetime' ? form.startCondition.datetime : '';
  const endIso = form.endCondition.type === 'fixed_datetime' ? form.endCondition.datetime : '';

  const showShortlist = roundUsesShortlist(form) || form.type === 'Shortlisting';

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const shortlistConfig = showShortlist
        ? { ...form.shortlistConfig, enabled: true }
        : { ...form.shortlistConfig, enabled: false };

      const payload: Round = {
        ...form,
        shortlistConfig,
        advancementCriteria: shortlistConfigToCriteria(shortlistConfig, form.type),
        advancementTrigger: form.advancementTrigger || 'manual',
        updatedAt: new Date().toISOString(),
        version: form.version + 1,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save round');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Edit round</h3>
          <p className="text-xs text-slate-500 mt-0.5">Timeline step {form.order + 1}</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Round name</label>
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</label>
          <select
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as Round['type'];
              const enabled = type === 'Shortlisting';
              setForm({
                ...form,
                type,
                shortlistConfig: { ...form.shortlistConfig, enabled: enabled || form.shortlistConfig.enabled },
              });
            }}
          >
            {SCHEDULER_ROUND_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Start</label>
            <input
              type="datetime-local"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={startIso ? startIso.slice(0, 16) : ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  startCondition: { type: 'fixed_datetime', datetime: new Date(e.target.value).toISOString() },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">End</label>
            <input
              type="datetime-local"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={endIso ? endIso.slice(0, 16) : ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  endCondition: { type: 'fixed_datetime', datetime: new Date(e.target.value).toISOString() },
                })
              }
            />
          </div>
        </div>

        {showShortlist && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-900">Shortlist rule</p>
            <p className="text-xs text-indigo-700/80">
              When you run shortlist, participants are ranked by score (or votes) and only the top entries advance to the next round.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    shortlistConfig: { ...form.shortlistConfig, enabled: true, method: 'percentage' },
                  })
                }
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                  form.shortlistConfig.method === 'percentage'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Top %
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    shortlistConfig: { ...form.shortlistConfig, enabled: true, method: 'fixed_count' },
                  })
                }
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                  form.shortlistConfig.method === 'fixed_count'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Top N
              </button>
            </div>
            <input
              type="number"
              min={1}
              max={form.shortlistConfig.method === 'percentage' ? 100 : 9999}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.shortlistConfig.value}
              onChange={(e) =>
                setForm({
                  ...form,
                  shortlistConfig: {
                    ...form.shortlistConfig,
                    enabled: true,
                    value: Number(e.target.value) || 1,
                  },
                })
              }
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      <div className="p-5 border-t border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};
