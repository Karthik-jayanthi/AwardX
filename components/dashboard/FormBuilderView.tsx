import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FormBuilder, FormField, FormPage, FormTheme, FormBuilderRef } from './FormBuilder';
import { db } from '../../services/database';
import { Program } from '../../services/models';
import { queryKeys } from '../../services/queryKeys';
import { Save, FileText, Plus, Trash2, CheckCircle2, XCircle, X, Link2, Copy, Check, PanelLeftClose, Layout, Settings, Star } from 'lucide-react';
import { FloatingPanelToggle } from './formBuilder/FloatingPanelToggle';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { useConfirm } from '../ConfirmDialog';

interface FormBuilderViewProps {
  activeEvent: Program | null;
}

interface SavedForm {
  id: string;
  name: string;
  programId: string;
  fields: FormField[];
  pages?: FormPage[];
  theme?: FormTheme;
  isActive: boolean;
  createdAt: string;
}

const ensureMandatoryAwardSelector = (
  fields: FormField[],
  pages: FormPage[],
  awardOptions: string[],
): FormField[] => {
  const firstPageId = pages[0]?.id || 'page-1';
  const options = awardOptions.length > 0 ? awardOptions : ['General'];
  const existing = fields.find((field) => field.type === 'award_selector');

  const mandatoryAwardField: FormField = existing
    ? {
        ...existing,
        label: existing.label || 'Award Selection',
        placeholder: existing.placeholder || 'Select award category...',
        required: true,
        pageId: existing.pageId || firstPageId,
        options,
      }
    : {
        id: `field-award-selector-${Date.now()}`,
        type: 'award_selector',
        label: 'Award Selection',
        placeholder: 'Select award category...',
        required: true,
        options,
        pageId: firstPageId,
      };

  const nonAwardFields = fields.filter((field) => field.type !== 'award_selector');
  return [mandatoryAwardField, ...nonAwardFields];
};

const mapDbFieldToFormField = (f: any): FormField => {
  const cfg = f.config || {};
  return {
    id: f.id,
    type: f.type,
    label: f.label,
    placeholder: cfg.placeholder || undefined,
    required: !!f.required,
    options: cfg.options || undefined,
    pageId: cfg.pageId || 'page-1',
    validation: cfg.validation || undefined,
  };
};

