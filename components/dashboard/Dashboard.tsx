
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { EventSelectionView } from './EventSelectionView';
import { DashboardOverview } from './DashboardOverview';
import { FormBuilderView } from './FormBuilderView';
import { SubmissionTable } from './SubmissionTable';
import { JudgingView } from './JudgingView';
import { SettingsView } from './SettingsView';
import { ReachView } from './ReachView';
import { TeamsView } from './TeamsView';
import { AuditLogsView } from './AuditLogsView';
import { CategoriesView } from './CategoriesView';
import { ScheduleView } from './ScheduleView';
import { SubmissionProcessView } from './SubmissionProcessView'; // Import new view
import { ProgramDetailsView } from './ProgramDetailsView';
import { PageBuilder } from './builder/PageBuilder';
import { CustomGridView } from './CustomGridView';
import { motion, AnimatePresence } from 'framer-motion';
import { Program } from '../../services/models';
import { db as databaseService, workspaceState } from '../../services/database';
import { auth } from '../../services/supabase';
import { ErrorBoundary } from '../ErrorBoundary';

const ScheduleRoundsView = lazy(() =>
  import('./scheduleRounds/ScheduleRoundsView').then((m) => ({ default: m.ScheduleRoundsView })),
);
const AnalyticsView = lazy(() => import('./AnalyticsView').then((m) => ({ default: m.AnalyticsView })));

const ViewLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeEvent, setActiveEvent] = useState<Program | null>(null);
  const [currentView, setCurrentView] = useState('overview');
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore workspace state on init
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const initializeDashboard = async () => {
          await databaseService.initialize();

          const params = new URLSearchParams(window.location.search);
          const viewParam = params.get('view');
          const tabParam = params.get('tab');
          if (!cancelled && (viewParam === 'settings' || tabParam === 'billing')) {
            setCurrentView('settings');
          }

          // Restore persisted workspace state
          const { user } = await auth.getUser();
          if (user) {
            const { data: ws } = await workspaceState.get(user.id);
            if (ws) {
              if (!cancelled && ws.current_view) setCurrentView(ws.current_view);
              if (ws.active_program_id) {
                // Load the program
                const programs = await databaseService.getPrograms();
                const restored = programs.find(p => p.id === ws.active_program_id);
                if (!cancelled && restored) setActiveEvent(restored);
              }
            }
          }
        };

        await Promise.race([
          initializeDashboard(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Dashboard initialization timed out')), 10000),
          ),
        ]);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };
    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist workspace state on change
  useEffect(() => {
    databaseService.setActiveProgram(activeEvent?.id || null);

    const persistState = async () => {
      try {
        const { user } = await auth.getUser();
        if (user) {
          await workspaceState.save(user.id, {
            active_program_id: activeEvent?.id || null,
            current_view: currentView,
          });
        }
      } catch {
        // Non-critical — don't block UI
      }
    };
    persistState();
  }, [activeEvent, currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <DashboardOverview activeEvent={activeEvent} onNavigate={setCurrentView} />;
      case 'custom-grid':
        return <CustomGridView />;
      case 'builder':
        return activeEvent ? <PageBuilder programId={activeEvent.id} /> : null;

      case 'schedule':
        return <ScheduleView activeEvent={activeEvent} />;
      case 'schedule-rounds':
        return (
          <Suspense fallback={<ViewLoader />}>
            <ScheduleRoundsView activeEvent={activeEvent} />
          </Suspense>
        );
      case 'submission-setup':
        return <SubmissionProcessView activeEvent={activeEvent} />;
      case 'awards':
        return <CategoriesView activeEvent={activeEvent} />;
      case 'templates':
        return <FormBuilderView activeEvent={activeEvent} />;
      case 'submissions':
        return <SubmissionTable activeEvent={activeEvent} />;

      case 'judging':
        return <JudgingView activeEvent={activeEvent} />;
      case 'reach':
        return <ReachView />;
      case 'analytics':
        return (
          <Suspense fallback={<ViewLoader />}>
            <AnalyticsView activeEvent={activeEvent} />
          </Suspense>
        );
      case 'teams':
        return <TeamsView activeEvent={activeEvent} />;
      case 'logs':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView activeEvent={activeEvent} />;
      case 'program-details':
        return <ProgramDetailsView activeEvent={activeEvent} />;
      default:
        return activeEvent?.type === 'Other' ? <CustomGridView /> : <DashboardOverview activeEvent={activeEvent} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <motion.div
        key="event-hub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <EventSelectionView
          onSelectEvent={setActiveEvent}
          onLogout={onLogout}
        />
      </motion.div>
    );
  }

  return (
    <DashboardLayout
      currentView={currentView}
      activeEvent={activeEvent}
      onChangeView={setCurrentView}
      onLogout={onLogout}
      onSwitchEvent={() => setActiveEvent(null)}
      noPadding={currentView === 'awards' || currentView === 'templates' || currentView === 'submission-setup' || currentView === 'schedule-rounds' || currentView === 'builder'}
      hideHeader={currentView === 'builder'}
    >
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <ErrorBoundary resetKey={`${currentView}:${activeEvent?.id || 'none'}`}>
          {renderView()}
        </ErrorBoundary>
      </motion.div>
    </DashboardLayout>
  );
};
