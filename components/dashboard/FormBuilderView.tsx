import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FormBuilder, FormField, FormPage, FormTheme, FormBuilderRef } from './FormBuilder';
import { db, Program } from '../../services/demoDb';
import { Save, FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { Modal } from '../Modal';

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
  createdAt: string;
}

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({ activeEvent }) => {
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

  useEffect(() => {
    setPortalTarget(document.getElementById('dashboard-header-actions'));
  }, []);

  useEffect(() => {
    loadSavedForms();
  }, [activeEvent]);

  const loadSavedForms = () => {
    if (!activeEvent) return;
    const forms = db.getForms(activeEvent.id);
    const formsWithFields = forms.map(form => {
      const fields = db.getFormFields(form.id);

      return {
        id: form.id,
        name: form.name,
        programId: form.programId,
        fields: fields.map((f: any) => ({
          id: f.id,
          type: f.fieldType,
          label: f.label,
          placeholder: f.placeholder || undefined,
          required: f.isRequired,
          options: f.options || undefined,
          pageId: f.pageId || 'page-1',
          validation: f.validationRules || undefined,
        })),
        pages: form.pages || undefined,
        theme: form.theme || undefined,
        createdAt: form.createdAt || form.updatedAt,
      };
    });
    setSavedForms(formsWithFields);
  };

  const handleSave = (fields: FormField[], pages: FormPage[], theme: FormTheme) => {
    setCurrentForm(fields);
    setCurrentPages(pages);
    setCurrentTheme(theme);

    if (selectedFormId) {
      // Update existing form
      db.saveFormFields(selectedFormId, fields);
      const form = db.getFormById(selectedFormId);
      if (form) {
        db.saveForm({
          id: form.id,
          programId: form.programId,
          name: form.name,
          description: form.description,
          formType: form.formType,
          isActive: form.isActive,
          pages,
          theme,
        });
      }
      loadSavedForms();
    } else {
      // New form - open modal to get name
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveNewForm = () => {
    if (!activeEvent || !formName.trim()) return;

    const newForm = db.saveForm({
      programId: activeEvent.id,
      name: formName,
      description: '',
      formType: 'submission',
      isActive: true,
      pages: currentPages,
      theme: currentTheme,
    });

    // Save form fields
    db.saveFormFields(newForm.id, currentForm);

    setFormName('');
    setIsSaveModalOpen(false);
    setSelectedFormId(newForm.id);
    loadSavedForms();
  };

  const handleLoadForm = (form: SavedForm) => {
    setCurrentForm(form.fields);
    setCurrentPages(form.pages || []);
    setCurrentTheme(form.theme);
    setSelectedFormId(form.id);
    setIsCreatingNew(false);
    // Force remount when loading a different form
    setFormBuilderKey(prev => prev + 1);
  };

  const handleDeleteForm = (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;

    db.deleteForm(formId);

    if (selectedFormId === formId) {
      setSelectedFormId(null);
      setCurrentForm([]);
    }
    loadSavedForms();
  };

  const handleNewForm = () => {
    // Save current form if there are unsaved changes
    if (formBuilderRef.current) {
      const currentData = formBuilderRef.current.getCurrentFormData();
      
      // Check if there's actual form data to save (has fields or custom pages/theme)
      const hasFormData = currentData.fields.length > 0;
      
      if (hasFormData) {
        if (selectedFormId) {
          // Editing existing form - auto-save it
          db.saveFormFields(selectedFormId, currentData.fields);
          const form = db.getFormById(selectedFormId);
          if (form) {
            db.saveForm({
              id: form.id,
              programId: form.programId,
              name: form.name,
              description: form.description,
              formType: form.formType,
              isActive: form.isActive,
              pages: currentData.pages,
              theme: currentData.theme,
            });
          }
          loadSavedForms();
        } else if (isCreatingNew) {
          // New unsaved form - auto-save with default name
          if (!activeEvent) return;
          const defaultName = `Untitled Form ${new Date().toLocaleDateString()}`;
          const newForm = db.saveForm({
            programId: activeEvent.id,
            name: defaultName,
            description: '',
            formType: 'submission',
            isActive: true,
            pages: currentData.pages,
            theme: currentData.theme,
          });
          db.saveFormFields(newForm.id, currentData.fields);
          loadSavedForms();
        }
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
      {/* Header and Controls Portal */}
      {portalTarget && createPortal(
        <div className="flex items-center gap-4">
          {/* Add any other header items here if needed, currently reusing the space for primary actions */}
          <Button
            variant="primary" // Changed to primary for better visibility in header
            onClick={handleNewForm}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Form Link
          </Button>
        </div>,
        portalTarget
      )}

      <div className="flex h-full">
        {/* Sidebar - Saved Forms List */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-10">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="text-sm font-bold text-slate-800">Saved Forms</h3>
            <button onClick={handleNewForm} className="p-1.5 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors" title="Create New Form">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {savedForms.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No forms found</p>
                <p className="text-xs opacity-70 mt-1">Create a new form to get started</p>
              </div>
            ) : (
              savedForms.map((form) => (
                <div
                  key={form.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group relative ${selectedFormId === form.id
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/10'
                    : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  onClick={() => handleLoadForm(form)}
                >
                  <div className="pr-6">
                    <h4 className={`text-sm font-semibold truncate ${selectedFormId === form.id ? 'text-indigo-900' : 'text-slate-700'}`}>{form.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-medium">
                        {form.fields.length} Qs
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteForm(form.id);
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Form Builder Area */}
        <div className="flex-1 min-w-0 h-full">
          {selectedFormId || isCreatingNew ? (
            <FormBuilder
              key={formBuilderKey}
              ref={formBuilderRef}
              onSave={handleSave}
              initialFields={currentForm}
              initialPages={currentPages.length > 0 ? currentPages : undefined}
              initialTheme={currentTheme}
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
            <Button onClick={handleSaveNewForm} disabled={!formName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

