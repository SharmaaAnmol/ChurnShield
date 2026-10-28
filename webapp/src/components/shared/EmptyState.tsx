import React from 'react';
import { motion } from 'motion/react';
import { Database, FileCode, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface EmptyStateProps {
  title: string;
  description: string;
  missingFile?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  missingFile,
  onRetry,
  isRetrying = false,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border border-dashed border-[#29332B] bg-[#111611]/80 p-8 text-center backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171D18] text-[#447A56] border border-[#29332B] shadow-inner">
        <Database className="h-7 w-7" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <h3 className="font-serif text-base font-medium text-[#F2F0E8]">{title}</h3>
        {missingFile && (
          <Badge variant="amber" size="sm" dot>
            Missing Export
          </Badge>
        )}
      </div>

      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#A6AEA5]">
        {description}
      </p>

      {missingFile && (
        <div className="mx-auto mt-5 max-w-md rounded-lg border border-[#29332B] bg-[#090B09] p-3.5 text-left text-xs font-tech">
          <div className="flex items-center justify-between text-[11px] text-[#A6AEA5] border-b border-[#29332B] pb-2 mb-2">
            <span className="flex items-center gap-1.5 text-[#F2F0E8]">
              <FileCode className="h-3.5 w-3.5 text-[#447A56]" />
              Expected static artifact:
            </span>
            <code className="text-[#447A56] bg-[#102016] border border-[#214D35] px-1.5 py-0.5 rounded">
              public/data/{missingFile}
            </code>
          </div>
          <div className="text-[11px] text-[#A6AEA5] leading-normal font-sans">
            To generate, run the export block in{' '}
            <span className="text-[#F2F0E8] font-tech">`ChurnShield_Customer_Inactivity_Prediction.ipynb`</span> or execute:
          </div>
          <div className="mt-2 flex items-center gap-2 rounded bg-[#171D18] px-2.5 py-1.5 text-[#447A56] font-tech">
            <span>$</span>
            <span className="text-[#F2F0E8]">python export_webapp_data.py</span>
          </div>
        </div>
      )}

      {onRetry && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRetrying ? 'animate-spin text-[#447A56]' : ''}`} />
            {isRetrying ? 'Checking Files...' : 'Check For Data'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
