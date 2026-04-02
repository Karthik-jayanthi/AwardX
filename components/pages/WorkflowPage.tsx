import React, { useState, useEffect } from 'react';
import { CategoriesWorkflow } from '../dashboard/CategoriesWorkflow';
import { db } from '../../services/database';
import { Category, Program } from '../../services/models';
import { useParams } from 'react-router-dom';

export const WorkflowPage: React.FC = () => {
    const { programId: programIdParam } = useParams<{ programId?: string }>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [program, setProgram] = useState<Program | null>(null);
    const [programId, setProgramId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            // Get program ID from route parameter or query string
            const urlParams = new URLSearchParams(window.location.search);
            const id = programIdParam || urlParams.get('programId') || urlParams.get('id');
            setProgramId(id);

            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                const [programs, loadedCategories] = await Promise.all([
                    db.getPrograms(),
                    db.getCategories(id),
                ]);
                const foundProgram = programs.find(p => p.id === id);
                setProgram(foundProgram || null);
                setCategories(loadedCategories);
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, [programIdParam]);

    const handleAddSub = (parentId: string) => {
        // In standalone mode, we can't add categories, but we'll handle it gracefully
        console.log('Add subcategory requested:', parentId);
        // Optionally, you could open a modal or redirect back to the main dashboard
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading workflow...</p>
                </div>
            </div>
        );
    }

    if (!programId || !program) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Program Not Found</h2>
                    <p className="text-slate-600">The workflow you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-slate-50">
            <CategoriesWorkflow categories={categories} onAddSub={handleAddSub} programId={programId} />
        </div>
    );
};

