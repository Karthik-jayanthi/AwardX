import React from 'react';
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../../Button';
import { JudgeGroup } from '../../../services/models';

interface GroupCardProps {
  group: JudgeGroup;
  activeCount: number;
  pendingCount: number;
  onAddJudge: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  activeCount,
  pendingCount,
  onAddJudge,
  onView,
  onEdit,
  onDelete,
}) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between min-h-[220px]">
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
        {group.description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-700">
            Active Judges: {activeCount}
          </span>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">
              Pending Invites: {pendingCount}
            </span>
          </div>
        )}
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" className="gap-2" onClick={onAddJudge}>
        <Plus className="w-4 h-4" /> Add Judge
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={onView}>
        <Eye className="w-4 h-4" /> View Members
      </Button>
      <Button variant="secondary" size="sm" className="gap-2" onClick={onEdit}>
        <Pencil className="w-4 h-4" /> Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-red-600 hover:bg-red-50"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  </div>
);
