# Schedule & Rounds Workflow Engine - Architecture Documentation

## Overview

The Schedule & Rounds workflow engine is an enterprise-grade system for managing complex evaluation workflows in an Award Management System (AMS). It supports unlimited rounds with linear, parallel, and conditional flows.

## Architecture

### Frontend Structure

```
components/dashboard/scheduleRounds/
├── ScheduleRoundsView.tsx      # Main container with view switcher
├── WorkflowView.tsx            # React Flow-based node editor
├── TileView.tsx                # Card-based summary view
├── RoundNode.tsx               # Custom React Flow node component
└── RoundConfigurationPanel.tsx # Round configuration modal/panel

types/
└── scheduleRounds.ts           # TypeScript type definitions
```

### Data Models

#### Round
Represents a single evaluation round with:
- **Basic Info**: name, type, description
- **Evaluation Settings**: logic type, evaluator strategy, blind evaluation
- **Timing**: start/end conditions (fixed datetime, after previous, manual, auto-close)
- **Shortlist**: configuration for announcing shortlists
- **Status**: draft, scheduled, active, completed, cancelled
- **Versioning**: supports configuration versioning for audit trails

#### RoundEdge
Represents connections between rounds:
- Source and target round IDs
- Conditional logic (always, if_shortlisted, if_score_gte, manual_approval)
- Order for multiple edges from same source

#### RoundWorkflow
Complete workflow representation:
- Collection of rounds
- Collection of edges
- Version tracking
- Timestamps

### View Modes

#### 1. Workflow View (Primary)
- **Technology**: React Flow
- **Features**:
  - Canvas-based node editor
  - Drag-and-drop node positioning
  - Animated dotted connections
  - Click nodes to configure
  - Visual representation of flow logic
  - Mini-map for navigation
  - Zoom and pan controls

