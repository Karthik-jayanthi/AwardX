import React, { useCallback, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Round, RoundEdge, RoundType } from '../../../types/scheduleRounds';
import { RoundConfigurationPanel } from './RoundConfigurationPanel';
import { RoundNode } from './RoundNode';
import { Plus } from 'lucide-react';
import { Button } from '../../Button';

interface WorkflowViewProps {
  rounds: Round[];
  edges: RoundEdge[];
  selectedRoundId: string | null;
  onRoundSelect: (roundId: string | null) => void;
  onRoundUpdate: (round: Round) => void;
  onRoundDelete: (roundId: string) => void;
  onEdgeCreate: (edge: RoundEdge) => void;
  onEdgeDelete: (edgeId: string) => void;
  programId: string;
}

// Define nodeTypes outside component to avoid recreation warning
const nodeTypes = {
  roundNode: RoundNode,
};


export const WorkflowView: React.FC<WorkflowViewProps> = ({
  rounds,
  edges,
  selectedRoundId,
  onRoundSelect,
  onRoundUpdate,
  onRoundDelete,
  onEdgeCreate,
  onEdgeDelete,
  programId,
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reactFlowWrapperRef = useRef<any>(null);

  // Convert edges to React Flow edges with dotted flowing lines
  const initialEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceRoundId,
      target: edge.targetRoundId,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#6366f1',
        strokeWidth: 2,
        strokeDasharray: '8,8',
        strokeLinecap: 'round',
        opacity: 0.8,
      },
      className: 'flow-line',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 20,
        height: 20,
      },
      label: getEdgeLabel(edge.condition),
      labelStyle: { fill: '#6366f1', fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
    }));
  }, [edges]);

  // Convert rounds to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return rounds.map((round, index) => ({
      id: round.id,
      type: 'roundNode',
      position: {
        x: (index % 3) * 350 + 100,
        y: Math.floor(index / 3) * 300 + 100,
      },
      data: {
        round,
        onSelect: () => onRoundSelect(round.id),
        isSelected: selectedRoundId === round.id,
      },
    }));
  }, [rounds, selectedRoundId, onRoundSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleCreateChildRound = useCallback((parentRoundId: string) => {
    const newRound: Round = {
      id: `round-${Date.now()}`,
      programId,
      name: 'New Round',
      type: 'jury',
      evaluationLogic: 'scoring',
      evaluatorStrategy: 'all_judges',
      blindEvaluation: false,
      startCondition: { type: 'after_previous', roundId: parentRoundId },
      endCondition: { type: 'manual_close' },
      shortlistConfig: {
        enabled: false,
        method: 'percentage',
        value: 50,
        visibility: ['admin'],
      },
      order: rounds.length,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    onRoundUpdate(newRound);

    // Create edge from parent to child
    const newEdge: RoundEdge = {
      id: `edge-${Date.now()}`,
      programId,
      sourceRoundId: parentRoundId,
      targetRoundId: newRound.id,
      condition: { type: 'always' },
      order: edges.filter(e => e.sourceRoundId === parentRoundId).length,
      createdAt: new Date().toISOString(),
    };

    onEdgeCreate(newEdge);
    onRoundSelect(newRound.id);
  }, [programId, rounds.length, edges, onRoundUpdate, onEdgeCreate, onRoundSelect]);

  // Update node data with onCreateChild callback
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onCreateChild: () => handleCreateChildRound(node.id as string),
        },
      }))
    );
  }, [handleCreateChildRound, setNodes]);

  // Update nodes when rounds change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when edges change
  React.useEffect(() => {
    setFlowEdges(initialEdges);
  }, [initialEdges, setFlowEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const newEdge: RoundEdge = {
        id: `edge-${Date.now()}`,
        programId,
        sourceRoundId: params.source,
        targetRoundId: params.target,
        condition: { type: 'always' },
        order: edges.filter(e => e.sourceRoundId === params.source).length,
        createdAt: new Date().toISOString(),
      };

      onEdgeCreate(newEdge);
      setFlowEdges((eds) => addEdge(params, eds));
    },
    [programId, edges, onEdgeCreate, setFlowEdges]
  );

  const selectedRound = rounds.find(r => r.id === selectedRoundId);

  return (
    <div className="relative w-full h-full bg-slate-50 group">
      <style>{`
            @keyframes flow {
               to {
                  stroke-dashoffset: -20;
               }
            }
            .flow-line {
               animation: flow 1s linear infinite;
            }
            .react-flow__edge-path {
               animation: flow 1s linear infinite;
            }
         `}</style>

      {/* Grid Background - Matching CategoriesWorkflow exactly */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      />

      <ReactFlow
        ref={reactFlowWrapperRef}
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onRoundSelect(node.id as string)}
        onPaneClick={() => onRoundSelect(null)}
        onMove={(_, viewport) => {
          setOffset({ x: viewport.x, y: viewport.y });
          setScale(viewport.zoom);
        }}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDasharray: '8,8',
            strokeLinecap: 'round',
            opacity: 0.8,
          },
          className: 'flow-line',
        }}
      >
        <Controls className="!bg-white !shadow-lg !border !border-slate-100 !rounded-xl !p-1 !hidden md:!flex !flex-col !gap-1" />

        <MiniMap
          nodeColor={(node) => {
            const round = rounds.find(r => r.id === node.id);
            return getRoundStatusColor(round?.status || 'draft');
          }}
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!bg-white !border !border-slate-200 !shadow-lg !rounded-xl overflow-hidden"
        />
      </ReactFlow>



      {/* Configuration Panel */}
      {selectedRound && (
        <RoundConfigurationPanel
          round={selectedRound}
          onUpdate={onRoundUpdate}
          onDelete={() => {
            onRoundDelete(selectedRound.id);
            onRoundSelect(null);
          }}
          onClose={() => onRoundSelect(null)}
        />
      )}
    </div>
  );
};

function getEdgeLabel(condition: RoundEdge['condition']): string {
  switch (condition.type) {
    case 'always':
      return '';
    case 'if_shortlisted':
      return 'Shortlist';
    case 'if_score_gte':
      return `≥ ${condition.score}`;
    case 'manual_approval':
      return 'Manual';
    default:
      return '';
  }
}

function getRoundStatusColor(status: Round['status']): string {
  switch (status) {
    case 'draft':
      return '#94a3b8';
    case 'scheduled':
      return '#3b82f6';
    case 'active':
      return '#10b981';
    case 'completed':
      return '#6366f1';
    case 'cancelled':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}
