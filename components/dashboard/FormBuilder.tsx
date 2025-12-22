import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  GripVertical, Trash2, Settings, Eye, Save, Plus, Type, FileText,
  ImageIcon, Link2, List, Calendar, Mail, CheckSquare, Radio,
  MoreVertical, ArrowUp, ArrowDown, X, AlertCircle, Palette, Layers,
  ChevronLeft, ChevronRight, Layout, Edit3, Move
} from 'lucide-react';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'framer-motion';

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  pageId: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface FormTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  buttonTextColor: string;
  borderRadius: string;
  fontFamily: string;
}

interface FormBuilderProps {
  onSave?: (fields: FormField[], pages: FormPage[], theme: FormTheme) => void;
  initialFields?: FormField[];
  initialPages?: FormPage[];
  initialTheme?: FormTheme;
}

export interface FormBuilderRef {
  getCurrentFormData: () => { fields: FormField[]; pages: FormPage[]; theme: FormTheme };
}

const fieldTypes = [
  {
    group: 'Essentials',
    items: [
      { type: 'text', label: 'Short Text', icon: Type, description: 'Names, titles, etc.' },
      { type: 'textarea', label: 'Long Text', icon: FileText, description: 'Essays, bios, etc.' },
      { type: 'email', label: 'Email', icon: Mail, description: 'Contact email' },
      { type: 'date', label: 'Date', icon: Calendar, description: 'Event dates' },
    ]
  },
  {
    group: 'Choices',
    items: [
      { type: 'select', label: 'Dropdown', icon: List, description: 'Select one from list' },
      { type: 'radio', label: 'Single Choice', icon: Radio, description: 'Radio buttons' },
      { type: 'checkbox', label: 'Multi Choice', icon: CheckSquare, description: 'Checkboxes' },
    ]
  },
  {
    group: 'Media & More',
    items: [
      { type: 'file', label: 'File Upload', icon: ImageIcon, description: 'Images, Docs, PDF' },
      { type: 'url', label: 'Website', icon: Link2, description: 'External links' },
      { type: 'number', label: 'Number', icon: Layout, description: 'Quantities, scores' },
    ]
  }
];

const defaultTheme: FormTheme = {
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  borderColor: '#e2e8f0',
  buttonTextColor: '#ffffff',
  borderRadius: '0.5rem',
  fontFamily: 'Inter, sans-serif',
};

