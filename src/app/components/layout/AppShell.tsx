import React from 'react';
import {
  LayoutDashboard,
  Settings,
  TrendingUp,
  FileText,
  Database,
  Calendar,
  Activity
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'project-setup', label: 'Project Setup', icon: Settings },
    { id: 'inflow-plan', label: 'Inflow Plan', icon: TrendingUp },
    { id: 'engineering-demand', label: 'Engineering Demand', icon: Activity },
    { id: 'forecast-baseline', label: 'Forecast Baseline', icon: FileText },
    { id: 'forecast-baseline', label: 'Forecast Baseline', icon: FileText },
    { id: 'recorded-actuals', label: 'Recorded Actuals', icon: Database },
    { id: 'executive-console', label: 'Executive Console', icon: Activity }
  ];

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[var(--surface-base)] border-r border-[var(--divider)] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[var(--divider)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[var(--text-primary)] font-semibold text-[15px]">
                RiskInflow Pro
              </div>
              <div className="text-[var(--text-tertiary)] text-[11px]">
                Decision Console
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] 
                  transition-all text-[14px] font-medium
                  ${isActive
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--divider)]">
          <div className="text-[var(--text-tertiary)] text-[11px]">
            v2.1.0 • Updated Feb 5
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}