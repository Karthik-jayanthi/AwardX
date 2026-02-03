import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { Round, RoundEdge } from '../../../types/scheduleRounds';
import { WorkflowExtension } from '../../../types/roundExtensions';
import {
  applyWorkflowExtensionToProgram,
  getInstalledWorkflowExtensions,
  getMarketplaceExtensions,
  installWorkflowExtension,
  uninstallWorkflowExtension,
} from '../../../services/workflowExtensions';
import { Download, Trash2, Wand2, Sparkles, Search, Tag, Clock3, Layers } from 'lucide-react';

interface ExtensionsMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  existingRounds: Round[];
  existingEdges: RoundEdge[];
  onApplied: () => Promise<void> | void;
}

export const ExtensionsMarketplaceModal: React.FC<ExtensionsMarketplaceModalProps> = ({
  isOpen,
  onClose,
  programId,
  existingRounds,
  existingEdges,
  onApplied,
}) => {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [busyExtensionId, setBusyExtensionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installedState, setInstalledState] = useState(() => getInstalledWorkflowExtensions());

  useEffect(() => {
    if (!isOpen) return;
    setInstalledState(getInstalledWorkflowExtensions());
  }, [isOpen]);

  // Keep modal in sync if another tab modifies storage.
  useEffect(() => {
    if (!isOpen) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'scheduleRounds_workflow_extensions_installed_v1') {
        setInstalledState(getInstalledWorkflowExtensions());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isOpen]);

  const installedSet = useMemo(
    () => new Set(installedState.map(i => i.extensionId)),
    [installedState]
  );

  const marketplace = useMemo(() => {
    const all = getMarketplaceExtensions();
    const q = query.trim().toLowerCase();
    return all
      .filter(ext => {
        if (!q) return true;
        const hay = `${ext.name} ${ext.description} ${ext.tags.join(' ')} ${ext.author}`.toLowerCase();
        return hay.includes(q);
      })
      .filter(ext => {
        if (!activeTag) return true;
        return ext.tags.some(t => t.toLowerCase() === activeTag.toLowerCase());
      })
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [query, activeTag]);

  const allTags = useMemo(() => {
    const tags = new Map<string, number>();
    getMarketplaceExtensions().forEach(ext => {
      ext.tags.forEach(t => tags.set(t, (tags.get(t) || 0) + 1));
    });
    return Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [isOpen]);

  async function handleApply(ext: WorkflowExtension) {
    setError(null);
    setBusyExtensionId(ext.id);
    try {
      await applyWorkflowExtensionToProgram({
        extension: ext,
        programId,
        existingRounds,
        existingEdges,
      });
      await onApplied();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to apply extension.');
    } finally {
      setBusyExtensionId(null);
    }
  }

  function handleInstall(ext: WorkflowExtension) {
    setError(null);
    setBusyExtensionId(ext.id);
    try {
      installWorkflowExtension(ext);
      setInstalledState(getInstalledWorkflowExtensions());
    } finally {
      setBusyExtensionId(null);
    }
  }

  function handleUninstall(ext: WorkflowExtension) {
    setError(null);
    setBusyExtensionId(ext.id);
    try {
      uninstallWorkflowExtension(ext.id);
      setInstalledState(getInstalledWorkflowExtensions());
    } finally {
      setBusyExtensionId(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Extension Marketplace">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Flow templates you can install and apply</div>
            <div className="text-sm text-slate-500">
              Install adds it to your library. Apply creates rounds + edges in this program.
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-600">Search</label>
            <div className="mt-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Classic, compliance, public voting..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
              />
            </div>
          </div>
          <div className="md:w-56">
            <label className="text-xs font-semibold text-slate-600">Tag</label>
            <div className="mt-1 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <select
                value={activeTag || ''}
                onChange={(e) => setActiveTag(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
              >
                <option value="">All tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <div className="text-sm font-bold text-slate-800">Your installed extensions</div>
            </div>
            <div className="text-xs text-slate-500">{installedState.length} installed</div>
          </div>

          {installedState.length === 0 ? (
            <div className="text-sm text-slate-600">
              Nothing installed yet. Pick one below and hit <span className="font-semibold">Install</span>.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {installedState.map(i => (
                <span
                  key={i.extensionId}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  {i.extensionId}
                  <span className="text-[10px] text-slate-400 font-bold">v{i.version}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {marketplace.map(ext => {
            const installed = installedSet.has(ext.id);
            const isBusy = busyExtensionId === ext.id;
            const roundsCount = ext.template.rounds.length;
            const edgesCount = ext.template.edges.length;

            return (
              <div
                key={ext.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                  ext.featured ? 'border-indigo-200 shadow-indigo-500/5' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-base font-extrabold text-slate-900">{ext.name}</div>
                      {ext.featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Featured
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-100">
                        {ext.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{ext.description}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {ext.tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" /> {ext.estimatedSetupMinutes} min
                      </span>
                      <span>{roundsCount} rounds</span>
                      <span>{edgesCount} connections</span>
                      <span className="text-slate-400">by {ext.author}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {!installed ? (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => handleInstall(ext)}
                        className="shadow-lg shadow-indigo-500/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => handleUninstall(ext)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isBusy}
                          onClick={() => handleApply(ext)}
                          className="shadow-lg shadow-indigo-500/10"
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Apply
                        </Button>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-bold">
                      {installed ? 'Installed' : `v${ext.version}`}
                    </div>
                  </div>
                </div>

                <details className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Preview rounds
                  </summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ext.template.rounds.map(r => (
                      <div
                        key={r.templateId}
                        className="rounded-lg bg-white border border-slate-200 px-3 py-2"
                      >
                        <div className="text-xs font-extrabold text-slate-800">{r.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.type} • {r.evaluationLogic}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}; 