const mapFormFieldToDbPayload = (f: FormField, idx: number) => ({
  ...(f.id && !f.id.startsWith('field-') ? { id: f.id } : {}),
  label: f.label,
  type: f.type,
  required: !!f.required,
  config: {
    placeholder: f.placeholder,
    options: f.options,
    pageId: f.pageId,
    validation: f.validation,
  },
  sort_order: idx,
});

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({ activeEvent }) => {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogNode } = useConfirm();
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [currentForm, setCurrentForm] = useState<FormField[]>([]);
  const [currentPages, setCurrentPages] = useState<FormPage[]>([]);
  const [currentTheme, setCurrentTheme] = useState<FormTheme | undefined>(undefined);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [formBuilderKey, setFormBuilderKey] = useState(0);
  const formBuilderRef = useRef<FormBuilderRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const [awardOptions, setAwardOptions] = useState<string[]>([]);
  const [savedFormsOpen, setSavedFormsOpen] = useState(true);
  const [elementsPanelOpen, setElementsPanelOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeEvent?.id) {
      setActiveFormId(null);
      return;
    }
    void db.getActiveFormForProgram(activeEvent.id).then(setActiveFormId);
  }, [activeEvent?.id]);

  const handleSetProgramForm = async (formId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeEvent?.id) return;
    try {
      await db.setActiveFormForProgram(activeEvent.id, formId);
      setActiveFormId(formId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.programForms.active(activeEvent.id) });
    } catch (error) {
      console.error('Failed to set active form:', error);
    }
  };

  useEffect(() => {
    setPortalTarget(document.getElementById('dashboard-header-actions'));
  }, []);

  useEffect(() => {
    loadSavedForms();
    void (async () => {
      if (!activeEvent) return;
      const categories = await db.getCategories(activeEvent.id);
      // Build parent->child hierarchy for award options
      const parentCategories = categories.filter(c => !c.parentId);
      const childMap = new Map<string, typeof categories>();
      categories.forEach(c => {
        if (c.parentId) {
          const children = childMap.get(c.parentId) || [];
          children.push(c);
          childMap.set(c.parentId, children);
        }
      });

      const hierarchicalOptions: string[] = [];
      parentCategories.forEach(parent => {
        const children = childMap.get(parent.id) || [];
        if (children.length > 0) {
          // Add children under parent prefix
          children.forEach(child => {
            hierarchicalOptions.push(`${parent.title} \u2192 ${child.title}`);
          });
        } else {
          hierarchicalOptions.push(parent.title);
        }
      });

      // Also add orphan categories (children without visible parents)
      const allParentIds = new Set(parentCategories.map(p => p.id));
      categories.forEach(c => {
        if (c.parentId && !allParentIds.has(c.parentId)) {
          hierarchicalOptions.push(c.title);
        }
      });

      setAwardOptions(hierarchicalOptions.length > 0 ? hierarchicalOptions : categories.map(c => c.title));
    })();
  }, [activeEvent]);

  const loadSavedForms = async () => {
    if (!activeEvent) return;

    let forms = await db.getForms(activeEvent.id);
    if (forms.length === 0) {
      const created = await db.createForm({
        program_id: activeEvent.id,
        title: `${activeEvent.title} Submission Form`,
        description: '',
        is_active: false,
      });
      await db.setActiveFormForProgram(activeEvent.id, (created as any).id);
      forms = [created as any];
    }

    const primaryForm = (forms as any[]).find((form) => form.id === activeFormId) || (forms as any[])[0];
    if (!primaryForm) return;

    const fields = await db.getFormFields(primaryForm.id);
    const singleForm: SavedForm = {
      id: primaryForm.id,
      name: primaryForm.title,
      programId: primaryForm.program_id,
      fields: (fields as any[]).map(mapDbFieldToFormField),
      pages: primaryForm.pages || undefined,
      theme: primaryForm.theme || undefined,
      isActive: !!primaryForm.is_active,
      createdAt: primaryForm.created_at || primaryForm.updated_at || new Date().toISOString(),
    };

    setSavedForms([singleForm]);
    if (!selectedFormId || selectedFormId !== singleForm.id) {
      handleLoadForm(singleForm);
    }
  };

  const handleSave = async (fields: FormField[], pages: FormPage[], theme: FormTheme) => {
    // Prevent duplicate saves
    if (isSaving) return;

    const normalizedFields = ensureMandatoryAwardSelector(fields, pages, awardOptions);
    setCurrentForm(normalizedFields);
    setCurrentPages(pages);
    setCurrentTheme(theme);

    if (selectedFormId) {
      // Update existing form
      setIsSaving(true);
      setSaveMessage(null);
      try {
        await db.updateForm(selectedFormId, { pages, theme });
        await db.replaceFormFields(selectedFormId, normalizedFields.map(mapFormFieldToDbPayload));
        await loadSavedForms();
        setSaveMessage({ type: 'success', text: 'Form saved successfully!' });
        setTimeout(() => setSaveMessage(null), 5000);
      } catch (error: any) {
        setSaveMessage({ type: 'error', text: error?.message || 'Failed to save form. Please try again.' });
        setTimeout(() => setSaveMessage(null), 5000);
      } finally {
        setIsSaving(false);
      }
    } else {
      // New form - open modal to get name
      setIsSaveModalOpen(true);
    }
  };

  const handlePublishFromBuilder = async (fields: FormField[], pages: FormPage[], theme: FormTheme) => {
    if (!selectedFormId) {
      // Save first if no form selected
      handleSave(fields, pages, theme);
      return;
    }

    const targetForm = savedForms.find(f => f.id === selectedFormId);
    if (!targetForm) return;

    setSaveMessage(null);
    try {
      // Save the form first
      const normalizedFields = ensureMandatoryAwardSelector(fields, pages, awardOptions);
      await db.updateForm(selectedFormId, { pages, theme, is_active: !targetForm.isActive });
      await db.replaceFormFields(selectedFormId, normalizedFields.map(mapFormFieldToDbPayload));
      if (!targetForm.isActive && activeEvent?.id) {
        await db.setActiveFormForProgram(activeEvent.id, selectedFormId);
        setActiveFormId(selectedFormId);
        await queryClient.invalidateQueries({ queryKey: queryKeys.programForms.active(activeEvent.id) });
      }
      await loadSavedForms();
      setSaveMessage({
        type: 'success',
        text: targetForm.isActive ? 'Form unpublished.' : 'Form saved and published!'
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error?.message || 'Failed to publish form.' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleSaveNewForm = async () => {
    if (!activeEvent || !formName.trim() || isSaving) return;

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const newForm = await db.createForm({
        program_id: activeEvent.id,
        title: formName,
        description: '',
        is_active: false,
      });

      await db.updateForm((newForm as any).id, { pages: currentPages, theme: currentTheme });
      const normalizedFields = ensureMandatoryAwardSelector(currentForm, currentPages, awardOptions);
      await db.replaceFormFields((newForm as any).id, normalizedFields.map(mapFormFieldToDbPayload));

      setFormName('');
      setIsSaveModalOpen(false);
      setSelectedFormId((newForm as any).id);
      await loadSavedForms();
      setSaveMessage({ type: 'success', text: `Form "${formName}" saved successfully!` });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error?.message || 'Failed to save form. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadForm = (form: SavedForm) => {
    const normalizedFields = ensureMandatoryAwardSelector(form.fields, form.pages || currentPages || [], awardOptions);
    setCurrentForm(normalizedFields);
    setCurrentPages(form.pages || []);
    setCurrentTheme(form.theme);
    setSelectedFormId(form.id);
    setIsCreatingNew(false);
    // Force remount when loading a different form
    setFormBuilderKey(prev => prev + 1);
  };

  const handleDeleteForm = async (formId: string) => {
    const name = savedForms.find(f => f.id === formId)?.name || 'this form';
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description: 'This removes all form fields and settings. Existing submissions are not affected.',
      confirmLabel: 'Delete form',
    });
    if (!ok) return;

    setDeleteMessage(null);
    try {
      const formName = name;
      await db.deleteForm(formId);

      if (selectedFormId === formId) {
        setSelectedFormId(null);
        setCurrentForm([]);
      }
      await loadSavedForms();
      setDeleteMessage({ type: 'success', text: `Form "${formName}" deleted successfully!` });
      setTimeout(() => setDeleteMessage(null), 5000);
    } catch (error: any) {
      setDeleteMessage({ type: 'error', text: error?.message || 'Failed to delete form. Please try again.' });
      setTimeout(() => setDeleteMessage(null), 5000);
    }
  };

  const handleCopyLink = async (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetForm = savedForms.find(form => form.id === formId);
    if (!targetForm?.isActive) {
      setSaveMessage({ type: 'error', text: 'Publish the form to enable sharing.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    try {
      const baseUrl = window.location.origin;
      const formLink = `${baseUrl}/form/${formId}`;
      
      await navigator.clipboard.writeText(formLink);
      setCopiedFormId(formId);
      setTimeout(() => setCopiedFormId(null), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const baseUrl = window.location.origin;
      const formLink = `${baseUrl}/form/${formId}`;
      const textArea = document.createElement('textarea');
      textArea.value = formLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedFormId(formId);
      setTimeout(() => setCopiedFormId(null), 2000);
    }
  };

  const handleTogglePublish = async (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetForm = savedForms.find(form => form.id === formId);
    if (!targetForm) return;

    setSaveMessage(null);
    try {
      await db.updateForm(formId, { is_active: !targetForm.isActive });
      await loadSavedForms();
      setSaveMessage({
        type: 'success',
        text: targetForm.isActive ? 'Form unpublished.' : 'Form published.'
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error?.message || 'Failed to update publish status.' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleNewForm = () => {
    // Save current form if there are unsaved changes
    if (formBuilderRef.current) {
      const currentData = formBuilderRef.current.getCurrentFormData();
      const hasFormData = currentData.fields.length > 0;

      if (hasFormData && selectedFormId) {
        void (async () => {
          await db.updateForm(selectedFormId, { pages: currentData.pages, theme: currentData.theme });
          const normalizedFields = ensureMandatoryAwardSelector(currentData.fields, currentData.pages, awardOptions);
          await db.replaceFormFields(selectedFormId, normalizedFields.map(mapFormFieldToDbPayload));
          await loadSavedForms();
        })();
      }
    }
    
    // Clear and create new form
    setCurrentForm([]);
    setCurrentPages([]);
    setCurrentTheme(undefined);
    setSelectedFormId(null);
    setIsCreatingNew(true);
    // Force remount of FormBuilder to ensure complete reset
    setFormBuilderKey(prev => prev + 1);
  };

  if (!activeEvent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-500">Please select a program to build forms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {ConfirmDialogNode}
      {/* Success/Error Messages */}
      {(saveMessage || deleteMessage) && (
        <div className="px-4 py-2 z-50">
          {saveMessage && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-md ${
              saveMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{saveMessage.text}</span>
              </div>
              <button
                onClick={() => setSaveMessage(null)}
                className="ml-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {deleteMessage && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-md mt-2 ${
              deleteMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {deleteMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{deleteMessage.text}</span>
              </div>
              <button
                onClick={() => setDeleteMessage(null)}
                className="ml-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header and Controls Portal */}
      {portalTarget && createPortal(
        <div className="hidden md:flex items-center gap-4">
          {selectedFormId && (
            <button
              type="button"
              onClick={(e) => handleCopyLink(selectedFormId, e as any)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedFormId === selectedFormId ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
              {copiedFormId === selectedFormId ? 'Copied' : 'Copy form link'}
            </button>
          )}
        </div>,
        portalTarget
      )}

      <div className="relative flex flex-col lg:flex-row h-full min-h-0 flex-1">
        {/* Sidebar - Saved Forms List */}
        <div
          className={`flex-shrink-0 overflow-hidden transition-[width,max-height,opacity] duration-300 ease-in-out z-10 ${
            savedFormsOpen
              ? 'w-full lg:w-72 max-h-[38vh] lg:max-h-none opacity-100'
              : 'w-0 max-h-0 lg:max-h-none opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex h-full w-full lg:w-72 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-800">Event Form</h3>
            <button
              type="button"
              onClick={() => setSavedFormsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Collapse form panel"
              aria-label="Collapse form panel"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {savedForms.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Loading form…</p>
              </div>
            ) : (
              savedForms.map((form) => (
                <div
                  key={form.id}
                  className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900 truncate">{form.name}</p>
                  <p className="text-xs text-slate-500 mt-1">One form per event</p>
                  <div className="mt-3 flex items-center gap-2">
                    {form.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 border border-amber-100">
                        Draft
                      </span>
                    )}
                    {activeFormId === form.id && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                        <Star className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>

        {/* Main Form Builder Area */}
        <div className="relative flex-1 min-w-0 min-h-[48vh]">
          {!savedFormsOpen && (
            <FloatingPanelToggle
              side="left"
              label="Saved Forms"
              icon={<FileText className="h-3.5 w-3.5" />}
              onClick={() => setSavedFormsOpen(true)}
              className="top-[28%]"
            />
          )}
          {!elementsPanelOpen && (selectedFormId || isCreatingNew) && (
            <FloatingPanelToggle
              side="left"
              label="Form Elements"
              icon={<Layout className="h-3.5 w-3.5" />}
              onClick={() => setElementsPanelOpen(true)}
              className="top-[44%]"
            />
          )}
          {!propertiesPanelOpen && (selectedFormId || isCreatingNew) && (
            <FloatingPanelToggle
              side="right"
              label="Field Properties"
              icon={<Settings className="h-3.5 w-3.5" />}
              onClick={() => setPropertiesPanelOpen(true)}
              className="top-[44%]"
            />
          )}

          {selectedFormId || isCreatingNew ? (
            <FormBuilder
              key={formBuilderKey}
              ref={formBuilderRef}
              onSave={handleSave}
              onPublish={handlePublishFromBuilder}
              isPublished={savedForms.find(f => f.id === selectedFormId)?.isActive}
              initialFields={currentForm}
              initialPages={currentPages.length > 0 ? currentPages : undefined}
              initialTheme={currentTheme}
              isSaving={isSaving}
              paymentConfigured={!!(activeEvent?.paymentConfig?.enabled && activeEvent?.paymentConfig?.publicKey)}
              paymentProvider={activeEvent?.paymentConfig?.provider || 'Razorpay'}
              elementsPanelOpen={elementsPanelOpen}
              propertiesPanelOpen={propertiesPanelOpen}
              onElementsPanelOpenChange={setElementsPanelOpen}
              onPropertiesPanelOpenChange={setPropertiesPanelOpen}
            />
          ) : (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                <FileText className="w-8 h-8 text-indigo-500/50" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Select a Form</h3>
              <p className="max-w-xs mx-auto text-sm">Select a form from the sidebar to edit it, or create a new form to get started.</p>
              <Button className="mt-6" onClick={handleNewForm}>
                <Plus className="w-4 h-4 mr-2" /> Create New Form
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Form"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Form Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Employee Evaluation 2024"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewForm} disabled={!formName.trim() || isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

