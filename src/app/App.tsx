import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { AppShell } from './components/layout/AppShell';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { MonthDetailDrawer } from './components/dashboard/MonthDetailDrawer';
import { AdvancedDrawer } from './components/dashboard/AdvancedDrawer';
import { ProjectSetup } from './components/config/ProjectSetup';
import { InflowPlan } from './components/config/InflowPlan';
import { EngineeringDemand } from './components/config/EngineeringDemand';
import { RecordedActuals } from './components/config/RecordedActuals';
import { CurrentMonthActuals } from './components/config/CurrentMonthActuals';
import { RiskSetup } from './components/config/RiskSetup';
import { ActualInflow } from './components/config/ActualInflow';
// Design tokens moved to artifact: .gemini/antigravity/brain/<conversation-id>/design-system.md
import { type MonthRisk } from './data/sampleData';

import { Zap, BrainCircuit } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthDrawerOpen, setMonthDrawerOpen] = useState(false);
  const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);


  const handleMonthClick = (month: MonthRisk) => {
    setSelectedMonth(month.month);
    setMonthDrawerOpen(true);
  };

  const handleAdvancedClick = () => {
    setMonthDrawerOpen(false);
    setAdvancedDrawerOpen(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onMonthClick={handleMonthClick} />;
      case 'project-setup':
        return <ProjectSetup />;
      case 'inflow-plan':
        return <InflowPlan />;
      case 'engineering-demand':
        return <EngineeringDemand />;
      case 'recorded-actuals':
        return <RecordedActuals />;
      case 'current-month-actuals':
        return <CurrentMonthActuals />;
      case 'risk-setup':
        return <RiskSetup />;
      case 'actual-inflow':
        return <ActualInflow />;
      // Design tokens view removed - see design-system.md artifact
      default:
        return <Dashboard onMonthClick={handleMonthClick} />;
    }
  };

  return (
    <div>
      <AppShell currentView={currentView} onNavigate={setCurrentView}>
        <TopBar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="px-8 py-8"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Drawers */}
        <ErrorBoundary componentName="MonthDetailDrawer">
          <MonthDetailDrawer
            month={selectedMonth}
            open={monthDrawerOpen}
            onClose={() => setMonthDrawerOpen(false)}
            onAdvancedClick={handleAdvancedClick}
          />
        </ErrorBoundary>

        <AdvancedDrawer
          open={advancedDrawerOpen}
          onClose={() => setAdvancedDrawerOpen(false)}
        />
      </AppShell>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--graphite-800)',
            border: '1px solid var(--divider)',
            color: 'var(--text-primary)'
          }
        }}
      />
    </div>
  );
}