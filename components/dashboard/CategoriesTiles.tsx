import React from 'react';
import { Category } from '../../services/models';
import { getChildCategories, getRootCategories } from '../../lib/categoryHierarchy';
import { Folder, Plus, FileText, Trash2 } from 'lucide-react';

interface TileProps {
    categories: Category[];
    onAddSub: (parentId: string) => void;
    onDelete: (id: string) => void;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
}

interface ChildRowProps {
    category: Category;
    categories: Category[];
    onAddSub: (parentId: string) => void;
    onDelete: (id: string) => void;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    depth?: number;
}

const ChildRow: React.FC<ChildRowProps> = ({ category, categories, onAddSub, onDelete, selectedIds, onToggleSelect, depth = 0 }) => {
    const children = getChildCategories(categories, category.id);

    return (
        <div className={depth > 0 ? 'ml-3 border-l-2 border-slate-100 pl-2' : undefined}>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2 hover:border-indigo-200 transition-colors">
                <input
                    type="checkbox"
                    checked={selectedIds.includes(category.id)}
                    onChange={() => onToggleSelect(category.id)}
                    className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <Folder className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700" title={category.title}>
                    {category.title}
                </span>
                {category.entriesCount > 0 && (
                    <span className="shrink-0 text-[10px] text-slate-400 flex items-center gap-0.5">
                        <FileText className="w-3 h-3" />
                        {category.entriesCount}
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => onAddSub(category.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                    title={`Add subcategory under ${category.title}`}
                >
                    + Sub
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(category.id)}
                    className="shrink-0 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title={`Delete ${category.title}`}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {children.length > 0 && (
                <div className="mt-1.5 space-y-1.5">
                    {children.map((child) => (
                        <ChildRow
                            key={child.id}
                            category={child}
                            categories={categories}
                            onAddSub={onAddSub}
                            onDelete={onDelete}
                            selectedIds={selectedIds}
                            onToggleSelect={onToggleSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface RootCategoryTileProps {
    category: Category;
    categories: Category[];
    onAddSub: (parentId: string) => void;
    onDelete: (id: string) => void;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
}

const RootCategoryTile: React.FC<RootCategoryTileProps> = ({ category, categories, onAddSub, onDelete, selectedIds, onToggleSelect }) => {
    const children = getChildCategories(categories, category.id);

    return (
        <article className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <header className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <input
                    type="checkbox"
                    checked={selectedIds.includes(category.id)}
                    onChange={() => onToggleSelect(category.id)}
                    className="self-center w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Folder className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900" title={category.title}>
                        {category.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {children.length} subcategor{children.length === 1 ? 'y' : 'ies'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onDelete(category.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                    title={`Delete ${category.title}`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </header>

            <div className="flex-1 p-3">
                {children.length > 0 ? (
                    <div className="space-y-2">
                        {children.map((child) => (
                            <ChildRow
                                key={child.id}
                                category={child}
                                categories={categories}
                                onAddSub={onAddSub}
                                onDelete={onDelete}
                                selectedIds={selectedIds}
                                onToggleSelect={onToggleSelect}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border-2 border-dashed border-slate-100 py-8 text-center text-xs text-slate-400">
                        No subcategories yet
                    </div>
                )}
            </div>

            <footer className="border-t border-slate-100 p-3">
                <button
                    type="button"
                    onClick={() => onAddSub(category.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-200 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Subcategory
                </button>
            </footer>
        </article>
    );
};

export const CategoriesTiles: React.FC<TileProps> = ({ categories, onAddSub, onDelete, selectedIds, onToggleSelect }) => {
    const roots = getRootCategories(categories);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roots.map((root) => (
                <RootCategoryTile
                    key={root.id}
                    category={root}
                    categories={categories}
                    onAddSub={onAddSub}
                    onDelete={onDelete}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                />
            ))}

            <button
                type="button"
                onClick={() => onAddSub('')}
                className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 text-slate-400 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
                <Plus className="mb-2 h-8 w-8 opacity-50" />
                <span className="text-xs font-bold">Create New Category</span>
            </button>
        </div>
    );
};
