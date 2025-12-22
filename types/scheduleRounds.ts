// Core Data Models for Schedule & Rounds Workflow Engine

export type RoundType = 'jury' | 'public' | 'hybrid' | 'compliance' | 'custom';

export type EvaluationLogic = 
  | 'scoring' 
  | 'rubric' 
  | 'yes_no' 
  | 'weighted' 
  | 'ranking' 
  | 'consensus';

export type EvaluatorStrategy = 
  | 'all_judges' 
  | 'assigned_judges' 
  | 'random_assignment' 
  | 'category_based' 
  | 'custom';

export type StartCondition = 
  | { type: 'fixed_datetime'; datetime: string }
  | { type: 'after_previous'; roundId: string }
  | { type: 'manual_trigger' };

export type EndCondition = 
  | { type: 'fixed_datetime'; datetime: string }
  | { type: 'manual_close' }
  | { type: 'auto_close'; evaluationCount: number };

export type EdgeCondition = 
  | { type: 'always' }
  | { type: 'if_shortlisted' }
  | { type: 'if_score_gte'; score: number }
  | { type: 'manual_approval' };

export type ShortlistVisibility = 'admin' | 'judges' | 'public';

export interface ShortlistConfig {
  enabled: boolean;
  method: 'percentage' | 'fixed_count';
  value: number; // percentage (0-100) or count
  visibility: ShortlistVisibility[];
}

export interface Round {
  id: string;
  programId: string;
  name: string;
  type: RoundType;
  description?: string;
  evaluationLogic: EvaluationLogic;
  evaluatorStrategy: EvaluatorStrategy;
  blindEvaluation: boolean;
  startCondition: StartCondition;
  endCondition: EndCondition;
  shortlistConfig: ShortlistConfig;
  order: number; // For tile view ordering (visual only)
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  version: number; // For versioning round configurations
  metadata?: Record<string, any>; // For custom round types
}

export interface RoundEdge {
  id: string;
  programId: string;
  sourceRoundId: string;
  targetRoundId: string;
  condition: EdgeCondition;
  order: number; // For multiple edges from same source
  createdAt: string;
}

export interface RoundWorkflow {
  programId: string;
  rounds: Round[];
  edges: RoundEdge[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoundAuditLog {
  id: string;
  programId: string;
  roundId?: string;
  action: 'created' | 'updated' | 'deleted' | 'started' | 'ended' | 'transitioned';
  userId: string;
  timestamp: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

