import { Round, RoundEdge } from './scheduleRounds';

export type ExtensionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type TemplateRoundId = string;

export type StartConditionTemplate =
  | { type: 'fixed_datetime'; datetime: string }
  | { type: 'after_previous'; roundId: TemplateRoundId }
  | { type: 'manual_trigger' };

export type EndConditionTemplate =
  | { type: 'fixed_datetime'; datetime: string }
  | { type: 'manual_close' }
  | { type: 'auto_close'; evaluationCount: number };

export type RoundTemplate = Omit<
  Round,
  'id' | 'programId' | 'createdAt' | 'updatedAt' | 'startCondition' | 'endCondition'
> & {
  templateId: TemplateRoundId;
  startCondition: StartConditionTemplate;
  endCondition: EndConditionTemplate;
};

export type RoundEdgeTemplate = Omit<
  RoundEdge,
  'id' | 'programId' | 'sourceRoundId' | 'targetRoundId' | 'createdAt'
> & {
  templateId: string;
  sourceTemplateRoundId: TemplateRoundId;
  targetTemplateRoundId: TemplateRoundId;
};

export interface WorkflowExtensionTemplate {
  rounds: RoundTemplate[];
  edges: RoundEdgeTemplate[];
}

export interface WorkflowExtension {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  difficulty: ExtensionDifficulty;
  featured?: boolean;
  estimatedSetupMinutes: number;
  template: WorkflowExtensionTemplate;
}

export interface InstalledWorkflowExtension {
  extensionId: string;
  version: string;
  installedAt: string; // ISO
}

