import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Round, RoundType } from '../../../types/scheduleRounds';
import { Users, Globe, Shield, Settings, CheckCircle2, Clock, XCircle, MoreVertical } from 'lucide-react';

interface RoundNodeData {
  round: Round;
  onSelect: () => void;
  isSelected: boolean;
  onCreateChild?: () => void;
}

export const RoundNode: React.FC<NodeProps<RoundNodeData>> = ({ data }) => {
  const { round, onSelect, isSelected, onCreateChild } = data;

  const getRoundTypeIcon = (type: RoundType) => {
    switch (type) {
      case 'jury':
        return <Users className="w-3.5 h-3.5" />;
      case 'public':
        return <Globe className="w-3.5 h-3.5" />;
      case 'hybrid':
        return <Users className="w-3.5 h-3.5" />;
      case 'compliance':
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <Settings className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: Round['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-50';
      case 'scheduled':
        return 'text-blue-500 bg-blue-50';
      case 'completed':
        return 'text-indigo-500 bg-indigo-50';
      case 'cancelled':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-slate-400 bg-slate-100';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        relative w-[280px] rounded-xl border bg-white transition-all duration-200 group
        ${isSelected
          ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20 z-10'
          : 'border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5'
        }
      `}
    >
      {/* Input Handle - Styled like CategoriesWorkflow */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-200 !border-2 !border-white !rounded-full !shadow-sm hover:!bg-indigo-500 transition-colors -mt-1.5"
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
            `}>
              {getRoundTypeIcon(round.type)}
            </div>
            <div className="min-w-0">
              <h3 className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                {round.name}
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{round.type} Round</p>
            </div>
          </div>

          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent ${getStatusColor(round.status)}`}>
            {round.status}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {round.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {round.description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-2 py-1 rounded bg-slate-50 border border-slate-100">
              <Settings className="w-3 h-3" />
              <span className="capitalize">{round.evaluationLogic}</span>
            </div>
            {round.blindEvaluation && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-2 py-1 rounded bg-slate-50 border border-slate-100">
                <Globe className="w-3 h-3" />
                <span>Blind</span>
              </div>
            )}
          </div>

          {/* Add Child Button */}
          {onCreateChild && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateChild();
              }}
              className="mt-3 w-full py-1.5 text-[10px] font-bold text-center border border-dashed border-slate-200 rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors opacity-0 group-hover:opacity-100"
            >
              + Add Child Round
            </button>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !rounded-full !shadow-lg -mb-1.5 ring-2 ring-indigo-100"
      />
    </div>
  );
};
