import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import { MainLayout } from './components/Layout';
import { LoginPage } from './pages/Auth';

// ── Hive ────────────────────────────────────────────────────────────────────
import CommandCenterPage from '@/modules/hive/pages/CommandCenterPage';
import AgentsPage from '@/modules/hive/pages/AgentsPage';
import AgentDetailPage from '@/modules/hive/pages/AgentDetailPage';
import TriggersPage from '@/modules/hive/pages/TriggersPage';
import ApiExplorerPage from '@/modules/hive/pages/ApiExplorerPage';
import ConsolePage from '@/modules/hive/pages/ConsolePage';
import CostUsagePage from '@/modules/hive/pages/CostUsagePage';
import SkillsPage from '@/modules/hive/pages/SkillsPage';

// ── Workspace ───────────────────────────────────────────────────────────────
import WorkspaceDashboardPage from '@/modules/workspace/pages/WorkspaceDashboardPage';
import KanbanPage from '@/modules/workspace/pages/KanbanPage';
import DoneTasksPage from '@/modules/workspace/pages/DoneTasksPage';
import CalendarPage from '@/modules/workspace/pages/CalendarPage';
import NotesPage from '@/modules/workspace/pages/NotesPage';

// ── Synergy (Contracting) ───────────────────────────────────────────────────
import ContractingOverviewPage from '@/modules/contracting/pages/ContractingOverviewPage';
import LeadsPage from '@/modules/contracting/pages/LeadsPage';
import SubcontractorsPage from '@/modules/contracting/pages/SubcontractorsPage';
import VoiceCallsPage from '@/modules/contracting/pages/VoiceCallsPage';

// ── Real Estate ─────────────────────────────────────────────────────────────
import PropertiesPage from '@/modules/realestate/pages/PropertiesPage';
import PropertyDetailPage from '@/pages/RealEstate/PropertyDetailPage';
import DealAnalysisPage from '@/modules/realestate/pages/DealAnalysisPage';
import MarketDataPage from '@/modules/realestate/pages/MarketDataPage';

// ── Finance ─────────────────────────────────────────────────────────────────
import AccountsPage from '@/modules/finance/pages/AccountsPage';
import TransactionsPage from '@/modules/finance/pages/TransactionsPage';
import PlanningPage from '@/modules/finance/pages/PlanningPage';

// ── Settings ────────────────────────────────────────────────────────────────
import SettingsPage from '@/modules/settings/pages/SettingsPage';

// ── Screens ─────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {return <LoadingScreen />;}
  if (!session) {return <Navigate to="/login" replace />;}

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {return <LoadingScreen />;}
  if (session) {return <Navigate to="/hive" replace />;}

  return <>{children}</>;
}

// ── App ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected — wrapped in BusinessProvider + MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <BusinessProvider>
                  <MainLayout />
                </BusinessProvider>
              </ProtectedRoute>
            }
          >
            {/* Default: redirect to Command Center */}
            <Route index element={<Navigate to="/hive" replace />} />

            {/* Hive */}
            <Route path="hive" element={<CommandCenterPage />} />
            <Route path="hive/agents" element={<AgentsPage />} />
            <Route path="hive/agents/:id" element={<AgentDetailPage />} />
            <Route path="hive/triggers" element={<TriggersPage />} />
            <Route path="hive/api-explorer" element={<ApiExplorerPage />} />
            <Route path="hive/console" element={<ConsolePage />} />
            <Route path="hive/cost" element={<CostUsagePage />} />
            <Route path="hive/skills" element={<SkillsPage />} />

            {/* Workspace */}
            <Route path="workspace" element={<WorkspaceDashboardPage />} />
            <Route path="workspace/kanban" element={<KanbanPage />} />
            <Route path="workspace/kanban/done" element={<DoneTasksPage />} />
            <Route path="workspace/calendar" element={<CalendarPage />} />
            <Route path="workspace/notes" element={<NotesPage />} />

            {/* Synergy */}
            <Route path="synergy" element={<ContractingOverviewPage />} />
            <Route path="synergy/leads" element={<LeadsPage />} />
            <Route path="synergy/subs" element={<SubcontractorsPage />} />
            <Route path="synergy/calls" element={<VoiceCallsPage />} />

            {/* Real Estate */}
            <Route path="realestate" element={<PropertiesPage />} />
            <Route path="realestate/deals" element={<DealAnalysisPage />} />
            <Route path="realestate/market" element={<MarketDataPage />} />
            <Route path="realestate/:id" element={<PropertyDetailPage />} />

            {/* Finance */}
            <Route path="finance" element={<AccountsPage />} />
            <Route path="finance/transactions" element={<TransactionsPage />} />
            <Route path="finance/planning" element={<PlanningPage />} />

            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/hive" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
