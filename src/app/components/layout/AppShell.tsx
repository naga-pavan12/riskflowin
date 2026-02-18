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
  Shield,
  LogOut,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

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
        { id: 'engineering-demand', label: 'Planned Outflow', icon: Activity },
        { id: 'inflow-plan', label: 'Planned Inflow', icon: TrendingUp },
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
    },
  ];

  return (
    <div className="flex h-screen bg-[#F6F6F6] text-black overflow-hidden font-sans">
      {/* Sidebar - Uber Black */}
      <aside className="w-[260px] relative z-20 flex flex-col bg-black text-white shrink-0">
        {/* Logo Area */}
        <div className="px-6 py-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-[18px] tracking-tight leading-none">
                RiskInflow
              </div>
              <div className="text-zinc-500 text-[10px] font-bold tracking-widest mt-1">
                NAVIGATOR
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
          {navigationSections.map((section) => (
            <div key={section.label}>
              {/* Section Label */}
              <div className="text-[10px] font-bold tracking-widest text-zinc-600 px-3 mb-3 uppercase">
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
                      className={clsx(
                        "group w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-white text-black font-bold"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                      )}
                    >
                      <Icon className={clsx("w-4 h-4", isActive ? "text-black" : "text-zinc-500 group-hover:text-white")} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-zinc-900">
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-zinc-900 transition-colors">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
              JD
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-white leading-none">John Doe</div>
              <div className="text-xs text-zinc-500 mt-1">Project Director</div>
            </div>
            <LogOut size={16} className="text-zinc-600" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#F6F6F6]">
        {/* Sticky Header - Minimalist */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight capitalize">
              {currentView.replace(/-/g, ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
              Last updated: Just now
            </span>
          </div>
        </header>

        {/* Content Injector */}
        <div className="p-0">
          {children}
        </div>
      </main>
    </div>
  );
}