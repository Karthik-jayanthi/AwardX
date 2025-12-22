import React, { useState, useEffect } from 'react';
import { Round, RoundType, EvaluationLogic, EvaluatorStrategy, StartCondition, EndCondition, EdgeCondition, ShortlistConfig } from '../../../types/scheduleRounds';
import { X, Save, Trash2, Calendar, Users, Eye, EyeOff, Settings } from 'lucide-react';
import { Button } from '../../Button';
import { motion, AnimatePresence } from 'framer-motion';

interface RoundConfigurationPanelProps {
  round: Round;
  onUpdate: (round: Round) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const RoundConfigurationPanel: React.FC<RoundConfigurationPanelProps> = ({
  round,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [formData, setFormData] = useState<Round>(round);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync formData when round prop changes
  useEffect(() => {
    setFormData(round);
    setHasChanges(false);
    setError(null);
  }, [round]);

  const handleChange = (field: keyof Round, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleStartConditionChange = (condition: StartCondition) => {
    handleChange('startCondition', condition);
  };

  const handleEndConditionChange = (condition: EndCondition) => {
    handleChange('endCondition', condition);
  };

  const handleShortlistConfigChange = (config: Partial<ShortlistConfig>) => {
    handleChange('shortlistConfig', { ...formData.shortlistConfig, ...config });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const roundToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
        version: formData.version + 1,
      };
      await onUpdate(roundToSave);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save round');
      console.error('Error saving round:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900">Round Configuration</h3>
            <p className="text-xs text-slate-500 mt-1">Configure round settings</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Basic Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Round Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Round Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as RoundType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="jury">Jury</option>
                  <option value="public">Public</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="compliance">Compliance</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </section>

          {/* Evaluation Settings */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Evaluation Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Evaluation Logic</label>
                <select
                  value={formData.evaluationLogic}
                  onChange={(e) => handleChange('evaluationLogic', e.target.value as EvaluationLogic)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="scoring">Scoring</option>
                  <option value="rubric">Rubric</option>
                  <option value="yes_no">Yes/No</option>
                  <option value="weighted">Weighted</option>
                  <option value="ranking">Ranking</option>
                  <option value="consensus">Consensus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Evaluator Strategy</label>
                <select
                  value={formData.evaluatorStrategy}
                  onChange={(e) => handleChange('evaluatorStrategy', e.target.value as EvaluatorStrategy)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="all_judges">All Judges</option>
                  <option value="assigned_judges">Assigned Judges</option>
                  <option value="random_assignment">Random Assignment</option>
                  <option value="category_based">Category Based</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blindEvaluation"
                  checked={formData.blindEvaluation}
                  onChange={(e) => handleChange('blindEvaluation', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="blindEvaluation" className="text-sm text-slate-700 flex items-center gap-2">
                  {formData.blindEvaluation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Blind Evaluation
                </label>
              </div>
            </div>
          </section>

          {/* Start Condition */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Start Condition</h4>
            <div className="space-y-3">
              <select
                value={formData.startCondition.type}
                onChange={(e) => {
                  const type = e.target.value;
                  let condition: StartCondition;
                  if (type === 'fixed_datetime') {
                    condition = { type: 'fixed_datetime', datetime: new Date().toISOString() };
                  } else if (type === 'after_previous') {
                    condition = { type: 'after_previous', roundId: '' };
                  } else {
                    condition = { type: 'manual_trigger' };
                  }
                  handleStartConditionChange(condition);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="fixed_datetime">Fixed Date/Time</option>
                <option value="after_previous">After Previous Round</option>
                <option value="manual_trigger">Manual Admin Trigger</option>
              </select>
              {formData.startCondition.type === 'fixed_datetime' && (
                <input
                  type="datetime-local"
                  value={formData.startCondition.datetime ? new Date(formData.startCondition.datetime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleStartConditionChange({ type: 'fixed_datetime', datetime: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              )}
            </div>
          </section>

          {/* End Condition */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">End Condition</h4>
            <div className="space-y-3">
              <select
                value={formData.endCondition.type}
                onChange={(e) => {
                  const type = e.target.value;
                  let condition: EndCondition;
                  if (type === 'fixed_datetime') {
                    condition = { type: 'fixed_datetime', datetime: new Date().toISOString() };
                  } else if (type === 'auto_close') {
                    condition = { type: 'auto_close', evaluationCount: 10 };
                  } else {
                    condition = { type: 'manual_close' };
                  }
                  handleEndConditionChange(condition);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="fixed_datetime">Fixed Date/Time</option>
                <option value="manual_close">Manual Close</option>
                <option value="auto_close">Auto-close (Evaluation Count)</option>
              </select>
              {formData.endCondition.type === 'fixed_datetime' && (
                <input
                  type="datetime-local"
                  value={formData.endCondition.datetime ? new Date(formData.endCondition.datetime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleEndConditionChange({ type: 'fixed_datetime', datetime: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              )}
              {formData.endCondition.type === 'auto_close' && (
                <input
                  type="number"
                  value={formData.endCondition.evaluationCount}
                  onChange={(e) => handleEndConditionChange({ type: 'auto_close', evaluationCount: parseInt(e.target.value) || 0 })}
                  placeholder="Evaluation count"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              )}
            </div>
          </section>

          {/* Shortlist Configuration */}
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Shortlist Configuration</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shortlistEnabled"
                  checked={formData.shortlistConfig.enabled}
                  onChange={(e) => handleShortlistConfigChange({ enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="shortlistEnabled" className="text-sm text-slate-700">
                  Announce Shortlist after this round
                </label>
              </div>
              {formData.shortlistConfig.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Method</label>
                    <select
                      value={formData.shortlistConfig.method}
                      onChange={(e) => handleShortlistConfigChange({ method: e.target.value as 'percentage' | 'fixed_count' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_count">Fixed Count</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {formData.shortlistConfig.method === 'percentage' ? 'Percentage' : 'Count'}
                    </label>
                    <input
                      type="number"
                      value={formData.shortlistConfig.value}
                      onChange={(e) => handleShortlistConfigChange({ value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      min={0}
                      max={formData.shortlistConfig.method === 'percentage' ? 100 : undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Visibility</label>
                    <div className="space-y-2">
                      {(['admin', 'judges', 'public'] as const).map((visibility) => (
                        <label key={visibility} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.shortlistConfig.visibility.includes(visibility)}
                            onChange={(e) => {
                              const current = formData.shortlistConfig.visibility;
                              const updated = e.target.checked
                                ? [...current, visibility]
                                : current.filter(v => v !== visibility);
                              handleShortlistConfigChange({ visibility: updated });
                            }}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700 capitalize">{visibility}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!hasChanges || isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

