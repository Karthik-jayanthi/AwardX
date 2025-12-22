import { rounds as supabaseRounds, getCurrentOrgId, supabase } from './supabase';
import { Round, RoundEdge } from '../types/scheduleRounds';

// Convert database round to scheduleRounds Round type
export function dbRoundToScheduleRound(dbRound: any): Round {
  const settings = dbRound.settings || {};
  
  // Extract dates from start/end conditions if they exist
  const startDate = settings.startCondition?.type === 'fixed_datetime' 
    ? settings.startCondition.datetime 
    : dbRound.start_date;
  
  const endDate = settings.endCondition?.type === 'fixed_datetime'
    ? settings.endCondition.datetime
    : dbRound.end_date;

  return {
    id: dbRound.id,
    programId: dbRound.program_id,
    name: settings.name || dbRound.title || 'Untitled Round',
    type: settings.type || (dbRound.type as Round['type']) || 'jury',
    description: dbRound.description || settings.description,
    evaluationLogic: settings.evaluationLogic || 'scoring',
    evaluatorStrategy: settings.evaluatorStrategy || 'all_judges',
    blindEvaluation: settings.blindEvaluation ?? false,
    startCondition: settings.startCondition || { type: 'manual_trigger' },
    endCondition: settings.endCondition || { type: 'manual_close' },
    shortlistConfig: settings.shortlistConfig || {
      enabled: false,
      method: 'percentage',
      value: 50,
      visibility: ['admin'],
    },
    order: dbRound.sort_order ?? settings.order ?? 0,
    status: mapStatusToScheduleRound(dbRound.status),
    createdAt: dbRound.created_at || new Date().toISOString(),
    updatedAt: settings.updatedAt || dbRound.created_at || new Date().toISOString(),
    version: settings.version || 1,
    metadata: settings.metadata,
  };
}

// Convert scheduleRounds Round type to database format
export function scheduleRoundToDbRound(round: Round): {
  program_id: string;
  title: string;
  description?: string | null;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  sort_order: number;
  settings: any;
} {
  // Extract fixed dates if available
  let startDate = new Date().toISOString();
  let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default: 7 days from now

  if (round.startCondition.type === 'fixed_datetime') {
    startDate = round.startCondition.datetime;
  }

  if (round.endCondition.type === 'fixed_datetime') {
    endDate = round.endCondition.datetime;
  }

  return {
    program_id: round.programId,
    title: round.name,
    description: round.description || null,
    type: round.type,
    start_date: startDate,
    end_date: endDate,
    status: mapStatusToDb(round.status),
    sort_order: round.order,
    settings: {
      name: round.name,
      type: round.type,
      description: round.description,
      evaluationLogic: round.evaluationLogic,
      evaluatorStrategy: round.evaluatorStrategy,
      blindEvaluation: round.blindEvaluation,
      startCondition: round.startCondition,
      endCondition: round.endCondition,
      shortlistConfig: round.shortlistConfig,
      updatedAt: round.updatedAt,
      version: round.version,
      metadata: round.metadata,
    },
  };
}

// Status mapping functions
function mapStatusToScheduleRound(dbStatus: string): Round['status'] {
  const statusMap: Record<string, Round['status']> = {
    'upcoming': 'scheduled',
    'active': 'active',
    'completed': 'completed',
    'draft': 'draft',
    'cancelled': 'cancelled',
    'scheduled': 'scheduled',
  };
  return statusMap[dbStatus?.toLowerCase()] || 'draft';
}

function mapStatusToDb(status: Round['status']): string {
  const statusMap: Record<Round['status'], string> = {
    'draft': 'draft',
    'scheduled': 'upcoming',
    'active': 'active',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };
  return statusMap[status] || 'draft';
}

// Store edges in localStorage for now (can be moved to database later)
// Key format: scheduleRounds_edges_{programId}
const EDGES_STORAGE_PREFIX = 'scheduleRounds_edges_';

export function getEdgesForProgram(programId: string): RoundEdge[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(`${EDGES_STORAGE_PREFIX}${programId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load edges from localStorage:', error);
    return [];
  }
}

export function saveEdgesForProgram(programId: string, edges: RoundEdge[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${EDGES_STORAGE_PREFIX}${programId}`, JSON.stringify(edges));
  } catch (error) {
    console.error('Failed to save edges to localStorage:', error);
  }
}

// Main service functions
export const scheduleRoundsService = {
  // Get all rounds for a program
  async getRounds(programId: string): Promise<Round[]> {
    const { data, error } = await supabaseRounds.getByProgram(programId);
    
    if (error || !data) {
      console.error('Failed to load rounds:', error);
      return [];
    }

    return data.map(dbRoundToScheduleRound);
  },

  // Create a new round
  async createRound(round: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>): Promise<Round> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbRound = scheduleRoundToDbRound({
      ...round,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Round);
    
    console.log('Creating round in database:', { program_id: dbRound.program_id, title: dbRound.title, settings: dbRound.settings });
    
    const { data, error } = await supabase
      .from('rounds')
      .insert({
        program_id: dbRound.program_id,
        title: dbRound.title,
        description: dbRound.description,
        type: dbRound.type,
        start_date: dbRound.start_date,
        end_date: dbRound.end_date,
        status: dbRound.status,
        sort_order: dbRound.sort_order,
        settings: dbRound.settings,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create round:', error);
      throw new Error(error?.message || 'Failed to create round');
    }

    console.log('Round created successfully:', data.id);
    return dbRoundToScheduleRound(data);
  },

  // Update an existing round
  async updateRound(round: Round): Promise<Round> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbRound = scheduleRoundToDbRound(round);
    
    console.log('Updating round in database:', { id: round.id, title: dbRound.title, settings: dbRound.settings });
    
    // Use direct supabase call to update all fields including settings
    const { data, error } = await supabase
      .from('rounds')
      .update({
        title: dbRound.title,
        description: dbRound.description,
        type: dbRound.type,
        start_date: dbRound.start_date,
        end_date: dbRound.end_date,
        status: dbRound.status,
        sort_order: dbRound.sort_order,
        settings: dbRound.settings,
      })
      .eq('id', round.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update round:', error);
      throw new Error(error?.message || 'Failed to update round');
    }

    console.log('Round updated successfully:', data.id);
    return dbRoundToScheduleRound(data);
  },

  // Delete a round
  async deleteRound(roundId: string): Promise<void> {
    const { error } = await supabaseRounds.delete(roundId);
    
    if (error) {
      throw new Error(error.message || 'Failed to delete round');
    }
  },

  // Get edges for a program
  getEdges(programId: string): RoundEdge[] {
    return getEdgesForProgram(programId);
  },

  // Save edges for a program
  saveEdges(programId: string, edges: RoundEdge[]): void {
    saveEdgesForProgram(programId, edges);
  },
};