#### 2. Tile View (Secondary)
- **Technology**: Framer Motion Reorder
- **Features**:
  - Card-based round display
  - Drag-to-reorder (visual only, doesn't affect logic)
  - Quick status overview
  - Click to configure
  - Summary information display

### Configuration Panel

Unified panel for both views that allows:
- Round name and type selection
- Evaluation logic configuration
- Evaluator assignment strategy
- Blind/non-blind toggle
- Start condition configuration:
  - Fixed datetime picker
  - After previous round selector
  - Manual trigger option
- End condition configuration:
  - Fixed datetime picker
  - Manual close option
  - Auto-close with evaluation count
- Shortlist configuration:
  - Enable/disable toggle
  - Percentage or fixed count
  - Visibility settings (admin/judges/public)

### Backend Integration Points

#### Data Storage
```typescript
// Round storage (JSON with versioning)
interface RoundStorage {
  id: string;
  programId: string;
  config: Round; // Full round configuration
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Edge storage (separate table)
interface EdgeStorage {
  id: string;
  programId: string;
  sourceRoundId: string;
  targetRoundId: string;
  condition: EdgeCondition;
  order: number;
  createdAt: string;
}

// Workflow metadata
interface WorkflowMetadata {
  programId: string;
  version: number;
  rounds: string[]; // Round IDs
  edges: string[]; // Edge IDs
  createdAt: string;
  updatedAt: string;
}
```

#### Event-Driven Execution

**Round Start Events:**
- Fixed datetime: Scheduled job triggers at specified time
- After previous: Listens for previous round completion event
- Manual trigger: Admin action via API

**Round End Events:**
- Fixed datetime: Scheduled job triggers at specified time
- Manual close: Admin action via API
- Auto-close: Monitors evaluation count, triggers when threshold reached

**Edge Condition Evaluation:**
- Always: Automatic progression
- If shortlisted: Checks shortlist status
- If score ≥ X: Evaluates average/aggregate score
- Manual approval: Waits for admin action

### Execution Flow

1. **Workflow Initialization**
   - Load rounds and edges from database
   - Build directed graph (DAG)
   - Validate graph structure (no cycles)
   - Initialize round states

2. **Round Activation**
   - Evaluate start conditions
   - Transition status: draft → scheduled → active
   - Notify evaluators
   - Start evaluation period

3. **Round Completion**
   - Evaluate end conditions
   - Process evaluations
   - Calculate shortlist (if enabled)
   - Transition status: active → completed
   - Emit completion event

4. **Edge Evaluation**
   - On round completion, evaluate all outgoing edges
   - Check edge conditions
   - Activate target rounds that meet conditions
   - Support parallel activation (multiple edges from same source)

5. **Shortlist Processing**
   - Calculate shortlist based on method (percentage/count)
   - Apply visibility rules
   - Notify relevant parties
   - Update submission statuses

### Scalability Considerations

1. **Graph Complexity**
   - No hardcoded limits on rounds or edges
   - Efficient graph traversal algorithms
   - Lazy loading for large workflows

2. **Versioning**
   - Round configurations are versioned
   - Supports rollback to previous versions
   - Audit trail for all changes

3. **Performance**
   - React Flow virtualization for large graphs
   - Debounced updates during editing
   - Optimistic UI updates

4. **Data Consistency**
   - Transaction-based updates
   - Validation before save
   - Conflict resolution for concurrent edits

### Future Extensions

1. **Templates**
   - Pre-configured workflow templates
   - Clone existing workflows
   - Import/export workflows

2. **Advanced Conditions**
   - Custom JavaScript expressions
   - Integration with external systems
   - Time-based conditions (business hours, holidays)

3. **Analytics**
   - Workflow performance metrics
   - Round completion times
   - Bottleneck identification

4. **Collaboration**
   - Multi-user editing
   - Comments and annotations
   - Approval workflows for changes

5. **Testing**
   - Workflow simulation mode
   - Dry-run execution
   - Validation rules

### Security Considerations

1. **Permissions**
   - Role-based access control
   - View vs. edit permissions
   - Round-level permissions

2. **Audit Logging**
   - All changes logged
   - User attribution
   - Timestamp tracking

3. **Data Validation**
   - Input sanitization
   - Type checking
   - Business rule validation

### API Endpoints (Future)

```
GET    /api/programs/:programId/workflow
POST   /api/programs/:programId/rounds
PUT    /api/rounds/:roundId
DELETE /api/rounds/:roundId
POST   /api/rounds/:roundId/edges
DELETE /api/edges/:edgeId
POST   /api/rounds/:roundId/start
POST   /api/rounds/:roundId/end
GET    /api/rounds/:roundId/audit
```

### Testing Strategy

1. **Unit Tests**
   - Round configuration validation
   - Edge condition evaluation
   - Status transition logic

2. **Integration Tests**
   - Workflow execution
   - Event handling
   - Database operations

3. **E2E Tests**
   - User workflows
   - Round creation and editing
   - View switching

## Usage Examples

### Creating a Simple Linear Workflow

1. Add Round 1 (Jury Round)
2. Configure start: Manual trigger
3. Configure end: Manual close
4. Add Round 2 (Public Round)
5. Create edge from Round 1 to Round 2
6. Set edge condition: "If shortlisted"

### Creating a Parallel Workflow

1. Add Round 1 (Initial Screening)
2. Add Round 2A (Technical Review)
3. Add Round 2B (Design Review)
4. Create edges: Round 1 → Round 2A, Round 1 → Round 2B
5. Both 2A and 2B activate simultaneously when Round 1 completes

### Creating a Conditional Workflow

1. Add Round 1 (Scoring)
2. Add Round 2A (High Score Path)
3. Add Round 2B (Review Path)
4. Create edge Round 1 → Round 2A with condition: "If score ≥ 8"
5. Create edge Round 1 → Round 2B with condition: "Always"

## Notes

- The workflow engine is designed to be flexible and extensible
- No assumptions about linear flow - supports any DAG structure
- All logic is stored in the database, not hardcoded in UI
- Versioning ensures auditability and rollback capability
- Event-driven architecture allows for real-time updates and notifications

