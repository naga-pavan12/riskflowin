import React from 'react';
import { RefreshCw, Download, Share2, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';

import { useProjectStore } from '../../../store/useProjectStore';

export function TopBar() {
  const { months, config, updateConfig } = useProjectStore();

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between flex-shrink-0">
      {/* Left Side */}
      <div className="flex items-center gap-6">
        {/* Project Switcher */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg hover:border-black transition-all cursor-pointer shadow-sm group">
          <div>
            <div className="text-black text-[13px] font-bold">
              {config.name}
            </div>
            <div className="text-zinc-500 text-[11px] font-medium group-hover:text-black transition-colors">
              PM-2025-001
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
        </div>

        {/* As-of Month */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[13px] font-medium">As of</span>
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-black text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer hover:bg-zinc-100 transition-colors"
              value={config.asOfMonth}
              onChange={(e) => updateConfig({ asOfMonth: e.target.value })}
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-black hover:bg-zinc-100">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-black hover:bg-zinc-100">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-black hover:bg-zinc-100">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </header>
  );
}
