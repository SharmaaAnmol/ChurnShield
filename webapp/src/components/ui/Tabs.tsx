import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-lg bg-[#111611] border border-[#29332B]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
              isActive
                ? 'bg-[#214D35] text-[#F2F0E8] shadow-sm border border-[#447A56]'
                : 'text-[#A6AEA5] hover:text-[#F2F0E8] hover:bg-[#171D18]'
            )}
          >
            {tab.icon && <span className="opacity-80">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded text-[10px] font-tech',
                  isActive ? 'bg-[#111611] text-[#F2F0E8]' : 'bg-[#171D18] text-[#A6AEA5]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
