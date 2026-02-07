import React from 'react';
import { RefreshCw, Download, Share2, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';

export function TopBar() {
  return (
    <header className="h-16 bg-[var(--surface-base)] border-b border-[var(--divider)] px-8 flex items-center justify-between flex-shrink-0">
      {/* Left Side */}
      <div className="flex items-center gap-6">
        {/* Project Switcher */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--divider)] rounded-[var(--radius-md)] hover:border-[var(--accent-blue)] transition-all cursor-pointer">
          <div>
            <div className="text-[var(--text-primary)] text-[13px] font-medium">
              Platform Modernization 2025
            </div>
            <div className="text-[var(--text-tertiary)] text-[11px]">
              PM-2025-001
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        </div>

        {/* As-of Month */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)] text-[13px]">As of</span>
          <select
            className="px-3 py-1.5 bg-[var(--surface-elevated)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] cursor-pointer"
            defaultValue="feb-2026"
          >
            <option value="jan-2026">Jan 2026</option>
            <option value="feb-2026">Feb 2026</option>
            <option value="mar-2026">Mar 2026</option>
          </select>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </header>
  );
}
