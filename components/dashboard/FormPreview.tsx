import React, { useState } from 'react';
import { FormField, FormPage, FormTheme } from './FormBuilder';
import { Button } from '../Button';
import { ChevronLeft, ChevronRight, Eye, UploadCloud } from 'lucide-react';

interface FormPreviewProps {
  fields: FormField[];
  pages: FormPage[];
  theme?: FormTheme;
}

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

export const FormPreview: React.FC<FormPreviewProps> = ({ fields, pages, theme = defaultTheme }) => {
  const [previewPageIdx, setPreviewPageIdx] = useState(0);
  const displayPages = pages.length > 0 ? pages : [{ id: 'page-1', title: 'Page 1', order: 0 }];
  const currentPage = displayPages[previewPageIdx];
  const pageFields = fields.filter(f => f.pageId === currentPage.id);
  const isFirst = previewPageIdx === 0;
  const isLast = previewPageIdx === displayPages.length - 1;

  const renderFieldInput = (field: FormField) => {
    const style = {
      borderColor: theme.borderColor,
      borderRadius: theme.borderRadius,
      color: theme.textColor,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            disabled
            className="w-full p-3 border rounded-md bg-white/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
            placeholder={field.placeholder}
            rows={4}
            style={style}
          />
        );
      case 'select':
        return (
          <select disabled className="w-full p-3 border rounded-md bg-white/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" style={style}>
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={field.id} disabled className="w-4 h-4 text-indigo-600" />
                <span style={{ color: theme.textColor }}>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" disabled className="w-4 h-4 text-indigo-600 rounded" />
                <span style={{ color: theme.textColor }}>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'file':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50/50" style={{ borderColor: theme.borderColor, borderRadius: theme.borderRadius }}>
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-600">File upload field</p>
            <p className="text-xs text-slate-400 mt-1">Preview only</p>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            disabled
            className="w-full p-3 border rounded-md bg-white/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            placeholder={field.placeholder}
            style={style}
          />
        );
    }
  };

  return (
    <div className="h-full bg-slate-50 rounded-xl border border-slate-200 overflow-y-auto">
      <div className="max-w-2xl mx-auto my-10 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[600px] flex flex-col" style={{ borderRadius: theme.borderRadius }}>
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="p-8 md:p-12 flex-1">
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
              {currentPage.title}
            </h2>
            {currentPage.description && (
              <p className="text-lg opacity-70" style={{ color: theme.textColor }}>
                {currentPage.description}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {pageFields.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">This page has no fields</p>
              </div>
            ) : (
              pageFields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: theme.textColor }}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderFieldInput(field)}
                  {field.helpText && (
                    <p className="text-xs mt-2 opacity-60" style={{ color: theme.textColor }}>
                      {field.helpText}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {displayPages.length > 1 && (
          <div className="p-8 border-t bg-slate-50 flex justify-between items-center" style={{ borderColor: theme.borderColor }}>
            <Button
              variant="ghost"
              disabled={isFirst}
              onClick={() => setPreviewPageIdx(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="text-xs font-semibold text-slate-400 tracking-wider">
              STEP {previewPageIdx + 1} OF {displayPages.length}
            </div>
            <Button
              variant={isLast ? 'primary' : 'outline'}
              onClick={() => setPreviewPageIdx(p => Math.min(displayPages.length - 1, p + 1))}
              style={isLast ? { backgroundColor: theme.primaryColor, color: theme.buttonTextColor } : {}}
            >
              {isLast ? 'Submit Application' : 'Next Step'}
              {!isLast && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

