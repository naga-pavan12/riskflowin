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
import { ForecastBaseline } from './components/config/ForecastBaseline';
import { RecordedActuals } from './components/config/RecordedActuals';
import { ExecutiveConsole } from './components/dashboard/ExecutiveConsole';
// Design tokens moved to artifact: .gemini/antigravity/brain/<conversation-id>/design-system.md
import { type MonthRisk } from './data/sampleData';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<MonthRisk | null>(null);
  const [monthDrawerOpen, setMonthDrawerOpen] = useState(false);
  const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);

  const handleMonthClick = (month: MonthRisk) => {
    setSelectedMonth(month);
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
      case 'forecast-baseline':
        return <ForecastBaseline />;
      case 'recorded-actuals':
        return <RecordedActuals />;
      case 'executive-console':
        return <ExecutiveConsole />;
      // Design tokens view removed - see design-system.md artifact
      default:
        return <Dashboard onMonthClick={handleMonthClick} />;
    }
  };

  return (
    <div className="dark">
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
        <MonthDetailDrawer
          month={selectedMonth}
          open={monthDrawerOpen}
          onClose={() => setMonthDrawerOpen(false)}
          onAdvancedClick={handleAdvancedClick}
        />

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