export const FormBuilder = forwardRef<FormBuilderRef, FormBuilderProps>(({
  onSave, 
  initialFields = [],
  initialPages,
  initialTheme = defaultTheme
}, ref) => {
  // --- State ---
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [pages, setPages] = useState<FormPage[]>(
    initialPages && initialPages.length > 0 
      ? initialPages 
      : [{ id: 'page-1', title: 'Page 1', order: 0 }]
  );
  const [theme, setTheme] = useState<FormTheme>(initialTheme);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page-1');

  const [activeTab, setActiveTab] = useState<'build' | 'design' | 'settings'>('build');
  const [isPreview, setIsPreview] = useState(false);
  const [previewPageIdx, setPreviewPageIdx] = useState(0);

  // --- Effects ---
  useEffect(() => {
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages);
      // Ensure specific page selection logic allows for correct ID
      setSelectedPageId(prev => {
        if (!initialPages.find(p => p.id === prev)) {
          return initialPages[0].id;
        }
        return prev;
      });
    } else {
      // Reset to default page when initialPages is empty or undefined
      const defaultPages = [{ id: 'page-1', title: 'Page 1', order: 0 }];
      setPages(defaultPages);
      setSelectedPageId('page-1');
    }
  }, [initialPages]);

  useEffect(() => {
    // Always set fields, even if empty array (to reset state)
    setFields(initialFields || []);
    setSelectedFieldId(null);
  }, [initialFields]);

  useEffect(() => {
    // Always set theme, reset to default if undefined
    setTheme(initialTheme || defaultTheme);
  }, [initialTheme]);

  // Expose current form data via ref
  useImperativeHandle(ref, () => ({
    getCurrentFormData: () => ({
      fields,
      pages,
      theme
    })
  }));

  // --- Actions ---
  const addField = (type: string) => {
    const fieldDef = fieldTypes.flatMap(g => g.items).find(t => t.type === type);
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: fieldDef?.label || 'New Field',
      placeholder: '',
      helpText: '',
      required: false,
      pageId: selectedPageId,
      ...(type === 'select' || type === 'radio' || type === 'checkbox'
        ? { options: ['Option 1', 'Option 2', 'Option 3'] }
        : {}),
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const duplicateField = (field: FormField, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`
    };
    setFields([...fields, newField]);
  };

  const addPage = () => {
    const newPage: FormPage = {
      id: `page-${Date.now()}`,
      title: `Page ${pages.length + 1}`,
      order: pages.length,
    };
    setPages([...pages, newPage]);
    setSelectedPageId(newPage.id);
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    if (!confirm('Delete page? Fields will move to the first page.')) return;

    const remaining = pages.filter(p => p.id !== pageId);
    const firstId = remaining[0].id;

    setPages(remaining);
    setFields(fields.map(f => f.pageId === pageId ? { ...f, pageId: firstId } : f));
    setSelectedPageId(firstId);
  };

  const handleSave = () => {
    if (onSave) onSave(fields, pages, theme);
  };

  // --- Rendering ---

  const renderFieldInput = (field: FormField, isReadOnly = false) => {
    const style = {
      borderColor: isReadOnly ? theme.borderColor : undefined,
      borderRadius: theme.borderRadius,
      fontFamily: theme.fontFamily,
    };

    switch (field.type) {
      case 'textarea':
        return <textarea disabled={isReadOnly} className="w-full p-3 border rounded-md bg-white/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-y min-h-[100px]" placeholder={field.placeholder} style={style} />;
      case 'select':
        return (
          <select disabled={isReadOnly} className="w-full p-3 border rounded-md bg-white/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" style={style}>
            <option>Select an option...</option>
            {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
          </select>
        );
      case 'radio':
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <input type={field.type} name={field.id} disabled={isReadOnly} className="w-4 h-4 accent-indigo-500" />
                <span className="text-sm text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'file':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderColor: theme.borderColor, borderRadius: theme.borderRadius }}>
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-600">Click to upload line</p>
            <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
          </div>
        );
      default:
        return <input type={field.type} disabled={isReadOnly} className="w-full p-3 border rounded-md bg-white/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder={field.placeholder} style={style} />;
    }
  };

  const renderEditCanvas = () => {
    const activeFields = fields.filter(f => f.pageId === selectedPageId);

        return (
      <div className="max-w-3xl mx-auto pb-20">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <input 
            value={pages.find(p => p.id === selectedPageId)?.title || ''}
            onChange={e => {
              const newPages = pages.map(p => p.id === selectedPageId ? { ...p, title: e.target.value } : p);
              setPages(newPages);
            }}
            className="text-3xl font-bold text-slate-800 w-full outline-none placeholder:text-slate-300 bg-transparent mb-2"
            placeholder="Page Title"
          />
          <input
            value={pages.find(p => p.id === selectedPageId)?.description || ''}
            onChange={e => {
              const newPages = pages.map(p => p.id === selectedPageId ? { ...p, description: e.target.value } : p);
              setPages(newPages);
            }}
            className="text-slate-500 w-full outline-none placeholder:text-slate-300 bg-transparent text-lg"
            placeholder="Add a description for this page..."
          />

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button onClick={() => deletePage(selectedPageId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete Page">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fields List */}
        <div className="space-y-4 min-h-[400px]">
          {activeFields.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center opacity-50">
              <Layout className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700">Empty Page</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Select elements from the sidebar to start building your form.</p>
        </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {activeFields.map((field) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`
                            relative bg-white rounded-xl border-2 transition-all cursor-pointer group
                            ${selectedFieldId === field.id
                      ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20 z-10'
                      : 'border-transparent hover:border-slate-200 shadow-sm hover:shadow-md'
                    }
                        `}
                >
                  <div className="p-6">
                    <div className="mb-3 flex justify-between items-start">
                    <div>
                        <label className="text-sm font-semibold text-slate-800 block mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.helpText && <p className="text-xs text-slate-500">{field.helpText}</p>}
                    </div>

                      {selectedFieldId === field.id && (
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 text-slate-400">
                          <button onClick={(e) => duplicateField(field, e)} className="p-1.5 hover:text-indigo-600 hover:bg-white rounded-md shadow-sm transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => deleteField(field.id, e)} className="p-1.5 hover:text-red-500 hover:bg-white rounded-md shadow-sm transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
                      )}
            </div>
                    <div className="pointer-events-none opacity-75">
                      {renderFieldInput(field)}
        </div>
      </div>

                  {/* Drag Handle Indicator */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 cursor-move p-1">
                    <GripVertical className="w-4 h-4" />
            </div>
                </motion.div>
              ))}
            </AnimatePresence>
            )}
          </div>

        {/* Add Page Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={addPage}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all hover:shadow-md"
          >
            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500">
              <Plus className="w-4 h-4" />
          </div>
            <span className="font-medium text-sm">Add New Page</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const currentPage = pages[previewPageIdx];
    const pageFields = fields.filter(f => f.pageId === currentPage.id);
    const isFirst = previewPageIdx === 0;
    const isLast = previewPageIdx === pages.length - 1;

    return (
      <div className="max-w-2xl mx-auto my-10 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[600px] flex flex-col" style={{ borderRadius: theme.borderRadius }}>
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="p-8 md:p-12 flex-1">
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>{currentPage.title}</h2>
            {currentPage.description && <p className="text-lg opacity-70" style={{ color: theme.textColor }}>{currentPage.description}</p>}
                    </div>

          <div className="space-y-8">
            {pageFields.map(field => (
              <div key={field.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.textColor }}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                {renderFieldInput(field, false)}
                {field.helpText && <p className="text-xs mt-2 opacity-60" style={{ color: theme.textColor }}>{field.helpText}</p>}
                        </div>
            ))}
                        </div>
                      </div>

        <div className="p-8 border-t bg-slate-50 flex justify-between items-center" style={{ borderColor: theme.borderColor }}>
                        <Button
            variant="ghost"
            disabled={isFirst}
            onClick={() => setPreviewPageIdx(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
          <div className="text-xs font-semibold text-slate-400 tracking-wider">
            STEP {previewPageIdx + 1} OF {pages.length}
                      </div>
                        <Button 
            variant={isLast ? 'primary' : 'outline'}
            onClick={() => isLast ? null : setPreviewPageIdx(p => p + 1)}
            style={isLast ? { backgroundColor: theme.primaryColor, color: theme.buttonTextColor } : {}}
          >
            {isLast ? 'Submit Application' : 'Next Step'}
            {!isLast && <ChevronRight className="w-4 h-4 ml-2" />}
                        </Button>
                </div>
              </div>
    );
  };

  if (isPreview) {
                    return (
      <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
        {/* Preview Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Eye className="w-5 h-5" />
                      </div>
            <div>
              <h3 className="font-bold text-slate-800">Preview Mode</h3>
              <p className="text-xs text-slate-500">Test your form experience</p>
                    </div>
                  </div>
          <Button variant="outline" onClick={() => setIsPreview(false)}>
            <X className="w-4 h-4 mr-2" /> Exit Preview
          </Button>
                  </div>
        <div className="p-6">
          {renderPreview()}
                </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50 font-sans">
      {/* 1. Left Sidebar: Toolkit */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            Form Elements
          </h2>
          </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {fieldTypes.map(group => (
            <div key={group.group}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">{group.group}</h3>
              <div className="grid gap-3">
                {group.items.map(item => (
                  <button
                    key={item.type}
                    onClick={() => addField(item.type)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                      <item.icon className="w-4 h-4" />
        </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-900">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.description}</div>
      </div>
                  </button>
                ))}
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button
              onClick={() => setActiveTab('build')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'build' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
              Builder
                          </button>
                          <button
              onClick={() => { setActiveTab('design'); setSelectedFieldId(null); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'design' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
              Design & Theme
                          </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4 bg-white border border-slate-200 rounded-lg px-2 py-1">
              {pages.map(page => (
                          <button
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${selectedPageId === page.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  {page.order + 1}
                          </button>
              ))}
              <button onClick={addPage} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

            <div className="h-6 w-px bg-slate-200 mx-2" />

            <Button variant="ghost" onClick={() => setIsPreview(true)}>
              <Eye className="w-4 h-4 mr-2" /> Preview
            </Button>
            <Button variant="primary" onClick={handleSave} className="shadow-lg shadow-indigo-500/20">
              <Save className="w-4 h-4 mr-2" /> Save Form
            </Button>
                    </div>
                  </div>

        {/* Builder Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {renderEditCanvas()}
                    </div>
                  </div>

      {/* 3. Right Sidebar: Properties */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl shadow-slate-200/50">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
            {activeTab === 'design' ? 'Theme Settings' : selectedFieldId ? 'Field Properties' : 'Page Settings'}
          </h2>
                  </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'design' ? (
            <div className="space-y-6">
                  <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase">Brand Colors</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Primary</label>
                    <div className="flex items-center gap-2 border p-2 rounded-lg">
                      <input type="color" value={theme.primaryColor} onChange={e => setTheme({ ...theme, primaryColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                      <span className="text-xs font-mono">{theme.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Background</label>
                    <div className="flex items-center gap-2 border p-2 rounded-lg">
                      <input type="color" value={theme.backgroundColor} onChange={e => setTheme({ ...theme, backgroundColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                      <span className="text-xs font-mono">{theme.backgroundColor}</span>
                    </div>
                  </div>
                    </div>
                  </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase">Text Typography</label>
                <select
                  value={theme.fontFamily}
                  onChange={e => setTheme({ ...theme, fontFamily: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm bg-white"
                >
                  <option value="Inter, sans-serif">Inter (Modern)</option>
                  <option value="serif">Serif (Elegant)</option>
                  <option value="monospace">Monospace (Technical)</option>
                </select>
                </div>

                  <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase">Style</label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-slate-600">Rounded Corners</span>
                      <select
                    value={theme.borderRadius}
                    onChange={e => setTheme({ ...theme, borderRadius: e.target.value })}
                    className="text-sm border-none bg-transparent text-right font-medium text-indigo-600 focus:ring-0 cursor-pointer"
                  >
                    <option value="0px">None</option>
                    <option value="0.5rem">Medium</option>
                    <option value="1rem">Large</option>
                    <option value="9999px">Full</option>
                      </select>
                    </div>
              </div>
            </div>
          ) : selectedFieldId ? (
            // Field Properties
            (() => {
              const field = fields.find(f => f.id === selectedFieldId);
              if (!field) return null;
              return (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Label</label>
                      <input
                        value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Placeholder</label>
                      <input
                      value={field.placeholder}
                      onChange={e => updateField(field.id, { placeholder: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Help Text</label>
                    <textarea
                      value={field.helpText}
                      onChange={e => updateField(field.id, { helpText: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[80px]"
                    />
                  </div>

                  {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Options</label>
                      <div className="space-y-2">
                        {field.options?.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={opt}
                              onChange={e => {
                                const newOpts = [...(field.options || [])];
                                newOpts[i] = e.target.value;
                                updateField(field.id, { options: newOpts });
                              }}
                              className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                            />
                            <button
                              onClick={() => {
                                const newOpts = field.options?.filter((_, idx) => idx !== i);
                                updateField(field.id, { options: newOpts });
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-2"
                        >
                          <Plus className="w-3 h-3" /> Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${field.required ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                        {field.required && <CheckSquare className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={field.required}
                        onChange={e => updateField(field.id, { required: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 group-hover:text-indigo-700 transition-colors">Required Field</span>
                    </label>
                  </div>
                  </div>
              );
            })()
          ) : (
            // Page Properties
            <div className="text-center py-10 opacity-50">
              <Settings className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">Select a field to edit its properties, or switch to the Design tab to customize the theme.</p>
          </div>
      )}
        </div>
      </div>
    </div>
  );
});
