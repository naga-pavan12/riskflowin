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
        { id: 'inflow-plan', label: 'Planned Inflow', icon: TrendingUp },
        { id: 'engineering-demand', label: 'Planned Outflow', icon: Activity },
        { id: 'forecast-baseline', label: 'Forecast Baseline', icon: FileText },
        { id: 'risk-setup', label: 'Risk Setup', icon: Shield },
      ]
    },
    {
      label: 'ACTUALS',
      items: [
        { id: 'actual-inflow', label: 'Actual Inflow', icon: TrendingUp },
        { id: 'recorded-actuals', label: 'Actual Outflow', icon: Database },
        { id: 'current-month-actuals', label: 'Current Month Actuals', icon: Clock },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-app text-text-primary overflow-hidden">
      {/* Sidebar - Glassmorphism */}
      <aside className="w-[260px] relative z-20 flex flex-col border-r border-border-subtle bg-surface backdrop-blur-xl">
        {/* Logo Area */}
        <div className="px-6 py-8 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center shadow-lg shadow-brand/20 ring-1 ring-white/10">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-[16px] tracking-tight">
                RiskInflow Pro
              </div>
              <div className="text-text-muted text-[11px] font-medium uppercase tracking-wider">
                Decision Console
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label} className={sectionIndex > 0 ? 'mt-8' : ''}>
              {/* Section Label */}
              <div className="text-[10px] font-bold tracking-widest text-text-muted px-3 mb-3 uppercase">
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
                        group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                        transition-all duration-200 ease-out text-[13px] font-medium
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50
                        ${isActive
                          ? 'bg-brand/10 text-brand shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-brand/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover hover:translate-x-1'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand' : 'text-text-muted group-hover:text-text-secondary'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-border-subtle bg-surface-active/30">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
            <div className="text-[11px] font-medium text-text-secondary">System Operational</div>
          </div>
          <div className="mt-2 text-[10px] text-text-muted font-mono">
            v2.1.0 • Updated Feb 10
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative">
        {/* Background Ambient Glows */}
        <div className="fixed top-0 left-0 w-full h-[500px] bg-brand/5 blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}