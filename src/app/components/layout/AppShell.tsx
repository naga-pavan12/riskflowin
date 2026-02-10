import React from 'react';
import {
  LayoutDashboard,
  Settings,
  TrendingUp,
  FileText,
  Database,
  Activity,
  Clock,
  FileBarChart,
  Target,
  Shield
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
  const navigationSections: NavSection[] = [
    {
      label: 'CONSOLE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'project-setup', label: 'Project Setup', icon: Settings },
      ]
    },
    {
      label: 'PLANNING',
      items: [
        { id: 'inflow-plan', label: 'Inflow Plan', icon: TrendingUp },
        { id: 'engineering-demand', label: 'Engineering Demand', icon: Activity },
        { id: 'forecast-baseline', label: 'Forecast Baseline', icon: FileText },
        { id: 'risk-setup', label: 'Risk Setup', icon: Shield },
      ]
    },
    {
      label: 'ACTUALS',
      items: [
        { id: 'recorded-actuals', label: 'Recorded Actuals', icon: Database },
        { id: 'current-month-actuals', label: 'Current Month Actuals', icon: Clock },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#0f0f11]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#0f0f11] border-r border-slate-800/60 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-[15px]">
                RiskInflow Pro
              </div>
              <div className="text-slate-500 text-[11px] font-medium">
                Decision Console
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {/* Section Label */}
              <div className="text-[11px] font-semibold tracking-widest text-slate-500 px-3 mb-2">
                {section.label}
              </div>

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                        transition-all duration-150 ease-out text-[14px] font-medium
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                        ${isActive
                          ? 'relative bg-blue-500/90 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_10px_25px_-15px_rgba(59,130,246,0.65)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-white/70'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/55 active:scale-[0.99] active:bg-slate-700/40'
                        }
`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60">
          <div className="text-[11px] leading-4 text-slate-500 font-mono">
            v2.1.0 • Updated Feb 5
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}